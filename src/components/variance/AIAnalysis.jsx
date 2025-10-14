import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { startAIAnalysis, streamLogs, downloadResult } from '@services/varianceApi';

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

  const handleExcelChange = (e) => {
    setExcelFiles(Array.from(e.target.files));
  };

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

        if (data.type === 'log') {
          setLogs((prev) => [...prev, data.message]);
        } else if (data.type === 'progress') {
          setProgress(data.percentage);
          setStatusText(data.message);

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
          eventSource.close();
        } else if (data.type === 'error') {
          setError(data.message);
          setIsProcessing(false);
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
      };
    } catch (error) {
      setError(error.response?.data?.detail || error.message);
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
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
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Analysis Logs</h3>
            <div className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-lg max-h-64 overflow-y-auto font-mono text-xs">
              {logs.map((log, idx) => (
                <div key={idx} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysis;
