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
  ChevronRightIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, FileUploadZone } from '@components/common';
import UploadProgressPanel from '../components/cash-report/UploadProgressPanel';
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
  streamUploadProgress,
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
  const [resetSlow, setResetSlow] = useState(false);

  // Preview state
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Upload progress state (SSE)
  const [uploadSteps, setUploadSteps] = useState([]);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [uploadErrorMessage, setUploadErrorMessage] = useState('');
  const [showProgress, setShowProgress] = useState(false);

  // Error state
  const [error, setError] = useState(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    type: 'warning', // 'warning' | 'danger'
    onConfirm: null,
  });

  // Create session modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  const breadcrumbItems = [
    { label: t('Home'), href: '/' },
    { label: t('Department'), href: '/department' },
    { label: t('Finance & Accounting Department'), href: '/project/2' },
    { label: t('Cash Report'), href: '/cash-report' }
  ];

  // Auto-generate period name from date range
  const generatePeriodName = (startDate, endDate) => {
    if (!startDate || !endDate) return '';

    const start = new Date(startDate);
    const end = new Date(endDate);

    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.toLocaleString('en-US', { month: 'short' });
    const endMonth = end.toLocaleString('en-US', { month: 'short' });
    const year = end.getFullYear().toString().slice(-2);

    // Calculate week number (1-4, capped at 4 for days 22-31)
    const weekOfMonth = Math.min(Math.ceil(startDay / 7), 4);
    const endWeekOfMonth = Math.min(Math.ceil(endDay / 7), 4);

    if (start.getMonth() === end.getMonth()) {
      // Same month: W1-2Jan26
      return `W${weekOfMonth}-${endWeekOfMonth}${startMonth}${year}`;
    } else {
      // Different months: W4Jan-1Feb26
      return `W${weekOfMonth}${startMonth}-${endWeekOfMonth}${endMonth}${year}`;
    }
  };

  // Format date to dd/MM/yyyy
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const result = await listAutomationSessions();
      setSessions(result.sessions || []);
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
      if (result.config) {
        setOpeningDate(result.config.opening_date || '');
        setEndingDate(result.config.ending_date || '');
        setPeriodName(result.config.period_name || '');
      }
    } catch (err) {
      console.error('Error loading session status:', err);
    }
  };

  const handleOpenCreateModal = () => {
    setOpeningDate('');
    setEndingDate('');
    setPeriodName('');
    setShowCreateModal(true);
  };

  const handleInitSession = async () => {
    if (!openingDate || !endingDate) {
      toast.error(t('Please select opening and ending dates'));
      return;
    }

    // Validate dates
    const opening = new Date(openingDate);
    const ending = new Date(endingDate);

    if (opening > ending) {
      toast.error(t('Opening date must be before ending date'));
      return;
    }

    const diffDays = Math.ceil((ending - opening) / (1000 * 60 * 60 * 24));
    if (diffDays > 31) {
      toast.error(t('Date range cannot exceed 31 days'));
      return;
    }

    setInitializing(true);
    setError(null);
    // Auto-generate period name
    const autoPeriodName = generatePeriodName(openingDate, endingDate);

    try {
      const result = await initAutomationSession({
        openingDate,
        endingDate,
        periodName: autoPeriodName,
      });

      setSession(result);
      setShowCreateModal(false);
      if (result.is_existing) {
        toast.info(t('Using existing session'));
      } else {
        toast.success(t('Session created successfully'));
      }
      await loadSessions();
    } catch (err) {
      console.error('Error initializing session:', err);
      setError(err.response?.data?.detail || t('Failed to create session'));
      toast.error(t('Failed to create session'));
    } finally {
      setInitializing(false);
    }
  };

  const handleUpload = async () => {
    if (!session?.session_id || files.length === 0) {
      toast.error(t('Please select files to upload'));
      return;
    }

    setUploading(true);
    setError(null);
    setUploadSteps([]);
    setUploadComplete(false);
    setUploadError(false);
    setUploadErrorMessage('');
    setShowProgress(true);

    // Open SSE connection for progress streaming
    const eventSource = streamUploadProgress(session.session_id);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Ignore heartbeat, waiting, connected events
        if (data.type === 'heartbeat' || data.type === 'waiting' || data.type === 'connected') {
          return;
        }

        if (data.type === 'error') {
          setUploadError(true);
          setUploadErrorMessage(data.message);
          eventSource.close();
          return;
        }

        if (data.type === 'complete') {
          setUploadComplete(true);
          setUploadSteps((prev) => [...prev, data]);
          eventSource.close();
          return;
        }

        // step_start, step_update, step_complete
        setUploadSteps((prev) => {
          // For step_update on same step, replace last update to avoid spam
          if (data.type === 'step_update' && prev.length > 0) {
            const last = prev[prev.length - 1];
            if (last.step === data.step && last.type === 'step_update') {
              return [...prev.slice(0, -1), data];
            }
          }
          return [...prev, data];
        });
      } catch (e) {
        console.error('Error parsing SSE event:', e);
      }
    };

    eventSource.onerror = () => {
      // SSE connection error - upload POST will still complete
      console.warn('SSE connection lost, upload continues in background');
      eventSource.close();
    };

    // Fire the POST upload simultaneously
    try {
      const result = await uploadBankStatements(session.session_id, files, true);
      const added = result.total_transactions_added || 0;
      const skipped = result.total_transactions_skipped || 0;

      // Fallback: mark progress complete even if SSE didn't deliver
      if (!uploadComplete) {
        setUploadComplete(true);
        setUploadSteps((prev) => {
          // Only add fallback completion if SSE didn't already deliver it
          if (prev.length === 0 || prev[prev.length - 1]?.type !== 'complete') {
            return [...prev, {
              type: 'complete',
              step: 'done',
              message: added > 0
                ? `Upload complete! ${added} transactions processed.`
                : 'Upload complete',
              percentage: 100,
            }];
          }
          return prev;
        });
      }

      if (added > 0) {
        if (skipped > 0) {
          toast.success(t('Uploaded {{added}} transactions ({{skipped}} skipped — outside period)', { added, skipped }));
        } else {
          toast.success(t('Uploaded {{count}} transactions', { count: added }));
        }
      } else if (result.warning === 'date_mismatch') {
        toast.error(result.message || t('All transactions were outside the session period. Please check if the correct period was selected.'));
      } else {
        toast.warning(result.message || t('No valid transactions found in uploaded files'));
      }

      setFiles([]);
      await loadSessionStatus(session.session_id);
    } catch (err) {
      console.error('Error uploading:', err);
      setError(err.response?.data?.detail || t('Failed to upload files'));
      setUploadError(true);
      setUploadErrorMessage(err.response?.data?.detail || t('Failed to upload files'));
      toast.error(t('Failed to upload files'));
    } finally {
      setUploading(false);
      eventSource.close();
    }
  };

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

  const handleReset = () => {
    if (!session?.session_id) return;
    setConfirmDialog({
      open: true,
      title: t('Reset Session'),
      message: t('Are you sure you want to reset this session? All uploaded data will be cleared.'),
      type: 'warning',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        setResetting(true);
        const slowTimer = setTimeout(() => {
          setResetSlow(true);
        }, 10000);
        try {
          await resetAutomationSession(session.session_id);
          toast.success(t('Session reset successfully'));
          setShowProgress(false);
          setUploadSteps([]);
          setUploadComplete(false);
          setUploadError(false);
          setUploadErrorMessage('');
          await loadSessionStatus(session.session_id);
        } catch (err) {
          console.error('Error resetting session:', err);
          toast.error(t('Failed to reset session'));
        } finally {
          clearTimeout(slowTimer);
          setResetting(false);
          setResetSlow(false);
        }
      },
    });
  };

  const handleDelete = () => {
    if (!session?.session_id) return;
    setConfirmDialog({
      open: true,
      title: t('Delete Session'),
      message: t('Are you sure you want to delete this session? This cannot be undone.'),
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        setDeleting(true);
        try {
          await deleteAutomationSession(session.session_id);
          toast.success(t('Session deleted successfully'));
          setShowProgress(false);
          setUploadSteps([]);
          setUploadComplete(false);
          setUploadError(false);
          setUploadErrorMessage('');
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
      },
    });
  };

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

  const handleFilesSelected = useCallback((selectedFiles) => {
    const uploadedNames = new Set(
      (session?.uploaded_files || []).map(f => f.filename)
    );
    const pendingNames = new Set(files.map(f => f.name));

    let alreadyUploaded = 0;
    let alreadyPending = 0;
    const newFiles = selectedFiles.filter(f => {
      if (uploadedNames.has(f.name)) { alreadyUploaded++; return false; }
      if (pendingNames.has(f.name)) { alreadyPending++; return false; }
      return true;
    });

    if (alreadyUploaded > 0) {
      toast.warning(t('{{count}} file(s) already uploaded', { count: alreadyUploaded }));
    }
    if (alreadyPending > 0) {
      toast.warning(t('{{count}} duplicate file(s) skipped', { count: alreadyPending }));
    }
    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, [t, files, session?.uploaded_files]);

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

        {/* Session Status - outside grid so progress panel can't affect it */}
        {hasSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 bg-white dark:bg-[#222] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            {loadingSessions ? (
              <div className="flex items-center justify-center py-6">
                <ArrowPathIcon className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="p-5">
                {/* Top row: Period + Stats */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  {/* Period badge */}
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 truncate">
                        {session?.config?.period_name || '—'}
                      </p>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                        {formatDate(session?.config?.opening_date)} – {formatDate(session?.config?.ending_date)}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-5">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{movementRows}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t('Transactions')}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                        {session?.statistics?.files_uploaded || session?.uploaded_files?.length || 0}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t('Files')}</p>
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {resetting && (
                      <div className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 mr-1">
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                          <ClockIcon className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">
                            {resetSlow
                              ? t('This may take a few minutes...')
                              : t('Resetting...')}
                          </span>
                        </div>
                      </div>
                    )}

                    {movementRows > 0 && (
                      <>
                        <button
                          onClick={handleLoadPreview}
                          disabled={loadingPreview}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title={t('Preview Data')}
                        >
                          {loadingPreview ? (
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          ) : (
                            <DocumentTextIcon className="w-5 h-5" />
                          )}
                        </button>

                        <button
                          onClick={handleDownload}
                          disabled={downloading}
                          className="p-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title={t('Download Result')}
                        >
                          {downloading ? (
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          ) : (
                            <ArrowDownTrayIcon className="w-5 h-5" />
                          )}
                        </button>

                        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />
                      </>
                    )}

                    <button
                      onClick={handleReset}
                      disabled={resetting}
                      className="p-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                      title={t('Reset')}
                    >
                      {resetting ? (
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      ) : (
                        <ArrowPathIcon className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="p-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title={t('Delete')}
                    >
                      {deleting ? (
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      ) : (
                        <TrashIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        <div className="space-y-6">
          {/* No Session - Show Create Button */}
          {!hasSession && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-[#222] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full">
                  <DocumentChartBarIcon className="w-12 h-12 text-emerald-500" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('No Active Session')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {t('Create a new session to start generating cash reports')}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 mx-auto"
              >
                <PlayIcon className="w-5 h-5" />
                {t('Create Session')}
              </button>
            </motion.div>
          )}

          {/* Upload + Progress Section */}
          {hasSession && (
            <div className="flex flex-col lg:flex-row lg:items-stretch gap-0 relative">

              {/* LEFT: Upload Card */}
              <motion.div
                layout
                className="flex-1 w-full min-w-0 min-h-[500px] bg-white dark:bg-[#222] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 relative z-10"
              >
                {/* Header Upload */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('Upload Bank Statements')}
                    </h2>
                  </div>

                  {/* Toggle Progress Panel */}
                  {(uploadSteps.length > 0 || uploading) && (
                    <button
                      onClick={() => setShowProgress(!showProgress)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        showProgress
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {showProgress ? (
                        <>
                          <span>{t('Hide Progress')}</span>
                          <ChevronRightIcon className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <ChevronLeftIcon className="w-4 h-4" />
                          <span>{t('Show Progress')}</span>
                          {uploading && (
                            <span className="relative flex h-2.5 w-2.5 ml-1">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  )}
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

                <button
                  onClick={() => {
                    handleUpload();
                    setShowProgress(true);
                  }}
                  disabled={uploading || files.length === 0}
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
              </motion.div>

              {/* RIGHT: Sliding Progress Panel (Desktop) */}
              <AnimatePresence mode="popLayout">
                {showProgress && (
                  <motion.div
                    initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                    animate={{ width: 380, opacity: 1, marginLeft: 24 }}
                    exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative hidden lg:block overflow-hidden rounded-2xl"
                  >
                    <div className="absolute inset-0 w-[380px] overflow-y-auto">
                      <div className="h-full">
                        <UploadProgressPanel
                          isVisible={true}
                          steps={uploadSteps}
                          isComplete={uploadComplete}
                          isError={uploadError}
                          errorMessage={uploadErrorMessage}
                          isActive={uploading}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile: Progress Panel below */}
              {showProgress && (
                <div className="lg:hidden w-full mt-4">
                  <UploadProgressPanel
                    isVisible={true}
                    steps={uploadSteps}
                    isComplete={uploadComplete}
                    isError={uploadError}
                    errorMessage={uploadErrorMessage}
                    isActive={uploading}
                  />
                </div>
              )}
            </div>
          )}

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
      </div>

      {/* Create Session Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !initializing && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#222] rounded-2xl shadow-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                  <CalendarIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('Create New Session')}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Opening Date')} *
                  </label>
                  <input
                    type="date"
                    value={openingDate}
                    onChange={(e) => setOpeningDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Ending Date')} *
                  </label>
                  <input
                    type="date"
                    value={endingDate}
                    onChange={(e) => setEndingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={initializing}
                  className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleInitSession}
                  disabled={initializing || !openingDate || !endingDate}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {initializing ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      {t('Creating...')}
                    </>
                  ) : (
                    t('Create')
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Preview Dialog */}
      <AnimatePresence>
        {showPreview && previewData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#222] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <DocumentTextIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('Data Preview')}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('Showing first {{count}} rows', { count: previewData.length })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-auto max-h-[calc(85vh-80px)]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left py-3 px-3 text-gray-600 dark:text-gray-400 font-medium">#</th>
                      <th className="text-left py-3 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('Source')}</th>
                      <th className="text-left py-3 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('Bank')}</th>
                      <th className="text-left py-3 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('Account')}</th>
                      <th className="text-left py-3 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('Date')}</th>
                      <th className="text-left py-3 px-3 text-gray-600 dark:text-gray-400 font-medium max-w-xs">{t('Description')}</th>
                      <th className="text-right py-3 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('Debit')}</th>
                      <th className="text-right py-3 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('Credit')}</th>
                      <th className="text-left py-3 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('Nature')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-2.5 px-3 text-gray-400 dark:text-gray-500 text-xs">{row.row || idx + 1}</td>
                        <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 text-xs max-w-[120px] truncate" title={row.source}>{row.source}</td>
                        <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">{row.bank}</td>
                        <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 font-mono text-xs">{row.account}</td>
                        <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {row.date ? new Date(row.date).toLocaleDateString('vi-VN') : ''}
                        </td>
                        <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 text-xs max-w-[200px] truncate" title={row.description}>
                          {row.description}
                        </td>
                        <td className="py-2.5 px-3 text-right text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                          {row.debit ? Number(row.debit).toLocaleString('vi-VN') : ''}
                        </td>
                        <td className="py-2.5 px-3 text-right text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                          {row.credit ? Number(row.credit).toLocaleString('vi-VN') : ''}
                        </td>
                        <td className="py-2.5 px-3">
                          {row.nature && (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {row.nature}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#222] rounded-2xl shadow-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-full ${
                  confirmDialog.type === 'danger'
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-amber-100 dark:bg-amber-900/30'
                }`}>
                  {confirmDialog.type === 'danger' ? (
                    <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                  ) : (
                    <ArrowPathIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {confirmDialog.title}
                </h3>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {confirmDialog.message}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                  className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-white font-medium transition-colors ${
                    confirmDialog.type === 'danger'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {confirmDialog.type === 'danger' ? t('Delete') : t('Reset')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CashReport;
