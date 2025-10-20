import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import Breadcrumb from '@components/common/Breadcrumb';
import { fpaApiClient, FPA_API_BASE_URL } from '@configs/APIs';

function ExcelComparison() {
  const [previousFile, setPreviousFile] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${t('ExcelComparision')} - BW Industrial`;
  }, [t]);

  const previousInputRef = useRef(null);
  const currentInputRef = useRef(null);

  const breadcrumbItems = [
    { label: t("home") || "Home", href: "/" },
    { label: t("departments") || "Departments", href: "/department" },
    { label: t("fpaRDept"), href: "/project/1" },
    { label: t("ExcelComparision") || "Excel Comparison" },
  ];

  const handleFileSelect = (event, setFile) => {
    const file = event.target.files[0];
    if (file) {
      setFile(file);
    }
  };

  const handleCompare = async () => {
    if (!previousFile || !currentFile) {
      setError('Please select both files before comparing');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('old_file', previousFile);
    formData.append('new_file', currentFile);

    try {
      const response = await fpaApiClient.post('/compare', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (filename) => {
    window.open(`${FPA_API_BASE_URL}/download/${filename}`, '_blank');
  };

  const handleReset = () => {
    setPreviousFile(null);
    setCurrentFile(null);
    setResult(null);
    setError(null);
    if (previousInputRef.current) previousInputRef.current.value = '';
    if (currentInputRef.current) currentInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#181818] dark:to-[#0d0d0d] py-8 px-4">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/project/1")}
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 mb-6 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-[#222] dark:hover:text-[#f5efe6] bg-white dark:bg-[#222] rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm"
        >
          <span className="text-lg font-bold">←</span>
          <span className="font-medium">{t("backButton")}</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">
                {t("excelComparisonTitle") || "Excel Comparison Tool"}
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
                {t("excelComparisonSubtitle") || "Compare Excel files and get highlighted results instantly"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Previous File Upload Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="bg-white dark:bg-[#222] rounded-2xl shadow-xl border-2 border-blue-200 dark:border-blue-800 overflow-hidden h-full">
              {/* Header Badge */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{t("previousMonthFile")}</h3>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div className="p-6">
                <input
                  ref={previousInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileSelect(e, setPreviousFile)}
                  className="hidden"
                  id="previous-file"
                />
                <label
                  htmlFor="previous-file"
                  className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                    previousFile
                      ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      previousFile ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'
                    }`}>
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {previousFile ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        )}
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {previousFile ? previousFile.name : (t("chooseExcelFile") || 'Click to choose file')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {previousFile ? `${(previousFile.size / 1024).toFixed(2)} KB` : 'Excel (.xlsx, .xls)'}
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Current File Upload Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white dark:bg-[#222] rounded-2xl shadow-xl border-2 border-sky-200 dark:border-sky-800 overflow-hidden h-full">
              {/* Header Badge */}
              <div className="bg-gradient-to-r from-sky-600 to-sky-700 dark:from-sky-700 dark:to-sky-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{t("currentMonthFile") || "Current Month File"}</h3>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div className="p-6">
                <input
                  ref={currentInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileSelect(e, setCurrentFile)}
                  className="hidden"
                  id="current-file"
                />
                <label
                  htmlFor="current-file"
                  className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                    currentFile
                      ? 'border-sky-400 dark:border-sky-600 bg-sky-50 dark:bg-sky-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      currentFile ? 'bg-sky-500' : 'bg-gray-300 dark:bg-gray-700'
                    }`}>
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {currentFile ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        )}
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {currentFile ? currentFile.name : (t("chooseExcelFile") || 'Click to choose file')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {currentFile ? `${(currentFile.size / 1024).toFixed(2)} KB` : 'Excel (.xlsx, .xls)'}
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Compare Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <motion.button
            onClick={handleCompare}
            disabled={loading || !previousFile || !currentFile}
            whileHover={{ scale: loading || !previousFile || !currentFile ? 1 : 1.02 }}
            whileTap={{ scale: loading || !previousFile || !currentFile ? 1 : 0.98 }}
            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-sky-600 hover:from-blue-700 hover:via-purple-700 hover:to-sky-700 text-white text-lg font-bold py-5 px-6 rounded-xl shadow-2xl disabled:from-gray-300 dark:disabled:from-gray-600 disabled:via-gray-400 dark:disabled:via-gray-700 disabled:to-gray-400 dark:disabled:to-gray-700 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t("comparingFiles") || "Comparing Files..."}</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>{t("compareFiles") || "Compare Files"}</span>
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
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-sky-600 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{t("comparisonResults") || "Comparison Results"}</h2>
                        <p className="text-white/80 text-sm">Analysis complete</p>
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
                      {t("newComparison") || "New"}
                    </motion.button>
                  </div>
                </div>

                <div className="p-8">
                  {/* Statistics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      whileHover={{ y: -5 }}
                      className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-yellow-100 to-amber-50 dark:from-yellow-900/20 dark:via-yellow-800/20 dark:to-amber-900/20 rounded-2xl p-6 border-2 border-yellow-200 dark:border-yellow-700 shadow-lg"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
                              {t("newRows") || "New Rows"}
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-500">Added entries</p>
                          </div>
                        </div>
                        <div className="text-4xl font-extrabold text-yellow-900 dark:text-yellow-300">
                          {result.statistics.new_rows}
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -mr-16 -mt-16"></div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      whileHover={{ y: -5 }}
                      className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 dark:from-blue-900/20 dark:via-blue-800/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700 shadow-lg"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                              {t("updatedRows") || "Updated"}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-500">Modified entries</p>
                          </div>
                        </div>
                        <div className="text-4xl font-extrabold text-blue-900 dark:text-blue-300">
                          {result.statistics.updated_rows}
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full -mr-16 -mt-16"></div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      whileHover={{ y: -5 }}
                      className="relative overflow-hidden bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 dark:from-green-900/20 dark:via-green-800/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-700 shadow-lg"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
                              {t("unchanged") || "Unchanged"}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-500">Same entries</p>
                          </div>
                        </div>
                        <div className="text-4xl font-extrabold text-green-900 dark:text-green-300">
                          {result.statistics.unchanged_rows}
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full -mr-16 -mt-16"></div>
                    </motion.div>
                  </div>

                  {/* Download Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <motion.button
                      onClick={() => handleDownload(result.output_file)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative overflow-hidden flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-base font-bold py-4 px-6 rounded-xl shadow-xl transition-all duration-300"
                    >
                      <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{t("downloadSummary") || "Download Summary"}</span>
                    </motion.button>

                    <motion.button
                      onClick={() => handleDownload(result.highlighted_file)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative overflow-hidden flex items-center justify-center gap-3 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white text-base font-bold py-4 px-6 rounded-xl shadow-xl transition-all duration-300"
                    >
                      <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      <span>{t("downloadHighlighted") || "Download Highlighted"}</span>
                    </motion.button>
                  </div>

                  {/* File Info */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">File Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Previous File</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{result.old_filename}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Current File</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{result.new_filename}</p>
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
          <p>{t('dataComparisonFooter')}</p>
        </motion.footer>
      </div>
    </div>
  );
}

export default ExcelComparison;
