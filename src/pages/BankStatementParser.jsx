import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/common/Breadcrumb';
import { parseBankStatements, downloadBankStatementResults } from '../services/bank-statement/bank-statement-apis';

const BankStatementParser = () => {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const breadcrumbItems = [
    { label: t('Home'), path: '/' },
    { label: t('Department'), path: '/department' },
    { label: t('Finance & Accounting Department'), path: '/project/2' },
    { label: t('Bank Statement Parser'), path: '/bank-statement-parser' }
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const excelFiles = droppedFiles.filter(file =>
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );

    addFiles(excelFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter(file =>
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );

    // Prevent duplicates
    const existingNames = files.map(f => f.name);
    const uniqueFiles = validFiles.filter(f => !existingNames.includes(f.name));

    setFiles(prev => [...prev, ...uniqueFiles]);
    setError(null);
    setResults(null);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      setError('Please select at least one bank statement file');
      return;
    }

    setProcessing(true);
    setError(null);
    setResults(null);

    try {
      const response = await parseBankStatements(files);
      setResults(response);
    } catch (err) {
      console.error('Error processing bank statements:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to process bank statements');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!results?.download_url) return;

    try {
      // Extract session ID from download URL
      // URL format: /api/finance/bank-statements/download/{session_id}
      const sessionId = results.download_url.split('/').pop();

      // Download the file using the API
      const blob = await downloadBankStatementResults(sessionId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bank_statements_${sessionId}.xlsx`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download results file');
    }
  };

  const handleClear = () => {
    setFiles([]);
    setResults(null);
    setError(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3] dark:bg-[#181818] transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#222] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb items={breadcrumbItems} />
          <div className="mt-4 flex items-center gap-3">
            <DocumentTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-[#f5efe6]">
              Bank Statement Parser
            </h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload bank statements to automatically extract transactions and balances
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-[#f5efe6] mb-4 flex items-center gap-2">
                <CloudArrowUpIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                Upload Bank Statements
              </h2>

              {/* Drag & Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <CloudArrowUpIcon className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Drag and drop Excel files here, or
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    multiple
                    accept=".xlsx,.xls"
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={processing}
                  />
                  <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer inline-block transition-colors">
                    Browse Files
                  </span>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Supported formats: .xlsx, .xls
                </p>
              </div>

              {/* Supported Banks */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Supported Banks ({results?.supported_banks?.length || 10} banks)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(results?.supported_banks || ['ACB', 'VIB', 'CTBC', 'KBANK', 'SINOPAC', 'MBB', 'OCB', 'BIDV', 'VTB', 'VCB']).map(bank => (
                    <span
                      key={bank}
                      className="px-2 py-1 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 rounded text-xs font-medium border border-blue-200 dark:border-blue-700"
                    >
                      {bank}
                    </span>
                  ))}
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Selected Files ({files.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          disabled={processing}
                          className="ml-2 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleProcess}
                  disabled={processing || files.length === 0}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {processing ? 'Processing...' : 'Process Files'}
                </button>
                <button
                  onClick={handleClear}
                  disabled={processing}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-[#f5efe6] mb-4 flex items-center gap-2">
                {results ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                )}
                Results
              </h2>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">Error</h4>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing State */}
              {processing && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Processing bank statements...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Auto-detecting banks and extracting data
                  </p>
                </div>
              )}

              {/* Results Display */}
              {results && !processing && (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Transactions</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {results.summary?.total_transactions || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300 mb-1">Accounts</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {results.summary?.unique_accounts || 0}
                      </p>
                    </div>
                  </div>

                  {/* Banks Detected */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
                      Banks Detected ({results.summary?.banks_detected?.length || 0})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {results.summary?.banks_detected?.map(bank => (
                        <span
                          key={bank}
                          className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                        >
                          {bank}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={handleDownload}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Download Results (Excel)
                  </button>

                  {/* File Info */}
                  {results.session_id && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                      Session ID: {results.session_id}
                    </p>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!results && !processing && !error && (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                  <p className="text-gray-500 dark:text-gray-500">
                    Upload and process files to see results
                  </p>
                </div>
              )}
            </div>
          </motion.div>

        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            How It Works
          </h3>
          <ol className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <span>Upload one or more bank statement Excel files</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <span>System automatically detects the bank and extracts transactions & balances</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <span>Download standardized Excel file with 3 sheets: Transactions, Balances, and Summary</span>
            </li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
};

export default BankStatementParser;
