import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { startAIAnalysis, streamLogs, downloadResult } from '@services/variance/variance-apis';
import { FINANCE_API_BASE_URL } from '@configs/APIs';

const AIAnalysis = ({ projectUuid }) => {
  const { t } = useTranslation();
  const [excelFiles, setExcelFiles] = useState([]);
  const [loanInterestFile, setLoanInterestFile] = useState(null);
  const [revenueBreakdownFile, setRevenueBreakdownFile] = useState(null);
  const [unitForLeaseFile, setUnitForLeaseFile] = useState(null);
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

  const handleLoanInterestChange = (e) => {
    const file = e.target.files[0];
    setLoanInterestFile(file || null);
  };

  const handleRevenueBreakdownChange = (e) => {
    const file = e.target.files[0];
    setRevenueBreakdownFile(file || null);
  };

  const handleUnitForLeaseChange = (e) => {
    const file = e.target.files[0];
    setUnitForLeaseFile(file || null);
  };

  // Helper function to categorize log messages and add metadata
  const categorizeLog = (message) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Remove emojis from message
    const cleanMessage = message.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();

    let level = 'info';
    let color = 'text-gray-300';
    let bgColor = 'bg-gray-500/10';

    // Detect log level from message content
    if (cleanMessage.toLowerCase().includes('complete') || cleanMessage.toLowerCase().includes('success') || cleanMessage.toLowerCase().includes('found')) {
      level = 'success';
      color = 'text-green-400';
      bgColor = 'bg-green-500/10';
    } else if (cleanMessage.toLowerCase().includes('warning') || cleanMessage.toLowerCase().includes('failed')) {
      level = 'warning';
      color = 'text-yellow-400';
      bgColor = 'bg-yellow-500/10';
    } else if (cleanMessage.toLowerCase().includes('error')) {
      level = 'error';
      color = 'text-red-400';
      bgColor = 'bg-red-500/10';
    } else if (cleanMessage.toLowerCase().includes('processing') || cleanMessage.toLowerCase().includes('chunk')) {
      level = 'processing';
      color = 'text-blue-400';
      bgColor = 'bg-blue-500/10';
    } else if (cleanMessage.toLowerCase().includes('starting')) {
      level = 'info';
      color = 'text-cyan-400';
      bgColor = 'bg-cyan-500/10';
    } else if (cleanMessage.toLowerCase().includes('polling')) {
      level = 'system';
      color = 'text-purple-400';
      bgColor = 'bg-purple-500/10';
    }

    // Increment counter for unique ID
    logIdCounter.current += 1;

    return {
      timestamp,
      message: cleanMessage,
      level,
      color,
      bgColor,
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

    const logEntry = categorizeLog('Polling for analysis completion...');
    setLogs((prev) => [...prev, logEntry]);

    // Track which logs we've already shown to avoid duplicates
    const shownLogs = new Set();

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${FINANCE_API_BASE_URL}/status/${sid}`);

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

          const successLog = categorizeLog('Analysis completed successfully!');
          setLogs((prev) => [...prev, successLog]);
          setLogStats((prev) => ({ ...prev, success: prev.success + 1, total: prev.total + 1 }));

          setProgress(100);
          setStage('complete');
          setStatusText('Analysis completed successfully!');
          setIsProcessing(false);
        } else if (data.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          clearTimeout(pollTimeoutRef.current);

          const errorLog = categorizeLog('Analysis failed');
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
        const timeoutLog = categorizeLog('Polling timeout. Please check manually.');
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

    // Add optional loan interest file for enhanced A2 analysis
    if (loanInterestFile) {
      formData.append('loan_interest_file', loanInterestFile);
    }

    // Add optional Account 511 files for revenue drill-down
    if (revenueBreakdownFile) {
      formData.append('revenue_breakdown_file', revenueBreakdownFile);
    }
    if (unitForLeaseFile) {
      formData.append('unit_for_lease_file', unitForLeaseFile);
    }

    // Add project_uuid if provided (for project integration)
    if (projectUuid) {
      formData.append('project_uuid', projectUuid);
    }

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

          const logEntry = categorizeLog('Analysis completed successfully!');
          setLogs((prev) => [...prev, logEntry]);
          setLogStats((prev) => ({ ...prev, success: prev.success + 1, total: prev.total + 1 }));

          eventSource.close();
        } else if (data.type === 'error') {
          setError(data.message);
          setIsProcessing(false);

          const logEntry = categorizeLog(`Error: ${data.message}`);
          setLogs((prev) => [...prev, logEntry]);
          setLogStats((prev) => ({ ...prev, errors: prev.errors + 1, total: prev.total + 1 }));

          eventSource.close();
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Error:', err);
        const logEntry = categorizeLog('Connection interrupted. Switching to polling mode...');
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

  const getStageLabel = (stageName) => {
    const labels = {
      upload: 'Upload',
      analyze: 'Analyze',
      generate: 'Generate',
      complete: 'Complete',
    };
    return labels[stageName];
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('excelLabel')}
            </label>

            {/* Custom File Upload Button */}
            <div className="relative">
              <input
                type="file"
                id="excel-upload"
                accept=".xlsx"
                multiple
                onChange={handleExcelChange}
                disabled={isProcessing}
                className="hidden"
              />
              <label
                htmlFor="excel-upload"
                className={`flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                  isProcessing
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60'
                    : excelFiles.length > 0
                    ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                    : 'border-blue-300 dark:border-blue-600 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
                }`}
              >
                <div className={`flex flex-col items-center gap-2 ${isProcessing ? 'pointer-events-none' : ''}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    excelFiles.length > 0
                      ? 'bg-green-500 dark:bg-green-600'
                      : 'bg-gradient-to-br from-blue-500 to-purple-600'
                  }`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {excelFiles.length > 0 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      )}
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {excelFiles.length > 0 ? `${excelFiles.length} file(s) selected` : 'Choose Excel files'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {excelFiles.length > 0 ? 'Click to change files' : 'or drag and drop here'}
                    </p>
                  </div>
                </div>
              </label>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('excelHelp')}</p>

            {/* Selected Files List */}
            {excelFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {excelFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optional Loan Interest File */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <span className="w-1 h-4 bg-amber-500 rounded-full mr-2"></span>
              ERP Loan Interest Rate
              <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(Optional)</span>
            </h3>

            <div className="relative">
              <input
                type="file"
                id="ai-loan-interest-upload"
                accept=".xlsx,.xls"
                onChange={handleLoanInterestChange}
                disabled={isProcessing}
                className="hidden"
              />
              <label
                htmlFor="ai-loan-interest-upload"
                className={`flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                  isProcessing
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60'
                    : loanInterestFile
                    ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:border-amber-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  loanInterestFile ? 'bg-amber-500' : 'bg-gradient-to-br from-amber-500 to-amber-600'
                }`}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {loanInterestFile ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {loanInterestFile ? loanInterestFile.name : 'Loan Interest Rate File'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {loanInterestFile ? `${(loanInterestFile.size / 1024).toFixed(2)} KB` : 'NetSuite Save Search (.xls/.xlsx)'}
                  </p>
                </div>
              </label>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Upload the ERP Loan Interest Rate Save Search file to enable enhanced Rule A2 analysis with interest rate lookups.
            </p>
          </div>

          {/* Account 511 Drill-Down Files Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <span className="w-1 h-4 bg-purple-500 rounded-full mr-2"></span>
              Account 511 (Revenue) Drill-Down
              <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(Optional)</span>
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {/* Revenue Breakdown File */}
              <div className="relative">
                <input
                  type="file"
                  id="ai-revenue-breakdown-upload"
                  accept=".xlsx,.xls"
                  onChange={handleRevenueBreakdownChange}
                  disabled={isProcessing}
                  className="hidden"
                />
                <label
                  htmlFor="ai-revenue-breakdown-upload"
                  className={`flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                    isProcessing
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60'
                      : revenueBreakdownFile
                      ? 'border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:border-purple-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    revenueBreakdownFile ? 'bg-purple-500' : 'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {revenueBreakdownFile ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {revenueBreakdownFile ? revenueBreakdownFile.name : 'RevenueBreakdown File'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {revenueBreakdownFile ? `${(revenueBreakdownFile.size / 1024).toFixed(2)} KB` : 'NetSuite export (.xls)'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Unit For Lease List File */}
              <div className="relative">
                <input
                  type="file"
                  id="ai-unit-for-lease-upload"
                  accept=".xlsx,.xls"
                  onChange={handleUnitForLeaseChange}
                  disabled={isProcessing}
                  className="hidden"
                />
                <label
                  htmlFor="ai-unit-for-lease-upload"
                  className={`flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                    isProcessing
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60'
                      : unitForLeaseFile
                      ? 'border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:border-purple-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    unitForLeaseFile ? 'bg-purple-500' : 'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {unitForLeaseFile ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {unitForLeaseFile ? unitForLeaseFile.name : 'UnitForLeaseList File'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {unitForLeaseFile ? `${(unitForLeaseFile.size / 1024).toFixed(2)} KB` : 'NetSuite export (.xls)'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Upload both files to enable Account 511 revenue drill-down with sub-account breakdown, project analysis, and tenant matching.
            </p>
          </div>

          {/* AI Features */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 text-lg">{t('aiInfoTitle')}</h3>
            <div className="space-y-3">
              <div className="bg-white/50 dark:bg-gray-800/30 p-3 rounded-lg">
                <strong className="text-gray-800 dark:text-gray-200 block mb-1">{t('autoMateriality')}</strong>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{t('autoMaterialityDesc')}</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/30 p-3 rounded-lg">
                <strong className="text-gray-800 dark:text-gray-200 block mb-1">{t('smartFocus')}</strong>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{t('smartFocusDesc')}</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/30 p-3 rounded-lg">
                <strong className="text-gray-800 dark:text-gray-200 block mb-1">{t('detailedExplanations')}</strong>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{t('detailedExplanationsDesc')}</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing || excelFiles.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {isProcessing ? 'Processing...' : t('aiProcessBtn')}
          </button>
        </form>

        {/* Progress Section */}
        {isProcessing && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">AI Analysis Progress</h3>

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
            <div className="flex justify-between items-center gap-2">
              {['upload', 'analyze', 'generate', 'complete'].map((stageName, idx) => (
                <div key={stageName} className="flex items-center flex-1">
                  <div
                    className={`flex-1 flex flex-col items-center space-y-2 ${
                      isStageActive(stageName)
                        ? 'scale-105 transform'
                        : isStageCompleted(stageName)
                        ? 'opacity-70'
                        : 'opacity-40'
                    } transition-all duration-300`}
                  >
                    <div
                      className={`w-full h-2 rounded-full ${
                        isStageActive(stageName)
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse'
                          : isStageCompleted(stageName)
                          ? 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    />
                    <span className={`text-xs font-medium capitalize ${
                      isStageActive(stageName)
                        ? 'text-blue-600 dark:text-blue-400 font-semibold'
                        : isStageCompleted(stageName)
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {stageName}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className={`w-8 h-0.5 mx-1 ${
                      isStageCompleted(stageName) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                    }`} />
                  )}
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
                <span className="w-16">Level</span>
                <span className="flex-1">Message</span>
              </div>
              <div className="p-2">
                {logs.map((log) => (
                  <div key={log.id} className={`flex items-start space-x-4 px-2 py-1.5 hover:bg-gray-800/50 rounded transition-colors ${log.bgColor}`}>
                    <span className="w-20 text-gray-500 text-xs flex-shrink-0">{log.timestamp}</span>
                    <span className={`w-16 flex-shrink-0 text-xs font-semibold uppercase ${log.color}`}>{log.level}</span>
                    <span className={`flex-1 break-words ${log.color}`}>{log.message}</span>
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