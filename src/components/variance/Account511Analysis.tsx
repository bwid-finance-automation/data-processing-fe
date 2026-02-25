import { useState } from 'react';
import { motion } from 'framer-motion';
import { analyzeAccount511 } from '@services/variance/variance-apis';

const Account511Analysis = ({ projectUuid }) => {
  const [revenueBreakdownFile, setRevenueBreakdownFile] = useState(null);
  const [unitForLeaseFile, setUnitForLeaseFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleRevenueBreakdownChange = (e) => {
    const file = e.target.files[0];
    setRevenueBreakdownFile(file || null);
    setError(null);
    setSuccess(false);
  };

  const handleUnitForLeaseChange = (e) => {
    const file = e.target.files[0];
    setUnitForLeaseFile(file || null);
    setError(null);
    setSuccess(false);
  };

  const handleAnalyze = async () => {
    if (!revenueBreakdownFile || !unitForLeaseFile) {
      setError('Both files are required for Account 511 analysis');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('revenue_breakdown_file', revenueBreakdownFile);
      formData.append('unit_for_lease_file', unitForLeaseFile);

      if (projectUuid) {
        formData.append('project_uuid', projectUuid);
      }

      const blob = await analyzeAccount511(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      });

      // Download the result
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.setAttribute('download', `account_511_analysis_${timestamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      setProgress(100);
    } catch (err) {
      console.error('Account 511 analysis error:', err);
      setError(err.response?.data?.detail || err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setRevenueBreakdownFile(null);
    setUnitForLeaseFile(null);
    setError(null);
    setSuccess(false);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Account 511 Analysis</h2>
            <p className="text-green-100 text-sm max-w-xl">
              AI-powered revenue variance analysis for Account 511 sub-accounts.
              Upload RevenueBreakdown and UnitForLeaseList files from NetSuite to analyze
              sub-account variances, project breakdown, and tenant matching.
            </p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* File Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#222] rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Upload NetSuite Files
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Revenue Breakdown File */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              RevenueBreakdown File <span className="text-red-500">*</span>
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                revenueBreakdownFile
                  ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
              }`}
            >
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleRevenueBreakdownChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
              {revenueBreakdownFile ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 truncate">
                    {revenueBreakdownFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(revenueBreakdownFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click to upload RevenueBreakdown
                  </p>
                  <p className="text-xs text-gray-400">
                    .xlsx or .xls file
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Unit For Lease File */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              UnitForLeaseList File <span className="text-red-500">*</span>
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                unitForLeaseFile
                  ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
              }`}
            >
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleUnitForLeaseChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
              {unitForLeaseFile ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 truncate">
                    {unitForLeaseFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(unitForLeaseFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click to upload UnitForLeaseList
                  </p>
                  <p className="text-xs text-gray-400">
                    .xlsx or .xls file
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <p className="text-sm text-green-600 dark:text-green-400">
              Analysis completed successfully! Your file has been downloaded.
            </p>
          </motion.div>
        )}

        {/* Progress Bar */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4"
          >
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>Analyzing...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <motion.button
            onClick={handleAnalyze}
            disabled={!revenueBreakdownFile || !unitForLeaseFile || isProcessing}
            whileHover={{ scale: isProcessing ? 1 : 1.02 }}
            whileTap={{ scale: isProcessing ? 1 : 0.98 }}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold text-white transition-all ${
              !revenueBreakdownFile || !unitForLeaseFile || isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing with AI...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Analyze Account 511
              </span>
            )}
          </motion.button>

          {(revenueBreakdownFile || unitForLeaseFile) && !isProcessing && (
            <motion.button
              onClick={handleReset}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-3 px-6 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              Reset
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Output Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-[#222] rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Output Sheets
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: '511 Summary', desc: 'Total variance overview with AI executive summary' },
            { name: '511 Sub-Accounts', desc: '14 sub-account breakdown with variances' },
            { name: '511 By Project', desc: 'Revenue breakdown by project' },
            { name: '511 Tenant Matches', desc: 'Fuzzy matching between revenue entities and unit tenants' },
            { name: '511 Unit Summary', desc: 'Unit status and GLA summary by region/project' },
            { name: '511 AI Insights', desc: 'AI-generated key drivers and recommendations' },
          ].map((sheet, idx) => (
            <div
              key={idx}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{sheet.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sheet.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Account511Analysis;
