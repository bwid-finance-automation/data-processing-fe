import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import Breadcrumb from '@components/common/Breadcrumb';
import { fpaApiClient, FPA_API_BASE_URL } from '@configs/APIs';

function NTMEBITDAAnalysis() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [prevSheet, setPrevSheet] = useState('');
  const [currSheet, setCurrSheet] = useState('');
  const [detectingSheets, setDetectingSheets] = useState(false);

  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `NTM EBITDA Variance Analysis - BW Industrial`;
  }, []);

  const fileInputRef = useRef(null);

  const breadcrumbItems = [
    { label: t("home") || "Home", href: "/" },
    { label: t("departments") || "Departments", href: "/department" },
    { label: t("fpaRDept"), href: "/project/1" },
    { label: "NTM EBITDA Variance" },
  ];

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSheets([]);
      setPrevSheet('');
      setCurrSheet('');

      // Auto-detect sheets
      await detectSheets(selectedFile);
    }
  };

  const detectSheets = async (selectedFile) => {
    setDetectingSheets(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fpaApiClient.post('/ntm-ebitda/detect-sheets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const detectedSheets = response.data.sheets || [];
      setSheets(detectedSheets);

      // Auto-select last two leasing model sheets if available
      const leasingSheets = detectedSheets.filter(s =>
        s.toLowerCase().includes('leasing') || s.toLowerCase().includes('model')
      );

      if (leasingSheets.length >= 2) {
        setPrevSheet(leasingSheets[leasingSheets.length - 2]);
        setCurrSheet(leasingSheets[leasingSheets.length - 1]);
      } else if (detectedSheets.length >= 2) {
        setPrevSheet(detectedSheets[0]);
        setCurrSheet(detectedSheets[1]);
      }
    } catch (err) {
      console.error('Sheet detection error:', err);
      // Don't show error - sheets can be selected manually
    } finally {
      setDetectingSheets(false);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file before analyzing');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    // Build query params for sheet names
    let queryParams = [];
    if (prevSheet) queryParams.push(`prev_sheet=${encodeURIComponent(prevSheet)}`);
    if (currSheet) queryParams.push(`curr_sheet=${encodeURIComponent(currSheet)}`);

    const url = `/ntm-ebitda/analyze${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;

    try {
      const response = await fpaApiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (filename) => {
    window.open(`${FPA_API_BASE_URL}/ntm-ebitda/download/${filename}`, '_blank');
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setSheets([]);
    setPrevSheet('');
    setCurrSheet('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPercent = (num) => {
    if (num === null || num === undefined) return '0%';
    return (num * 100).toFixed(1) + '%';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#181818] dark:to-[#0d0d0d] py-8 px-4">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/project/1")}
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 mb-6 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-[#222] dark:hover:text-[#f5efe6] bg-white dark:bg-[#222] rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm"
        >
          <span className="text-lg font-bold">&#8592;</span>
          <span className="font-medium">{t("backButton")}</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-amber-600 to-orange-700 dark:from-amber-500 dark:to-orange-600 rounded-xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">
                NTM EBITDA Variance Analysis
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
                Analyze Next Twelve Months EBITDA variance from leasing model data
              </p>
            </div>
          </div>
        </motion.div>

        {/* File Upload Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-white dark:bg-[#222] rounded-2xl shadow-xl border-2 border-amber-200 dark:border-amber-800 overflow-hidden">
            {/* Header Badge */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-700 dark:from-amber-700 dark:to-orange-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Upload Leasing Model File</h3>
                  <p className="text-white/70 text-sm">Excel file with period sheets (e.g., Model_leasing_Sep'25, Model_leasing_Nov'25)</p>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div className="p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xlsb,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="ntm-file"
              />
              <label
                htmlFor="ntm-file"
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                  file
                    ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    file ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-700'
                  }`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {file ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      )}
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {file ? file.name : 'Click to choose file'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Excel (.xlsx, .xlsb, .xls)'}
                    </p>
                  </div>
                </div>
              </label>

              {/* Sheet Selection */}
              {sheets.length > 0 && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Previous Period Sheet */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Previous Period Sheet
                      </label>
                      <div className="relative">
                        <select
                          value={prevSheet}
                          onChange={(e) => setPrevSheet(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none"
                        >
                          <option value="">Select sheet...</option>
                          {sheets.map((sheet) => (
                            <option key={sheet} value={sheet}>{sheet}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Current Period Sheet */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Period Sheet
                      </label>
                      <div className="relative">
                        <select
                          value={currSheet}
                          onChange={(e) => setCurrSheet(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none"
                        >
                          <option value="">Select sheet...</option>
                          {sheets.map((sheet) => (
                            <option key={sheet} value={sheet}>{sheet}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detecting sheets indicator */}
              {detectingSheets && (
                <div className="mt-4 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Detecting sheets...</span>
                </div>
              )}

              {/* Info */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">Expected File Structure:</p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-4">
                  <li>• Sheets named with period (e.g., Model_leasing_Sep'25)</li>
                  <li>• Project codes, phases, metric types (Accounting revenue, OPEX, SG&A)</li>
                  <li>• Tenant details with GLA, lease dates, term</li>
                  <li>• Monthly NTM data columns (12 months)</li>
                  <li>• Optional: "Mapping" sheet for project name mapping</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Analysis Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg border border-purple-200 dark:border-purple-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">AI-Powered Commentary</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  AI will generate professional commentary for lease changes (new signings, terminations, renewals)
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Analyze Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <motion.button
            onClick={handleAnalyze}
            disabled={loading || !file}
            whileHover={{ scale: loading || !file ? 1 : 1.02 }}
            whileTap={{ scale: loading || !file ? 1 : 0.98 }}
            className="w-full text-white text-lg font-bold py-5 px-6 rounded-xl shadow-2xl disabled:from-gray-300 dark:disabled:from-gray-600 disabled:via-gray-400 dark:disabled:via-gray-700 disabled:to-gray-400 dark:disabled:to-gray-700 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 relative overflow-hidden group bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-700 hover:via-orange-700 hover:to-red-700"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Analyzing NTM EBITDA...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Analyze NTM EBITDA Variance</span>
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
          </motion.button>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6"
            >
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 rounded-xl p-5 shadow-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">Error</h4>
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-white dark:bg-[#222] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Results Header */}
                <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">NTM EBITDA Variance Results</h2>
                        <p className="text-white/80 text-sm">{result.previous_period} vs {result.current_period}</p>
                      </div>
                    </div>
                    <motion.button
                      onClick={handleReset}
                      whileHover={{ scale: 1.05, rotate: 180 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      New Analysis
                    </motion.button>
                  </div>
                </div>

                <div className="p-8">
                  {/* Statistics Grid */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Portfolio Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">Total Projects</span>
                      </div>
                      <div className="text-3xl font-extrabold text-blue-900 dark:text-blue-300">
                        {result.statistics?.total_projects || 0}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">Significant Variances</span>
                      </div>
                      <div className="text-3xl font-extrabold text-yellow-900 dark:text-yellow-300">
                        {result.statistics?.significant_variances || 0}
                      </div>
                      <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">&gt;5% change</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-200 dark:border-green-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-sm font-bold text-green-700 dark:text-green-400">Increased</span>
                      </div>
                      <div className="text-3xl font-extrabold text-green-900 dark:text-green-300">
                        {result.statistics?.projects_increased || 0}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-5 border border-red-200 dark:border-red-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                        <span className="text-sm font-bold text-red-700 dark:text-red-400">Decreased</span>
                      </div>
                      <div className="text-3xl font-extrabold text-red-900 dark:text-red-300">
                        {result.statistics?.projects_decreased || 0}
                      </div>
                    </motion.div>
                  </div>

                  {/* Portfolio Totals */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Portfolio EBITDA (USD millions)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Previous ({result.previous_period})</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          ${formatNumber(result.statistics?.portfolio_totals?.ebitda?.previous_usd_mn || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Current ({result.current_period})</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          ${formatNumber(result.statistics?.portfolio_totals?.ebitda?.current_usd_mn || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Variance</p>
                        <p className={`text-xl font-bold ${(result.statistics?.portfolio_totals?.ebitda?.variance_usd_mn || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {(result.statistics?.portfolio_totals?.ebitda?.variance_usd_mn || 0) >= 0 ? '+' : ''}${formatNumber(result.statistics?.portfolio_totals?.ebitda?.variance_usd_mn || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Variance %</p>
                        <p className={`text-xl font-bold ${(result.statistics?.portfolio_totals?.ebitda?.variance_pct || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatPercent(result.statistics?.portfolio_totals?.ebitda?.variance_pct || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <motion.button
                    onClick={() => handleDownload(result.output_file)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full group relative overflow-hidden flex items-center justify-center gap-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-base font-bold py-4 px-6 rounded-xl shadow-xl transition-all duration-300"
                  >
                    <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download Excel Report</span>
                  </motion.button>

                  {/* AI Status Info */}
                  {result.ai_analysis && (
                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-sm text-purple-700 dark:text-purple-300">
                          {result.ai_analysis.status === 'success'
                            ? `AI Commentary generated using ${result.ai_analysis.model || 'AI'}`
                            : `AI Commentary: ${result.ai_analysis.error || 'Error occurred'}`
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {/* File Info */}
                  <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Analysis Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Uploaded File</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{result.filename}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Sheets Compared</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {result.prev_sheet} → {result.curr_sheet}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 py-6 text-center text-gray-600 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-700"
        >
          <p>NTM EBITDA Variance Analysis Tool - BW Industrial Development</p>
        </motion.footer>
      </div>
    </div>
  );
}

export default NTMEBITDAAnalysis;
