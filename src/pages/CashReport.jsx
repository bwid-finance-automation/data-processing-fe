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
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  ArrowsRightLeftIcon,
  CircleStackIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  DocumentPlusIcon,
  SparklesIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, FileUploadZone, ActionMenu } from '@components/common';
import UploadProgressPanel from '../components/cash-report/UploadProgressPanel';
import useSSEProgress from '../hooks/useSSEProgress';
import {
  initAutomationSession,
  uploadBankStatements,
  runSettlementAutomation,
  runOpenNewAutomation,
  getAutomationSessionStatus,
  downloadAutomationResult,
  resetAutomationSession,
  deleteAutomationSession,
  listAutomationSessions,
  previewMovementData,
  streamUploadProgress,
  streamSettlementProgress,
  streamOpenNewProgress,
} from '../services/cash-report/cash-report-apis';

const CashReport = () => {
  const { t, i18n } = useTranslation();

  // SSE progress hooks (replaces ~20 individual state variables)
  const uploadSSE = useSSEProgress();
  const settlementSSE = useSSEProgress();
  const openNewSSE = useSSEProgress();

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
  const [downloading, setDownloading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resetSlow, setResetSlow] = useState(false);

  // Preview state
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // UI state
  const [showProgress, setShowProgress] = useState(false);
  const [showLookupFiles, setShowLookupFiles] = useState(true);
  const [showUploadedFiles, setShowUploadedFiles] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  // Lookup files for open-new
  const [lookupFiles, setLookupFiles] = useState([]);

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
      return `W${weekOfMonth}-${endWeekOfMonth}${startMonth}${year}`;
    } else {
      return `W${weekOfMonth}${startMonth}-${endWeekOfMonth}${endMonth}${year}`;
    }
  };

  // Format date using current i18n locale
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language, {
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
    setShowProgress(true);

    // Reset settlement & open-new state if re-uploading
    settlementSSE.resetAll();
    openNewSSE.resetAll();

    // Start SSE stream for upload progress
    uploadSSE.startUploadStream(() => streamUploadProgress(session.session_id));

    try {
      const result = await uploadBankStatements(session.session_id, files, true);
      const added = result.total_transactions_added || 0;
      const skipped = result.total_transactions_skipped || 0;

      if (!uploadSSE.isComplete) {
        uploadSSE.setIsComplete(true);
        uploadSSE.setSteps((prev) => {
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
      const msg = err.response?.data?.detail || t('Failed to upload files');
      setError(msg);
      uploadSSE.setError(msg);
      toast.error(t('Failed to upload files'));
    } finally {
      setUploading(false);
      uploadSSE.close();
    }
  };

  const SETTLEMENT_STEPS = [
    { key: 'scanning', title: t('Scan Movement Data'), desc: t('Reading all transactions & identifying Cash In'), icon: CircleStackIcon },
    { key: 'detecting', title: t('Detect Settlements'), desc: t('Finding keywords: tất toán, rút tiền, đáo hạn...'), icon: MagnifyingGlassIcon },
    { key: 'lookup', title: t('Lookup Saving Accounts'), desc: t('Matching saving accounts from description & catalog'), icon: BookOpenIcon },
    { key: 'writing', title: t('Create Counter Entries'), desc: t('Creating offset transactions (Internal transfer out)'), icon: DocumentPlusIcon },
    { key: 'cleanup', title: t('Cleanup & Finalize'), desc: t('Removing zero-balance rows & highlighting results'), icon: SparklesIcon },
  ];

  const OPEN_NEW_STEPS = [
    { key: 'scanning', title: t('Scan Movement Data'), desc: t('Reading all transactions & identifying Cash Out'), icon: CircleStackIcon },
    { key: 'detecting', title: t('Detect Open-New'), desc: t('Finding keywords: gửi tiền, mở HDTG, time memo...'), icon: MagnifyingGlassIcon },
    { key: 'lookup', title: t('Lookup Saving Accounts'), desc: t('Matching saving accounts from description & lookup file'), icon: BookOpenIcon },
    { key: 'writing', title: t('Create Counter Entries'), desc: t('Creating offset transactions (Internal transfer in)'), icon: DocumentPlusIcon },
    { key: 'catalog', title: t('Add to Catalogs'), desc: t('Creating rows in Acc_Char, Saving Account, Cash Balance'), icon: TableCellsIcon },
    { key: 'cleanup', title: t('Cleanup & Finalize'), desc: t('Highlighting results'), icon: SparklesIcon },
  ];

  const handleRunSettlement = async () => {
    if (!session?.session_id) return;

    setError(null);
    setShowProgress(true);

    // Start SSE workflow stream
    settlementSSE.startWorkflow(() => streamSettlementProgress(session.session_id));

    try {
      await runSettlementAutomation(session.session_id);
      await loadSessionStatus(session.session_id);
    } catch (err) {
      console.error('Error running settlement:', err);
      const msg = err.response?.data?.detail || t('Failed to run settlement');
      settlementSSE.setError(msg);
      setError(msg);
      settlementSSE.close();
    } finally {
      settlementSSE.setIsRunning(false);
    }
  };

  const handleRunOpenNew = async () => {
    if (!session?.session_id) return;

    setError(null);
    setShowProgress(true);

    // Start SSE workflow stream
    openNewSSE.startWorkflow(() => streamOpenNewProgress(session.session_id));

    try {
      await runOpenNewAutomation(session.session_id, lookupFiles);
      await loadSessionStatus(session.session_id);
      setLookupFiles([]);
    } catch (err) {
      console.error('Error running open-new:', err);
      const msg = err.response?.data?.detail || t('Failed to run open-new automation');
      openNewSSE.setError(msg);
      setError(msg);
      openNewSSE.close();
    } finally {
      openNewSSE.setIsRunning(false);
    }
  };

  const handleDownload = async (step) => {
    if (!session?.session_id) return;

    setDownloading(true);
    try {
      const { blob, filename } = await downloadAutomationResult(session.session_id, step);
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

          // Clear all progress data via hooks
          setShowProgress(false);
          uploadSSE.resetAll();
          settlementSSE.resetAll();
          openNewSSE.resetAll();
          setLookupFiles([]);

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

          // Clear all progress data via hooks
          setShowProgress(false);
          uploadSSE.resetAll();
          settlementSSE.resetAll();
          openNewSSE.resetAll();
          setLookupFiles([]);

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

  const handleLookupFilesSelected = useCallback((selectedFiles) => {
    const pendingKeys = new Set(lookupFiles.map((file) => `${file.name}__${file.size}`));
    let duplicates = 0;

    const newFiles = selectedFiles.filter((file) => {
      const key = `${file.name}__${file.size}`;
      if (pendingKeys.has(key)) {
        duplicates++;
        return false;
      }
      pendingKeys.add(key);
      return true;
    });

    if (duplicates > 0) {
      toast.warning(t('{{count}} duplicate lookup file(s) skipped', { count: duplicates }));
    }
    if (newFiles.length > 0) {
      setLookupFiles(prev => [...prev, ...newFiles]);
    }
  }, [lookupFiles, t]);

  const removeLookupFile = useCallback((index) => {
    setLookupFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const hasSession = !!session?.session_id;
  const movementRows = session?.movement_rows || session?.statistics?.movement_rows || 0;

  // Detect if any settlement/open-new activity has started
  const hasSettlementStarted = settlementSSE.isRunning || settlementSSE.currentStep || settlementSSE.result || settlementSSE.error;
  const hasOpenNewStarted = openNewSSE.isRunning || openNewSSE.currentStep || openNewSSE.result || openNewSSE.error;

  // Action menu items for overflow dropdown
  const actionMenuItems = [
    {
      icon: DocumentTextIcon,
      label: t('Preview'),
      onClick: handleLoadPreview,
      disabled: loadingPreview,
      loading: loadingPreview,
    },
    { type: 'divider' },
    {
      icon: ArrowPathIcon,
      label: t('Reset Session'),
      onClick: handleReset,
      variant: 'warning',
      disabled: resetting,
      loading: resetting,
    },
    {
      icon: TrashIcon,
      label: t('Delete Session'),
      onClick: handleDelete,
      variant: 'danger',
      disabled: deleting,
      loading: deleting,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#0d0d0d] p-6">
      <div className="max-w-6xl mx-auto">
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className="mt-6 mb-8">
          <div className="flex items-center justify-between">
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
          </div>
        </div>

        {/* Modern Master Control Panel */}
        {hasSession && (
          <div className="mb-8 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-12">
                <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div>
                <div className="p-6 lg:p-8 flex flex-col lg:flex-row lg:items-start gap-8">

                  {/* LEFT: Context & Stats */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4 mb-1">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {session?.config?.period_name || '—'}
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            Active
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            {formatDate(session?.config?.opening_date)} — {formatDate(session?.config?.ending_date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-6 mt-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('Transactions')}</span>
                        <span className="text-2xl font-semibold text-gray-900 dark:text-white">{movementRows}</span>
                      </div>

                    </div>
                  </div>

                  {/* RIGHT: Action Center */}
                  <div className="flex flex-col items-stretch lg:items-end gap-4">

                    {/* Utility Toolbar — Export + Overflow Menu */}
                    <div className="flex items-center justify-end gap-2">
                      {resetting && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium animate-pulse px-2">
                          {resetSlow ? t('Cleaning up...') : t('Resetting...')}
                        </span>
                      )}
                      <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {downloading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                        {t('Export')}
                      </button>
                      <ActionMenu items={actionMenuItems} />
                    </div>

                    {/* Primary Actions */}
                    {movementRows > 0 && (
                      <div className="flex flex-col items-stretch lg:items-end gap-3">
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                          {/* Settlement */}
                          <button
                            onClick={handleRunSettlement}
                            disabled={settlementSSE.isRunning || openNewSSE.isRunning}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                          >
                            {settlementSSE.isRunning ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <ArrowsRightLeftIcon className="w-5 h-5" />}
                            <span>{t('Settlement')}</span>
                          </button>

                          <span className="text-xs text-gray-400 font-medium uppercase">Or</span>

                          {/* Open New Group */}
                          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                            <label
                              className="relative flex items-center justify-center gap-2 px-3 py-2 rounded-lg cursor-pointer border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                              title={t('Upload Lookup Files')}
                            >
                              <input
                                type="file"
                                accept=".xlsx,.xls"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const newFiles = Array.from(e.target.files || []);
                                  if (newFiles.length > 0) {
                                    handleLookupFilesSelected(newFiles);
                                  }
                                  e.target.value = ''; // Reset so same file can be re-selected
                                }}
                              />
                              <CloudArrowUpIcon className="w-4 h-4" />
                              <span className="text-xs font-semibold whitespace-nowrap">
                                {lookupFiles.length > 0
                                  ? t('Lookup files: {{count}}', { count: lookupFiles.length })
                                  : t('Upload Lookup Files')}
                              </span>
                              {lookupFiles.length > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-purple-600 text-white text-[10px] font-bold rounded-full ring-2 ring-white dark:ring-gray-800">
                                  {lookupFiles.length}
                                </span>
                              )}
                            </label>
                            {lookupFiles.length > 0 && (
                              <button
                                onClick={() => setLookupFiles([])}
                                className="px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title={t('Clear all lookup files')}
                              >
                                {t('Clear')}
                              </button>
                            )}
                            <button
                              onClick={handleRunOpenNew}
                              disabled={openNewSSE.isRunning || settlementSSE.isRunning}
                              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#333] hover:bg-white/80 text-gray-900 dark:text-white rounded-lg font-semibold shadow-sm transition-all disabled:opacity-50"
                            >
                              {openNewSSE.isRunning ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <BanknotesIcon className="w-4 h-4 text-purple-600" />}
                              <span>{t('Open New')}</span>
                            </button>
                          </div>
                        </div>
                        {/* Lookup Files */}
                        {lookupFiles.length > 0 && (
                          <div className="w-full rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-900/10">
                            <button
                              onClick={() => setShowLookupFiles(!showLookupFiles)}
                              className="w-full flex items-center justify-between px-3 py-2 border-b border-purple-200/70 dark:border-purple-800/70 hover:bg-purple-100/50 dark:hover:bg-purple-900/20 transition-colors"
                            >
                              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                                {t('Lookup Files for Open New')}
                                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${showLookupFiles ? 'rotate-180' : ''}`} />
                              </p>
                              <span className="text-[11px] text-purple-600 dark:text-purple-400">
                                {lookupFiles.length} {t('file(s)')}
                              </span>
                            </button>
                            <AnimatePresence>
                              {showLookupFiles && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="max-h-32 overflow-y-auto p-2 space-y-1.5">
                                    {lookupFiles.map((f, i) => (
                                      <div
                                        key={`${f.name}-${i}`}
                                        className="flex items-center justify-between gap-3 px-2.5 py-1.5 bg-white dark:bg-[#2a2a2a] border border-purple-100 dark:border-purple-900 rounded-md"
                                      >
                                        <div className="min-w-0 flex items-center gap-2">
                                          <DocumentTextIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                          <span className="text-xs font-medium text-purple-800 dark:text-purple-300 truncate" title={f.name}>
                                            {f.name}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => removeLookupFile(i)}
                                          className="p-1 text-purple-500 hover:text-red-500 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition-colors"
                                          title={t('Remove')}
                                        >
                                          <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Uploaded Files List */}
                {session?.uploaded_files?.length > 0 && (
                  <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
                    <button
                      onClick={() => setShowUploadedFiles(!showUploadedFiles)}
                      className="w-full p-4 lg:px-8 hover:bg-gray-100 dark:hover:bg-gray-900/30 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                          {t('Uploaded Files')}
                          <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${showUploadedFiles ? 'rotate-180' : ''}`} />
                        </h4>
                        <span className="text-xs text-gray-400 font-mono">
                          {((session?.uploaded_files?.reduce((acc, f) => acc + (f.file_size || 0), 0) || 0) / 1024 / 1024).toFixed(2)} MB Total
                        </span>
                      </div>
                    </button>

                    <AnimatePresence>
                      {showUploadedFiles && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {/* Horizontal Scrollable Tabs */}
                          <div className="px-4 lg:px-8 pb-4">
                            <div className="relative">
                              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pb-2">
                                <div className="flex gap-2 min-w-max">
                                  {session.uploaded_files.map((file, idx) => (
                                    <div
                                      key={`${file.filename}-${idx}`}
                                      className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#252525] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-400 dark:hover:border-blue-600 transition-colors group"
                                    >
                                      <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400">
                                        <DocumentTextIcon className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap" title={file.filename}>
                                          {file.filename}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* Loading Sessions */}
          {!hasSession && loadingSessions && (
            <div className="bg-white dark:bg-[#222] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex flex-col items-center justify-center gap-4 py-6">
                <ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  {t('Loading session...')}
                </p>
              </div>
            </div>
          )}

          {/* No Session - Show Create Button */}
          {!hasSession && !loadingSessions && (
            <div className="bg-white dark:bg-[#222] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
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
            </div>
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
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('Upload Bank Statements')}
                    </h2>
                  </div>

                  {/* Toggle Progress Panel */}
                  {(uploadSSE.steps.length > 0 || uploading || hasSettlementStarted || hasOpenNewStarted) && (
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
                          {(uploading || settlementSSE.isRunning || openNewSSE.isRunning) && (
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
                    className="relative hidden lg:block overflow-hidden rounded-2xl bg-white dark:bg-[#222] border border-gray-200 dark:border-gray-800 shadow-xl"
                  >
                    <div className="absolute inset-0 w-[380px] overflow-y-auto">
                        <div className="flex flex-col p-4 gap-4">
                            {/* Section 1: Upload Progress */}
                            <UploadProgressPanel
                                isVisible={true}
                                steps={uploadSSE.steps}
                                isComplete={uploadSSE.isComplete}
                                isError={!!uploadSSE.error}
                                errorMessage={uploadSSE.error}
                                isActive={uploading}
                            />

                            {/* Section 2: Settlement Progress */}
                            {hasSettlementStarted && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="border-t border-gray-100 dark:border-gray-800 pt-4"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <ArrowsRightLeftIcon className={`w-5 h-5 ${settlementSSE.isRunning ? 'text-blue-500 animate-spin' : 'text-emerald-500'}`} />
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{t('Settlement Process')}</h3>
                                    </div>

                                    {/* Settlement Steps List */}
                                    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800 mb-4">
                                        <div className="space-y-4">
                                            {SETTLEMENT_STEPS.map((step, idx) => {
                                                const isActive = settlementSSE.currentStep === step.key && !settlementSSE.result && !settlementSSE.error;
                                                const isCompleted = settlementSSE.completedSteps.includes(step.key) || !!settlementSSE.result;
                                                const isPending = !isCompleted && !isActive;
                                                const StepIcon = step.icon;

                                                return (
                                                    <motion.div
                                                        key={step.key}
                                                        className={`flex items-start gap-3 transition-opacity duration-500 ${isPending ? 'opacity-40' : 'opacity-100'}`}
                                                    >
                                                        {/* Icon */}
                                                        <div className="relative pt-0.5">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                                                ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                                                    : isActive ? 'bg-white dark:bg-gray-900 border-blue-500 text-blue-600 dark:text-blue-400 scale-110'
                                                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'}
                                                            `}>
                                                                {isCompleted ? <CheckCircleIcon className="w-3 h-3" /> : <StepIcon className="w-3 h-3" />}
                                                            </div>
                                                            {idx < SETTLEMENT_STEPS.length - 1 && (
                                                                <div className={`absolute top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 transition-colors duration-500
                                                                    ${isCompleted ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-gray-200 dark:bg-gray-700'}`}
                                                                />
                                                            )}
                                                        </div>

                                                        {/* Text */}
                                                        <div className="flex-1 pt-0.5">
                                                            <h4 className={`text-xs font-bold ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                                                {step.title}
                                                            </h4>
                                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{step.desc}</p>
                                                            {isActive && (
                                                                <motion.div
                                                                    className="h-1 mt-1 rounded-full bg-blue-100 dark:bg-blue-900/30 overflow-hidden w-full"
                                                                >
                                                                    <motion.div className="bg-blue-500 h-full w-1/3 rounded-full"
                                                                        animate={{ x: ['-100%', '300%'] }}
                                                                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                                    />
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Settlement Error */}
                                    {settlementSSE.error && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 mb-3">
                                            {settlementSSE.error}
                                        </div>
                                    )}

                                    {/* Settlement Success Result */}
                                    {settlementSSE.result && !settlementSSE.error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-emerald-50/80 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl p-4"
                                        >
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                <div className="text-center p-2 bg-white dark:bg-white/5 rounded-lg">
                                                    <p className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold">{t('Created')}</p>
                                                    <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300">{settlementSSE.result.counter_entries_created ?? 0}</p>
                                                </div>
                                                <div className="text-center p-2 bg-white dark:bg-white/5 rounded-lg">
                                                    <p className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold">{t('Cleaned')}</p>
                                                    <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300">{settlementSSE.result.saving_rows_removed ?? 0}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDownload('settlement')}
                                                disabled={downloading}
                                                className="w-full py-2 bg-emerald-600 text-white text-xs rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                {downloading ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <ArrowDownTrayIcon className="w-3 h-3" />}
                                                {t('Download Result')}
                                            </button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* Section 3: Open-New Progress */}
                            {hasOpenNewStarted && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="border-t border-gray-100 dark:border-gray-800 pt-4"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <BanknotesIcon className={`w-5 h-5 ${openNewSSE.isRunning ? 'text-purple-500 animate-pulse' : 'text-emerald-500'}`} />
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{t('Open-New Process')}</h3>
                                    </div>

                                    {/* Open-New Steps List */}
                                    <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-800 mb-4">
                                        <div className="space-y-4">
                                            {OPEN_NEW_STEPS.map((step, idx) => {
                                                const isActive = openNewSSE.currentStep === step.key && !openNewSSE.result && !openNewSSE.error;
                                                const isCompleted = openNewSSE.completedSteps.includes(step.key) || !!openNewSSE.result;
                                                const isPending = !isCompleted && !isActive;
                                                const StepIcon = step.icon;

                                                return (
                                                    <motion.div
                                                        key={step.key}
                                                        className={`flex items-start gap-3 transition-opacity duration-500 ${isPending ? 'opacity-40' : 'opacity-100'}`}
                                                    >
                                                        {/* Icon */}
                                                        <div className="relative pt-0.5">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                                                ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                                                    : isActive ? 'bg-white dark:bg-gray-900 border-purple-500 text-purple-600 dark:text-purple-400 scale-110'
                                                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'}
                                                            `}>
                                                                {isCompleted ? <CheckCircleIcon className="w-3 h-3" /> : <StepIcon className="w-3 h-3" />}
                                                            </div>
                                                            {idx < OPEN_NEW_STEPS.length - 1 && (
                                                                <div className={`absolute top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 transition-colors duration-500
                                                                    ${isCompleted ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-gray-200 dark:bg-gray-700'}`}
                                                                />
                                                            )}
                                                        </div>

                                                        {/* Text */}
                                                        <div className="flex-1 pt-0.5">
                                                            <h4 className={`text-xs font-bold ${isActive ? 'text-purple-700 dark:text-purple-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                                                {step.title}
                                                            </h4>
                                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{step.desc}</p>
                                                            {isActive && (
                                                                <motion.div
                                                                    className="h-1 mt-1 rounded-full bg-purple-100 dark:bg-purple-900/30 overflow-hidden w-full"
                                                                >
                                                                    <motion.div className="bg-purple-500 h-full w-1/3 rounded-full"
                                                                        animate={{ x: ['-100%', '300%'] }}
                                                                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                                    />
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Open-New Error */}
                                    {openNewSSE.error && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 mb-3">
                                            {openNewSSE.error}
                                        </div>
                                    )}

                                    {/* Open-New Success Result */}
                                    {openNewSSE.result && !openNewSSE.error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-purple-50/80 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-xl p-4"
                                        >
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                <div className="text-center p-2 bg-white dark:bg-white/5 rounded-lg">
                                                    <p className="text-[10px] uppercase text-purple-600 dark:text-purple-400 font-bold">{t('Created')}</p>
                                                    <p className="text-xl font-bold text-purple-800 dark:text-purple-300">{openNewSSE.result.counter_entries_created ?? 0}</p>
                                                </div>
                                                <div className="text-center p-2 bg-white dark:bg-white/5 rounded-lg">
                                                    <p className="text-[10px] uppercase text-purple-600 dark:text-purple-400 font-bold">{t('Candidates')}</p>
                                                    <p className="text-xl font-bold text-purple-800 dark:text-purple-300">{openNewSSE.result.candidates_found ?? 0}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDownload('open_new')}
                                                disabled={downloading}
                                                className="w-full py-2 bg-purple-600 text-white text-xs rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                {downloading ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <ArrowDownTrayIcon className="w-3 h-3" />}
                                                {t('Download Result')}
                                            </button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile: Progress Panel below */}
              {showProgress && (
                <div className="lg:hidden w-full mt-4 bg-white dark:bg-[#222] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <UploadProgressPanel
                    isVisible={true}
                    steps={uploadSSE.steps}
                    isComplete={uploadSSE.isComplete}
                    isError={!!uploadSSE.error}
                    errorMessage={uploadSSE.error}
                    isActive={uploading}
                  />

                  {/* Mobile Settlement UI */}
                  {hasSettlementStarted && (
                       <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                           <p className="text-sm font-bold mb-2">{t('Settlement Status')}: {settlementSSE.currentStep}</p>
                           {settlementSSE.result && (
                               <button onClick={() => handleDownload('settlement')} className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm">
                                   {t('Download Result')}
                               </button>
                           )}
                       </div>
                  )}

                  {/* Mobile Open-New UI */}
                  {hasOpenNewStarted && (
                       <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                           <p className="text-sm font-bold mb-2">{t('Open-New Status')}: {openNewSSE.currentStep}</p>
                           {openNewSSE.result && (
                               <button onClick={() => handleDownload('open_new')} className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm">
                                   {t('Download Result')}
                               </button>
                           )}
                       </div>
                  )}
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
                {previewData.length > 0 ? (
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
                            {row.date ? new Date(row.date).toLocaleDateString(i18n.language) : ''}
                          </td>
                          <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 text-xs max-w-[200px] truncate" title={row.description}>
                            {row.description}
                          </td>
                          <td className="py-2.5 px-3 text-right text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                            {row.debit ? Number(row.debit).toLocaleString(i18n.language) : ''}
                          </td>
                          <td className="py-2.5 px-3 text-right text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                            {row.credit ? Number(row.credit).toLocaleString(i18n.language) : ''}
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
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                    <DocumentTextIcon className="w-12 h-12 mb-3" />
                    <p className="text-sm font-medium">{t('No data available')}</p>
                  </div>
                )}
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
