import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { startAIAnalysis, streamLogs, downloadResult } from '@services/variance/variance-apis';

const AIAnalysis = () => {
  const { t } = useTranslation();
  const [excelFiles, setExcelFiles] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('upload'); // upload, analyze, generate, complete
  const [statusText, setStatusText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [autoDownloaded, setAutoDownloaded] = useState(false);
  const [logStats, setLogStats] = useState({ total: 0, errors: 0, warnings: 0, success: 0 });

  // Use a ref to maintain a counter for unique log IDs
  const logIdCounter = useRef(0);
  // Store polling interval and timeout refs for cleanup
  const pollIntervalRef = useRef(null);
  const pollTimeoutRef = useRef(null);

  const handleExcelChange = (e) => {
    setExcelFiles(Array.from(e.target.files));
  };

  // Helper function to categorize log messages and add metadata
  const categorizeLog = (message) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let level = 'info';
    let icon = '📝';
    let color = 'text-gray-300';

    // Detect log level from message content
    if (message.includes('✅') || message.toLowerCase().includes('complete') || message.toLowerCase().includes('success') || message.toLowerCase().includes('found')) {
      level = 'success';
      icon = '✅';
      color = 'text-green-400';
    } else if (message.includes('⚠️') || message.toLowerCase().includes('warning') || message.toLowerCase().includes('failed')) {
      level = 'warning';
      icon = '⚠️';
      color = 'text-yellow-400';
    } else if (message.includes('❌') || message.toLowerCase().includes('error')) {
      level = 'error';
      icon = '❌';
      color = 'text-red-400';
    } else if (message.includes('📊') || message.toLowerCase().includes('processing') || message.toLowerCase().includes('chunk')) {
      level = 'processing';
      icon = '📊';
      color = 'text-blue-400';
    } else if (message.includes('🔄') || message.toLowerCase().includes('starting')) {
      level = 'info';
      icon = '🔄';
      color = 'text-cyan-400';
    } else if (message.includes('📡')) {
      level = 'system';
      icon = '📡';
      color = 'text-purple-400';
    }

    // Increment counter for unique ID
    logIdCounter.current += 1;

    return {
      timestamp,
      message,
      level,
      icon,
      color,
      id: `log-${logIdCounter.current}-${Date.now()}` // Unique ID for React keys
    };
  };

  const handleDownload = useCallback(async () => {
    if (!sessionId) return;

    try {
      const blob = await downloadResult(sessionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai_variance_analysis_${sessionId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert(`Download failed: ${error.message}`);
    }
  }, [sessionId]);

  const startPollingForCompletion = useCallback(async (sid) => {
    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }

    const logEntry = categorizeLog('🔄 Polling for analysis completion...');
    setLogs((prev) => [...prev, logEntry]);

    // Track which logs we've already shown to avoid duplicates
    const shownLogs = new Set();

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/finance/api/status/${sid}`);

        if (!response.ok) {
          throw new Error('Failed to check status');
        }

        const data = await response.json();

        // Update progress bar if we have progress data
        if (data.progress !== undefined && data.progress > 0) {
          setProgress(data.progress);
          if (data.progress_message) {
            setStatusText(data.progress_message);
          }
        }

        // Add new logs to the display
        if (data.recent_logs && Array.isArray(data.recent_logs)) {
          const newLogs = data.recent_logs
            .filter(log => !shownLogs.has(log))
            .map(log => {
              shownLogs.add(log);
              return categorizeLog(log);
            });

          if (newLogs.length > 0) {
            setLogs((prev) => [...prev, ...newLogs]);
            // Update log stats
            newLogs.forEach(log => {
              setLogStats((prev) => ({
                ...prev,
                total: prev.total + 1,
                errors: prev.errors + (log.level === 'error' ? 1 : 0),
                warnings: prev.warnings + (log.level === 'warning' ? 1 : 0),
                success: prev.success + (log.level === 'success' ? 1 : 0),
              }));
            });
          }
        }

        if (data.file_ready && data.status === 'completed') {
          clearInterval(pollIntervalRef.current);
          clearTimeout(pollTimeoutRef.current);

          const successLog = categorizeLog('✅ Analysis completed successfully!');
          setLogs((prev) => [...prev, successLog]);
          setLogStats((prev) => ({ ...prev, success: prev.success + 1, total: prev.total + 1 }));

          setProgress(100);
          setStage('complete');
          setStatusText('Analysis completed successfully!');
          setIsProcessing(false);
        } else if (data.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          clearTimeout(pollTimeoutRef.current);

          const errorLog = categorizeLog('❌ Analysis failed');
          setLogs((prev) => [...prev, errorLog]);
          setLogStats((prev) => ({ ...prev, errors: prev.errors + 1, total: prev.total + 1 }));

          setError('Analysis failed');
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Don't stop polling on error, just log it
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 5 minutes max
    pollTimeoutRef.current = setTimeout(() => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (isProcessing) {
        const timeoutLog = categorizeLog('⚠️ Polling timeout. Please check manually.');
        setLogs((prev) => [...prev, timeoutLog]);
        setLogStats((prev) => ({ ...prev, warnings: prev.warnings + 1, total: prev.total + 1 }));
      }
    }, 300000);
  }, [isProcessing]);

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-download when analysis completes
  useEffect(() => {
    if (stage === 'complete' && sessionId && !autoDownloaded) {
      setAutoDownloaded(true);
      setTimeout(() => {
        handleDownload();
      }, 500);
    }
  }, [stage, sessionId, autoDownloaded, handleDownload]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (excelFiles.length === 0) {
      alert(t('noExcelSelected'));
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStage('upload');
    setStatusText('Uploading files...');
    setLogs([]);
    setError(null);
    setAutoDownloaded(false);
    setLogStats({ total: 0, errors: 0, warnings: 0, success: 0 });

    const formData = new FormData();
    excelFiles.forEach((file) => {
      formData.append('excel_files', file);
    });

    try {
      // Start analysis
      const session = await startAIAnalysis(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(Math.min(percentCompleted, 20));
      });

      setSessionId(session.session_id);
      setProgress(25);
      setStage('analyze');
      setStatusText('AI analyzing data...');

      // Stream logs
      const eventSource = streamLogs(session.session_id);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Ignore heartbeat messages
        if (data.type === 'heartbeat') {
          return;
        }

        if (data.type === 'log') {
          const logEntry = categorizeLog(data.message);
          setLogs((prev) => [...prev, logEntry]);

          // Update log statistics
          setLogStats((prev) => ({
            total: prev.total + 1,
            errors: prev.errors + (logEntry.level === 'error' ? 1 : 0),
            warnings: prev.warnings + (logEntry.level === 'warning' ? 1 : 0),
            success: prev.success + (logEntry.level === 'success' ? 1 : 0)
          }));
        } else if (data.type === 'progress') {
          setProgress(data.percentage);
          setStatusText(data.message);

          // Add progress updates to logs as well
          const logEntry = categorizeLog(`[${data.percentage}%] ${data.message}`);
          setLogs((prev) => [...prev, logEntry]);

          if (data.percentage >= 25 && data.percentage < 85) {
            setStage('analyze');
          } else if (data.percentage >= 85 && data.percentage < 100) {
            setStage('generate');
          } else if (data.percentage >= 100) {
            setStage('complete');
          }
        } else if (data.type === 'complete') {
          setProgress(100);
          setStage('complete');
          setStatusText('Analysis completed successfully!');
          setIsProcessing(false);

          const logEntry = categorizeLog('✅ Analysis completed successfully!');
          setLogs((prev) => [...prev, logEntry]);
          setLogStats((prev) => ({ ...prev, success: prev.success + 1, total: prev.total + 1 }));

          eventSource.close();
        } else if (data.type === 'error') {
          setError(data.message);
          setIsProcessing(false);

          const logEntry = categorizeLog(`❌ Error: ${data.message}`);
          setLogs((prev) => [...prev, logEntry]);
          setLogStats((prev) => ({ ...prev, errors: prev.errors + 1, total: prev.total + 1 }));

          eventSource.close();
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Error:', err);
        const logEntry = categorizeLog('⚠️ Connection interrupted. Switching to polling mode...');
        setLogs((prev) => [...prev, logEntry]);
        setLogStats((prev) => ({ ...prev, warnings: prev.warnings + 1, total: prev.total + 1 }));
        eventSource.close();

        // Start polling for completion
        if (session.session_id) {
          startPollingForCompletion(session.session_id);
        }
      };
    } catch (error) {
      setError(error.response?.data?.detail || error.message);
      setIsProcessing(false);
    }
  };

  const getStageIcon = (stageName) => {
    const icons = {
      upload: '📤',
      analyze: '🧠',
      generate: '📊',
      complete: '✅',
    };
    return icons[stageName];
  };

  const isStageActive = (stageName) => {
    const stages = ['upload', 'analyze', 'generate', 'complete'];
    const currentIndex = stages.indexOf(stage);
    const checkIndex = stages.indexOf(stageName);
    return checkIndex === currentIndex;
  };

  const isStageCompleted = (stageName) => {
    const stages = ['upload', 'analyze', 'generate', 'complete'];
    const currentIndex = stages.indexOf(stage);
    const checkIndex = stages.indexOf(stageName);
    return checkIndex < currentIndex;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel - Upload & Progress */}
      <div className="bg-white dark:bg-[#222] rounded-xl shadow-lg p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('uploadRun')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Excel Files */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('excelLabel')}
            </label>
            <input
              type="file"
              accept=".xlsx"
              multiple
              onChange={handleExcelChange}
              disabled={isProcessing}
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 dark:disabled:bg-gray-700"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('excelHelp')}</p>
            {excelFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected files:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                  {excelFiles.map((file, idx) => (
                    <li key={idx}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* AI Features */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">{t('aiInfoTitle')}</h3>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-lg">🧠</span>
                <div className="text-sm">
                  <strong className="text-gray-800 dark:text-gray-200">{t('autoMateriality')}</strong>
                  <p className="text-gray-600 dark:text-gray-400">{t('autoMaterialityDesc')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-lg">🔍</span>
                <div className="text-sm">
                  <strong className="text-gray-800 dark:text-gray-200">{t('smartFocus')}</strong>
                  <p className="text-gray-600 dark:text-gray-400">{t('smartFocusDesc')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-lg">📝</span>
                <div className="text-sm">
                  <strong className="text-gray-800 dark:text-gray-200">{t('detailedExplanations')}</strong>
                  <p className="text-gray-600 dark:text-gray-400">{t('detailedExplanationsDesc')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing || excelFiles.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {isProcessing ? '🔄 Processing...' : t('aiProcessBtn')}
          </button>
        </form>

        {/* Progress Section */}
        {isProcessing && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">🤖 AI Analysis Progress</h3>

            {/* Progress Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-500 flex items-center justify-center text-white text-xs font-bold"
                  style={{ width: `${progress}%` }}
                >
                  {progress > 10 && `${progress}%`}
                </div>
              </div>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
            </div>

            {/* Stage Indicators */}
            <div className="flex justify-between items-center">
              {['upload', 'analyze', 'generate', 'complete'].map((stageName) => (
                <div
                  key={stageName}
                  className={`flex flex-col items-center space-y-1 ${
                    isStageActive(stageName)
                      ? 'scale-110 transform'
                      : isStageCompleted(stageName)
                      ? 'opacity-50'
                      : 'opacity-30'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      isStageActive(stageName)
                        ? 'bg-blue-500 animate-pulse'
                        : isStageCompleted(stageName)
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    {getStageIcon(stageName)}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {stageName}
                  </span>
                </div>
              ))}
            </div>

            {/* Status Text */}
            {statusText && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">{statusText}</p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <p className="text-red-800 dark:text-red-300 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Download Button */}
        {stage === 'complete' && sessionId && (
          <button
            onClick={handleDownload}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-all transform hover:scale-105"
          >
            {t('downloadTitle')}
          </button>
        )}
      </div>

      {/* Right Panel - How It Works */}
      <div className="bg-white dark:bg-[#222] rounded-xl shadow-lg p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('howItWorks')}</h2>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">{t('step1Title')}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">{t('step1Desc')}</p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">{t('step2Title')}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">{t('step2Desc')}</p>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">{t('step3Title')}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">{t('step3Desc')}</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">{t('step4Title')}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">{t('step4Desc')}</p>
          </div>
        </div>

        {/* Logs */}
        {logs.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Analysis Logs</h3>
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  <span className="text-gray-600 dark:text-gray-400">{logStats.success}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                  <span className="text-gray-600 dark:text-gray-400">{logStats.warnings}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  <span className="text-gray-600 dark:text-gray-400">{logStats.errors}</span>
                </span>
                <span className="text-gray-500 dark:text-gray-500">|</span>
                <span className="text-gray-600 dark:text-gray-400">Total: {logStats.total}</span>
              </div>
            </div>
            <div className="bg-gray-900 dark:bg-black border border-gray-700 rounded-lg max-h-96 overflow-y-auto font-mono text-xs">
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center space-x-4 text-gray-400 text-xs">
                <span className="w-20">Time</span>
                <span className="w-8">Level</span>
                <span className="flex-1">Message</span>
              </div>
              <div className="p-2">
                {logs.map((log) => (
                  <div key={log.id} className={`flex items-start space-x-4 px-2 py-1 hover:bg-gray-800/50 rounded transition-colors ${log.color}`}>
                    <span className="w-20 text-gray-500 text-xs flex-shrink-0">{log.timestamp}</span>
                    <span className="w-8 flex-shrink-0">{log.icon}</span>
                    <span className="flex-1 break-words">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysis;