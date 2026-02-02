import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  CalendarIcon,
  PlayIcon,
  ArrowPathIcon,
  TrashIcon,
  BanknotesIcon,
  DocumentChartBarIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, FileUploadZone } from '@components/common';
import {
  initAutomationSession,
  uploadBankStatements,
  runSettlementAutomation,
  getAutomationSessionStatus,
  downloadAutomationResult,
  resetAutomationSession,
  deleteAutomationSession,
  listAutomationSessions,
  previewMovementData,
} from '../services/cash-report/cash-report-apis';

const CashReport = () => {
  const { t } = useTranslation();

  // Session state
  const [session, setSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Form state
  const [openingDate, setOpeningDate] = useState('');
  const [endingDate, setEndingDate] = useState('');
  const [periodName, setPeriodName] = useState('');

  // File upload state
  const [files, setFiles] = useState([]);

  // Loading states
  const [initializing, setInitializing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [runningSettlement, setRunningSettlement] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Preview state
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Error state
  const [error, setError] = useState(null);

  const breadcrumbItems = [
    { label: t('Home'), href: '/' },
    { label: t('Department'), href: '/department' },
    { label: t('Finance & Accounting Department'), href: '/project/2' },
    { label: t('Cash Report'), href: '/cash-report' }
  ];

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const result = await listAutomationSessions();
      setSessions(result.sessions || []);
      // If there's an active session, load it
      if (result.sessions?.length > 0) {
        const activeSession = result.sessions[0];
        await loadSessionStatus(activeSession.session_id);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSessionStatus = async (sessionId) => {
    try {
      const result = await getAutomationSessionStatus(sessionId);
      setSession(result);
      // Update form with session config
      if (result.config) {
        setOpeningDate(result.config.opening_date || '');
        setEndingDate(result.config.ending_date || '');
        setPeriodName(result.config.period_name || '');
      }
    } catch (err) {
      console.error('Error loading session status:', err);
    }
  };

  // Initialize or get existing session
  const handleInitSession = async () => {
    if (!openingDate || !endingDate) {
      toast.error(t('Please select opening and ending dates'));
      return;
    }

    setInitializing(true);
    setError(null);
    try {
      const result = await initAutomationSession({
        openingDate,
        endingDate,
        periodName,
      });

      setSession(result);
      if (result.is_existing) {
        toast.info(t('Using existing session'));
      } else {
        toast.success(t('Session initialized successfully'));
      }
      await loadSessions();
    } catch (err) {
      console.error('Error initializing session:', err);
      setError(err.response?.data?.detail || t('Failed to initialize session'));
      toast.error(t('Failed to initialize session'));
    } finally {
      setInitializing(false);
    }
  };

  // Upload bank statements
  const handleUpload = async () => {
    if (!session?.session_id || files.length === 0) {
      toast.error(t('Please select files to upload'));
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const result = await uploadBankStatements(session.session_id, files, true);
      toast.success(t('Uploaded {{count}} transactions', { count: result.transactions_added || 0 }));
      setFiles([]);
      await loadSessionStatus(session.session_id);
    } catch (err) {
      console.error('Error uploading:', err);
      setError(err.response?.data?.detail || t('Failed to upload files'));
      toast.error(t('Failed to upload files'));
    } finally {
      setUploading(false);
    }
  };

  // Run settlement automation
  const handleRunSettlement = async () => {
    if (!session?.session_id) return;

    setRunningSettlement(true);
    setError(null);
    try {
      const result = await runSettlementAutomation(session.session_id);
      toast.success(t('Settlement completed: {{count}} counter entries created', {
        count: result.counter_entries_created || 0
      }));
      await loadSessionStatus(session.session_id);
    } catch (err) {
      console.error('Error running settlement:', err);
      setError(err.response?.data?.detail || t('Failed to run settlement'));
      toast.error(t('Failed to run settlement'));
    } finally {
      setRunningSettlement(false);
    }
  };

  // Download result
  const handleDownload = async () => {
    if (!session?.session_id) return;

    setDownloading(true);
    try {
      const { blob, filename } = await downloadAutomationResult(session.session_id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t('Downloaded successfully'));
    } catch (err) {
      console.error('Error downloading:', err);
      toast.error(t('Failed to download'));
    } finally {
      setDownloading(false);
    }
  };

  // Reset session
  const handleReset = async () => {
    if (!session?.session_id) return;
    if (!window.confirm(t('Are you sure you want to reset this session? All uploaded data will be cleared.'))) {
      return;
    }

    setResetting(true);
    try {
      await resetAutomationSession(session.session_id);
      toast.success(t('Session reset successfully'));
      await loadSessionStatus(session.session_id);
    } catch (err) {
      console.error('Error resetting session:', err);
      toast.error(t('Failed to reset session'));
    } finally {
      setResetting(false);
    }
  };

  // Delete session
  const handleDelete = async () => {
    if (!session?.session_id) return;
    if (!window.confirm(t('Are you sure you want to delete this session? This cannot be undone.'))) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAutomationSession(session.session_id);
      toast.success(t('Session deleted successfully'));
      setSession(null);
      setOpeningDate('');
      setEndingDate('');
      setPeriodName('');
      await loadSessions();
    } catch (err) {
      console.error('Error deleting session:', err);
      toast.error(t('Failed to delete session'));
    } finally {
      setDeleting(false);
    }
  };

  // Load preview data
  const handleLoadPreview = async () => {
    if (!session?.session_id) return;

    setLoadingPreview(true);
    try {
      const result = await previewMovementData(session.session_id, 20);
      setPreviewData(result.preview_rows || []);
      setShowPreview(true);
    } catch (err) {
      console.error('Error loading preview:', err);
      toast.error(t('Failed to load preview'));
    } finally {
      setLoadingPreview(false);
    }
  };

  // Handle file selection
  const handleFilesSelected = useCallback((selectedFiles) => {
    setFiles(prev => [...prev, ...selectedFiles]);
  }, []);

  const handleRemoveFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const hasSession = !!session?.session_id;
  const movementRows = session?.movement_rows || session?.statistics?.movement_rows || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#0d0d0d] p-6">
      <div className="max-w-6xl mx-auto">
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <BanknotesIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('Cash Report Automation')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {t('Automate biweekly cash report generation')}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration & Upload */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Session Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-[#222] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('Report Period Configuration')}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Opening Date')}
                  </label>
                  <input
                    type="date"
                    value={openingDate}
                    onChange={(e) => setOpeningDate(e.target.value)}
                    disabled={hasSession}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Ending Date')}
                  </label>
                  <input
                    type="date"
                    value={endingDate}
                    onChange={(e) => setEndingDate(e.target.value)}
                    disabled={hasSession}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Period Name')}
                  </label>
                  <input
                    type="text"
                    value={periodName}
                    onChange={(e) => setPeriodName(e.target.value)}
                    placeholder="W3-4Jan26"
                    disabled={hasSession}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {!hasSession ? (
                <button
                  onClick={handleInitSession}
                  disabled={initializing || !openingDate || !endingDate}
                  className="mt-4 w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {initializing ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      {t('Initializing...')}
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-5 h-5" />
                      {t('Initialize Session')}
                    </>
                  )}
                </button>
              ) : (
                <div className="mt-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('Session active')}</span>
                </div>
              )}
            </motion.div>

            {/* Step 2: Upload Bank Statements */}
            <AnimatePresence>
              {hasSession && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-[#222] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('Upload Bank Statements')}
                    </h2>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {t('Upload parsed bank statement Excel files (output from Bank Statement Parser)')}
                  </p>

                  <FileUploadZone
                    onFilesSelected={handleFilesSelected}
                    accept=".xlsx,.xls"
                    multiple={true}
                    selectedFiles={files}
                    onRemoveFile={handleRemoveFile}
                    colorTheme="emerald"
                    label={t('Drop Excel files here')}
                    hint={t('Parsed bank statements (.xlsx)')}
                  />

                  {files.length > 0 && (
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="mt-4 w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          {t('Uploading...')}
                        </>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="w-5 h-5" />
                          {t('Upload {{count}} file(s)', { count: files.length })}
                        </>
                      )}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: Run Settlement */}
            <AnimatePresence>
              {hasSession && movementRows > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-[#222] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('Settlement Automation')}
                    </h2>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {t('Detect saving account settlements (tất toán) and create counter entries for internal transfers')}
                  </p>

                  <button
                    onClick={handleRunSettlement}
                    disabled={runningSettlement}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {runningSettlement ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        {t('Processing...')}
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-5 h-5" />
                        {t('Run Settlement Automation')}
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preview Section */}
            <AnimatePresence>
              {showPreview && previewData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-[#222] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('Data Preview')}
                    </h3>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400">{t('Source')}</th>
                          <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400">{t('Bank')}</th>
                          <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400">{t('Account')}</th>
                          <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400">{t('Date')}</th>
                          <th className="text-right py-2 px-2 text-gray-600 dark:text-gray-400">{t('Debit')}</th>
                          <th className="text-right py-2 px-2 text-gray-600 dark:text-gray-400">{t('Credit')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, idx) => (
                          <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{row.source}</td>
                            <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{row.bank}</td>
                            <td className="py-2 px-2 text-gray-700 dark:text-gray-300 font-mono text-xs">{row.account}</td>
                            <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{row.date}</td>
                            <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">
                              {row.debit ? Number(row.debit).toLocaleString() : ''}
                            </td>
                            <td className="py-2 px-2 text-right text-green-600 dark:text-green-400">
                              {row.credit ? Number(row.credit).toLocaleString() : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
                >
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Session Status */}
          <div className="space-y-6">
            {/* Session Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-[#222] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DocumentChartBarIcon className="w-5 h-5 text-emerald-500" />
                {t('Session Status')}
              </h3>

              {loadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : hasSession ? (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('Transactions')}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{movementRows}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('Files Uploaded')}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {session?.statistics?.files_uploaded || session?.uploaded_files?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Period Info */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {session?.config?.opening_date} ~ {session?.config?.ending_date}
                      </span>
                    </div>
                    {session?.config?.period_name && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        {session.config.period_name}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {movementRows > 0 && (
                      <>
                        <button
                          onClick={handleLoadPreview}
                          disabled={loadingPreview}
                          className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          {loadingPreview ? (
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                          ) : (
                            <DocumentTextIcon className="w-4 h-4" />
                          )}
                          {t('Preview Data')}
                        </button>

                        <button
                          onClick={handleDownload}
                          disabled={downloading}
                          className="w-full py-2 px-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          {downloading ? (
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          )}
                          {t('Download Result')}
                        </button>
                      </>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleReset}
                        disabled={resetting}
                        className="flex-1 py-2 px-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center justify-center gap-1 text-sm"
                      >
                        {resetting ? (
                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowPathIcon className="w-4 h-4" />
                        )}
                        {t('Reset')}
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-1 text-sm"
                      >
                        {deleting ? (
                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                        {t('Delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ClockIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {t('No active session')}
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    {t('Configure dates and initialize a session to start')}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Workflow Guide */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-6"
            >
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-3">
                {t('Workflow')}
              </h3>
              <ol className="space-y-2 text-xs text-emerald-700 dark:text-emerald-400">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">1</span>
                  <span>{t('Set report period dates')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">2</span>
                  <span>{t('Upload parsed bank statements')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">3</span>
                  <span>{t('Run settlement automation')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">4</span>
                  <span>{t('Download completed report')}</span>
                </li>
              </ol>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashReport;
