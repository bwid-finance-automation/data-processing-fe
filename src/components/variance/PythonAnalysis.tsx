import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { processPythonAnalysis, getAIConfig } from '@services/variance/variance-apis';

const PythonAnalysis = ({ projectUuid }) => {
  const { t } = useTranslation();
  const [excelFiles, setExcelFiles] = useState([]);
  const [loanInterestFile, setLoanInterestFile] = useState(null);
  const [revenueBreakdownFile, setRevenueBreakdownFile] = useState(null);
  const [unitForLeaseFile, setUnitForLeaseFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, done, failed
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [aiConfig, setAiConfig] = useState(null);

  // Fetch AI config on mount
  useEffect(() => {
    const fetchAIConfig = async () => {
      try {
        const config = await getAIConfig();
        setAiConfig(config);
      } catch (error) {
        console.error('Failed to fetch AI config:', error);
      }
    };
    fetchAIConfig();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (excelFiles.length === 0) {
      alert(t('noExcelSelected'));
      return;
    }

    setStatus('uploading');
    setProgress(0);
    setMessage('Uploading files...');
    setSuggestions([]);

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
      const blob = await processPythonAnalysis(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
        if (percentCompleted === 100) {
          setStatus('processing');
          setMessage('Processing analysis...');
        }
      });

      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'variance_analysis_python.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus('done');
      setMessage('Processing completed! File downloaded.');
      setProgress(100);
    } catch (error) {
      setStatus('failed');

      // Extract user-friendly error information from backend
      const errorData = error.response?.data;
      let errorMessage = 'An error occurred while processing your files.';
      let errorSuggestions = [];

      if (errorData) {
        // Backend sends structured error responses
        errorMessage = errorData.message || errorData.detail || errorMessage;
        errorSuggestions = errorData.suggestions || [];

        // Log technical details for debugging
        if (errorData.technical_details) {
          console.error('Technical details:', errorData.technical_details);
        }
      } else {
        errorMessage = error.message || errorMessage;
      }

      setMessage(errorMessage);
      setSuggestions(errorSuggestions);
      console.error('Analysis error:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-[#222] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('uploadRun')}</h2>
          <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
        </div>

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
                id="python-excel-upload"
                accept=".xlsx"
                multiple
                onChange={handleExcelChange}
                className="hidden"
              />
              <label
                htmlFor="python-excel-upload"
                className={`flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                  excelFiles.length > 0
                    ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    : 'border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    excelFiles.length > 0
                      ? 'bg-blue-500 dark:bg-blue-600'
                      : 'bg-gradient-to-br from-blue-500 to-blue-600'
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
                      {excelFiles.length > 0 ? 'Click to change files' : 'Click to browse'}
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
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Loan Interest File (Optional) - for Enhanced A2 Analysis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              ERP Loan Interest Rate File
              <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(Optional - for Enhanced Rule A2)</span>
            </label>

            {/* Custom File Upload Button */}
            <div className="relative">
              <input
                type="file"
                id="loan-interest-upload"
                accept=".xlsx,.xls"
                onChange={handleLoanInterestChange}
                className="hidden"
              />
              <label
                htmlFor="loan-interest-upload"
                className={`flex items-center justify-center gap-3 w-full px-6 py-3 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                  loanInterestFile
                    ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                    : 'border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:border-green-400 dark:hover:border-green-500 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    loanInterestFile
                      ? 'bg-green-500 dark:bg-green-600'
                      : 'bg-gradient-to-br from-green-500 to-green-600'
                  }`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {loanInterestFile ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      )}
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {loanInterestFile ? loanInterestFile.name : 'Add Loan Interest Rate File'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {loanInterestFile
                        ? `${(loanInterestFile.size / 1024).toFixed(2)} KB - Click to change`
                        : 'ERP Save Search export (.xlsx)'}
                    </p>
                  </div>
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
                  id="revenue-breakdown-upload"
                  accept=".xlsx,.xls"
                  onChange={handleRevenueBreakdownChange}
                  className="hidden"
                />
                <label
                  htmlFor="revenue-breakdown-upload"
                  className={`flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                    revenueBreakdownFile
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
                  id="unit-for-lease-upload"
                  accept=".xlsx,.xls"
                  onChange={handleUnitForLeaseChange}
                  className="hidden"
                />
                <label
                  htmlFor="unit-for-lease-upload"
                  className={`flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                    unitForLeaseFile
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

          {/* Submit Button */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={status === 'uploading' || status === 'processing'}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              {t('processBtn')}
            </button>

            {status !== 'idle' && (
              <div className="flex items-center justify-center">
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border ${
                    status === 'uploading' ? 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700' :
                    status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700' :
                    status === 'done' ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700' :
                    'bg-red-50 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    status === 'uploading' ? 'bg-yellow-500 animate-pulse' :
                    status === 'processing' ? 'bg-blue-500 animate-pulse' :
                    status === 'done' ? 'bg-green-500' :
                    'bg-red-500'
                  }`}></span>
                  {t(status)}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {(status === 'uploading' || status === 'processing') && (
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 min-w-[3rem] text-right">
                  {progress}%
                </span>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                status === 'done' ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                status === 'failed' ? 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}
            >
              {message}
            </div>
          )}

          {/* Error Suggestions */}
          {status === 'failed' && suggestions.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-2">
                    Suggestions to fix this issue:
                  </h4>
                  <ul className="space-y-1.5">
                    {suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start text-sm text-orange-800 dark:text-orange-300">
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-200 rounded-full text-xs font-semibold mr-2 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Info Panel */}
      <div className="bg-white dark:bg-[#222] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('pythonAnalysisInfo')}</h2>
          <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
        </div>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          {/* AI Model Configuration */}
          {aiConfig && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-300 mb-3 flex items-center">
                <span className="w-1 h-5 bg-emerald-500 rounded-full mr-2"></span>
                AI Model Configuration
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium uppercase tracking-wide">Model</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">{aiConfig.model}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium uppercase tracking-wide">Family</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">{aiConfig.model_family}</span>
                </div>
                {aiConfig.is_gpt5 && aiConfig.reasoning_effort && (
                  <div className="flex flex-col">
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium uppercase tracking-wide">Reasoning</span>
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200 capitalize">{aiConfig.reasoning_effort}</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium uppercase tracking-wide">Service Tier</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200 capitalize">{aiConfig.service_tier}</span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium uppercase tracking-wide">Pricing (per 1M tokens)</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Input: ${aiConfig.pricing?.input_per_million} | Output: ${aiConfig.pricing?.output_per_million}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-sm leading-relaxed">
              {t('pythonAnalysisInfoDesc')}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 p-5 rounded-xl border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center">
              <span className="w-1 h-5 bg-purple-500 rounded-full mr-2"></span>
              {t('pythonFeatures')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{t('pythonFeature1')}</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{t('pythonFeature2')}</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{t('pythonFeature3')}</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{t('pythonFeature4')}</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{t('pythonFeature5')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PythonAnalysis;