import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
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
  ScaleIcon,
  ExclamationCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, FileUploadZone, ActionMenu } from '@components/common';
import TutorialGuide from '../components/cash-report/TutorialGuide';
import ConfirmDialog from '../components/cash-report/ConfirmDialog';
import CreateSessionModal from '../components/cash-report/CreateSessionModal';
import SettlementPreviewModal from '../components/cash-report/SettlementPreviewModal';
import OpenNewPreviewModal from '../components/cash-report/OpenNewPreviewModal';
import DesktopProgressPanel from '../components/cash-report/DesktopProgressPanel';
import MobileProgressPanel from '../components/cash-report/MobileProgressPanel';
import useSSEProgress from '../hooks/useSSEProgress';
import {
  uploadBankStatements,
  uploadMovementFile,
  runSettlementAutomation,
  runOpenNewAutomation,
  runReconcileChecks,
  getAutomationSessionStatus,
  downloadAutomationResult,
  resetAutomationSession,
  deleteAutomationSession,
  listAutomationSessions,
  streamUploadProgress,
  streamSettlementProgress,
  streamOpenNewProgress,
  previewSettlement,
  previewOpenNew,
} from '../services/cash-report/cash-report-apis';

const CashReport = () => {
  const { t, i18n } = useTranslation();

  // SSE progress hooks (replaces ~20 individual state variables)
  const uploadSSE = useSSEProgress();
  const movementSSE = useSSEProgress();
  const settlementSSE = useSSEProgress();
  const openNewSSE = useSSEProgress();

  // Session state
  const [session, setSession] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Form state

  // File upload state
  const [files, setFiles] = useState([]);
  const [movementFile, setMovementFile] = useState(null);

  // Loading states
  const [uploading, setUploading] = useState(false);
  const [uploadingMovement, setUploadingMovement] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resetSlow, setResetSlow] = useState(false);

  // UI state
  const [showProgress, setShowProgress] = useState(false);

  const [showUploadedFiles, setShowUploadedFiles] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [automationTab, setAutomationTab] = useState('settlement'); // 'settlement' | 'open_new' | 'reconcile'
  const [_hasDownloadedResult, setHasDownloadedResult] = useState(false);

  // Per-module error state (#9)
  const [uploadError, setUploadError] = useState(null);
  const [movementError, setMovementError] = useState(null);
  const [settlementError, setSettlementError] = useState(null);
  const [openNewError, setOpenNewError] = useState(null);
  const [reconcileError, setReconcileError] = useState(null);
  const [reconcileRunning, setReconcileRunning] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);

  // Preview modal state (#11)
  const [settlementPreview, setSettlementPreview] = useState(null);    // null | preview data object
  const [openNewPreview, setOpenNewPreview] = useState(null);          // null | preview data object
  const [previewingSettlement, setPreviewingSettlement] = useState(false);
  const [previewingOpenNew, setPreviewingOpenNew] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: 'warning' | 'danger';
    onConfirm: (() => void) | null;
  }>({
    open: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: null,
  });

  // Lookup files for open-new
  const [lookupFiles, setLookupFiles] = useState([]);

  // Refs for auto-scrolling to active step
  const settlementStepRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const openNewStepRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-scroll to active step when currentStep changes (Settlement)
  useEffect(() => {
    if (settlementSSE.currentStep && settlementSSE.currentStep !== 'done') {
      const el = settlementStepRefs.current[settlementSSE.currentStep];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [settlementSSE.currentStep]);

  // Auto-scroll to active step when currentStep changes (Open-New)
  useEffect(() => {
    if (openNewSSE.currentStep && openNewSSE.currentStep !== 'done') {
      const el = openNewStepRefs.current[openNewSSE.currentStep];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [openNewSSE.currentStep]);

  // Auto-open progress panel when any process starts running
  useEffect(() => {
    if (settlementSSE.isRunning || openNewSSE.isRunning || uploading || uploadingMovement) {
      setShowProgress(true);
    }
  }, [settlementSSE.isRunning, openNewSSE.isRunning, uploading, uploadingMovement]);

  const breadcrumbItems = [
    { label: t('Home'), href: '/' },
    { label: t('Department'), href: '/department' },
    { label: t('Finance & Accounting Department'), href: '/project/2' },
    { label: t('Cash Report'), href: '/cash-report' }
  ];

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

  const loadSessionStatus = useCallback(async (sessionId) => {
    try {
      const result = await getAutomationSessionStatus(sessionId);
      setSession(result);
    } catch (err) {
      console.error('Error loading session status:', err);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const result = await listAutomationSessions();
      if (result.sessions?.length > 0) {
        const activeSession = result.sessions[0];
        await loadSessionStatus(activeSession.session_id);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  }, [loadSessionStatus]);

  // Load sessions on mount
  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  // Clear in-memory reconcile data when switching session
  useEffect(() => {
    setReconcileError(null);
    setReconcileRunning(false);
    setReconcileResult(null);
  }, [session?.session_id]);

  // Close export dropdown on outside click (#2)
  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e) => {
      if (!e.target.closest('[data-export-menu]')) setShowExportMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu]);

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleUpload = async () => {
    if (!session?.session_id || files.length === 0) {
      toast.error(t('Please select files to upload'));
      return;
    }

    setUploading(true);
    setUploadError(null);
    setShowProgress(true);

    // Reset settlement & open-new state if re-uploading
    settlementSSE.resetAll();
    openNewSSE.resetAll();
    setHasDownloadedResult(false);
    setReconcileResult(null);
    setReconcileError(null);

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
                ? t('Upload complete! {{count}} transactions processed.', { count: added })
                : t('Upload complete'),
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
      setUploadError(msg);
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

    setSettlementError(null);
    setReconcileResult(null);
    setReconcileError(null);
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
      setSettlementError(msg);
      settlementSSE.close();
    } finally {
      settlementSSE.setIsRunning(false);
    }
  };

  const handleRunOpenNew = async () => {
    if (!session?.session_id) return;

    setOpenNewError(null);
    setReconcileResult(null);
    setReconcileError(null);
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
      setOpenNewError(msg);
      openNewSSE.close();
    } finally {
      openNewSSE.setIsRunning(false);
    }
  };

  const handlePreviewSettlement = async () => {
    if (!session?.session_id) return;
    setPreviewingSettlement(true);
    try {
      const result = await previewSettlement(session.session_id);
      setSettlementPreview(result);
    } catch (err) {
      console.error('Error previewing settlement:', err);
      toast.error(t('Failed to load settlement preview'));
    } finally {
      setPreviewingSettlement(false);
    }
  };

  const handlePreviewOpenNew = async () => {
    if (!session?.session_id) return;
    setPreviewingOpenNew(true);
    try {
      const result = await previewOpenNew(session.session_id, lookupFiles);
      setOpenNewPreview(result);
    } catch (err) {
      console.error('Error previewing open-new:', err);
      toast.error(t('Failed to load open-new preview'));
    } finally {
      setPreviewingOpenNew(false);
    }
  };

  const handleRunReconcile = async () => {
    if (!session?.session_id) return;

    setReconcileRunning(true);
    setReconcileError(null);
    setReconcileResult(null);

    try {
      const result = await runReconcileChecks(session.session_id);
      setReconcileResult(result);

      const step8Balanced = !!result?.step8_internal_transfer_reconcile?.is_balanced;
      const step9Balanced = !!result?.step9_cash_balance_reconcile?.is_balanced;
      if (step8Balanced && step9Balanced) {
        toast.success(t('Reconcile completed. No differences found.'));
      } else {
        toast.warning(t('Reconcile completed with differences.'));
      }
    } catch (err) {
      console.error('Error running reconcile:', err);
      const msg = err.response?.data?.detail || t('Failed to run reconcile checks');
      setReconcileError(msg);
      toast.error(msg);
    } finally {
      setReconcileRunning(false);
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
      setHasDownloadedResult(true);
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
          setUploadError(null);
          setMovementError(null);
          setSettlementError(null);
          setOpenNewError(null);
          setReconcileError(null);
          setReconcileRunning(false);
          setReconcileResult(null);
          setHasDownloadedResult(false);

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
          setUploadError(null);
          setMovementError(null);
          setSettlementError(null);
          setOpenNewError(null);
          setReconcileError(null);
          setReconcileRunning(false);
          setReconcileResult(null);
          setHasDownloadedResult(false);

          setSession(null);
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

  // Read Excel header row from file
  const readExcelHeaders = useCallback((file: File): Promise<{ sheetNames: string[]; sheets: Record<string, XLSX.WorkSheet> }> => {
    return new Promise<{ sheetNames: string[]; sheets: Record<string, XLSX.WorkSheet> }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array', sheetRows: 2 });
          resolve({ sheetNames: wb.SheetNames, sheets: wb.Sheets as Record<string, XLSX.WorkSheet> });
        } catch {
          reject(new Error('Cannot read Excel file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const handleFilesSelected = useCallback(async (selectedFiles) => {
    const validExts = ['.xlsx', '.xls'];
    const invalidFiles = selectedFiles.filter(f => !validExts.some(ext => f.name.toLowerCase().endsWith(ext)));
    if (invalidFiles.length > 0) {
      toast.error(t('Upload parsed bank statement Excel files (.xlsx, .xls)'));
      return;
    }

    // Validate file content - check it's a bank statement, not a movement file
    for (const file of selectedFiles) {
      try {
        const { sheetNames, sheets } = await readExcelHeaders(file);
        const firstSheet = sheets[sheetNames[0]];
        const cellA1 = firstSheet?.['A1']?.v?.toString().toLowerCase() || '';

        if (cellA1.includes('source')) {
          // Auto-redirect: set as movement file and inform user (#5)
          setMovementFile(file);
          toast.info(t('Moved to Movement Data upload zone'));
          return;
        }

        if (!sheetNames.includes('Template details')) {
          toast.error(t('It is not a valid parsed bank statement file'));
          return;
        }
      } catch {
        toast.error(t('Cannot read file. Please upload a valid Excel file'));
        return;
      }
    }

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
  }, [t, files, session?.uploaded_files, readExcelHeaders]);

  const handleRemoveFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Movement Data file handlers
  const handleMovementFileSelected = useCallback(async (selectedFiles) => {
    if (selectedFiles.length > 0) {
      const file = selectedFiles[0];
      const validExts = ['.xlsx', '.xls'];
      if (!validExts.some(ext => file.name.toLowerCase().endsWith(ext))) {
        toast.error(t('Upload pre-classified Movement file (.xlsx, .xls)'));
        return;
      }

      // Validate file content - check it's a movement file, not a bank statement
      try {
        const { sheetNames, sheets } = await readExcelHeaders(file);

        if (sheetNames.includes('Template details')) {
          // Auto-redirect: add to bank statements queue and inform user (#5)
          const uploadedNames = new Set((session?.uploaded_files || []).map(f => f.filename));
          if (!uploadedNames.has(file.name)) {
            setFiles(prev => [...prev, file]);
            toast.info(t('Moved to Bank Statements upload zone'));
          } else {
            toast.warning(t('This file was already uploaded'));
          }
          return;
        }

        const firstSheet = sheets[sheetNames[0]];
        const cellA1 = firstSheet?.['A1']?.v?.toString().toLowerCase() || '';
        if (!cellA1.includes('source')) {
          toast.error(t('It is not a valid Movement file'));
          return;
        }
      } catch {
        toast.error(t('Cannot read file. Please upload a valid Excel file'));
        return;
      }

      setMovementFile(file);
    }
  }, [t, readExcelHeaders, session?.uploaded_files]);

  const handleRemoveMovementFile = useCallback(() => {
    setMovementFile(null);
  }, []);

  const handleUploadMovement = async () => {
    if (!session?.session_id || !movementFile) {
      toast.error(t('Please select a Movement file to upload'));
      return;
    }

    setUploadingMovement(true);
    setMovementError(null);
    setShowProgress(true);

    // Reset settlement & open-new state if re-uploading
    settlementSSE.resetAll();
    openNewSSE.resetAll();
    setHasDownloadedResult(false);
    setReconcileResult(null);
    setReconcileError(null);

    // Start SSE stream for upload progress
    movementSSE.startUploadStream(() => streamUploadProgress(session.session_id));

    try {
      const result = await uploadMovementFile(session.session_id, movementFile, true);
      const added = result.total_transactions_added || 0;
      const skipped = result.total_transactions_skipped || 0;
      const found = result.total_transactions_found || 0;

      if (!movementSSE.isComplete) {
        movementSSE.setIsComplete(true);
        movementSSE.setSteps((prev) => {
          if (prev.length === 0 || prev[prev.length - 1]?.type !== 'complete') {
            return [...prev, {
              type: 'complete',
              step: 'done',
              message: added > 0
                ? t('Upload complete! {{count}} Movement transactions processed (from {{found}} found).', { count: added, found })
                : t('Upload complete'),
              percentage: 100,
            }];
          }
          return prev;
        });
      }

      if (added > 0) {
        if (skipped > 0) {
          toast.success(t('Uploaded {{added}} Movement transactions ({{skipped}} skipped — outside period)', { added, skipped }));
        } else {
          toast.success(t('Uploaded {{count}} Movement transactions', { count: added }));
        }
      } else {
        toast.warning(result.message || t('No valid Movement transactions found'));
      }

      setMovementFile(null);
      await loadSessionStatus(session.session_id);
    } catch (err) {
      console.error('Error uploading Movement file:', err);
      const msg = err.response?.data?.detail || t('Failed to upload Movement file');
      setMovementError(msg);
      movementSSE.setError(msg);
      toast.error(t('Failed to upload Movement file'));
    } finally {
      setUploadingMovement(false);
      movementSSE.close();
    }
  };

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
  const canRunReconcile = hasSession
    && movementRows > 0
    && !uploading
    && !uploadingMovement
    && !settlementSSE.isRunning
    && !openNewSSE.isRunning;

  // Detect if any settlement/open-new activity has started
  const hasSettlementStarted = settlementSSE.isRunning || settlementSSE.currentStep || settlementSSE.result || settlementSSE.error;
  const hasOpenNewStarted = openNewSSE.isRunning || openNewSSE.currentStep || openNewSSE.result || openNewSSE.error;
  const isAutomationTabLocked = settlementSSE.isRunning || openNewSSE.isRunning || reconcileRunning;

  // Dynamic session sub-state badge (#1)
  const sessionBadge = (() => {
    if (uploading || uploadingMovement) return { label: t('Uploading'), color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' };
    if (settlementSSE.isRunning) return { label: t('Settlement running'), color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' };
    if (openNewSSE.isRunning) return { label: t('Open-new running'), color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' };
    if (reconcileRunning) return { label: t('Reconcile running'), color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400' };
    if (resetting) return { label: t('Resetting'), color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' };
    if (settlementSSE.result || openNewSSE.result || reconcileResult) return { label: t('Completed'), color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' };
    if (settlementError || openNewError || reconcileError || uploadError || movementError) return { label: t('Error'), color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' };
    if (movementRows > 0) return { label: t('Ready'), color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' };
    return { label: t('Draft'), color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' };
  })();

  // Export dropdown options
  const exportOptions = [
    { label: t('Latest (full file)'), step: undefined },
    ...(settlementSSE.result ? [{ label: t('After Settlement'), step: 'settlement' }] : []),
    ...(openNewSSE.result ? [{ label: t('After Open-new'), step: 'open_new' }] : []),
  ];

  // Action menu items for overflow dropdown
  const actionMenuItems = [
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
      <div className="w-full max-w-[85vw] mx-auto">
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className="mt-6 mb-8" data-tour="header">
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
            <button
              onClick={() => setShowTour(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-colors"
            >
              <BookOpenIcon className="w-4 h-4" />
              {t('Tutorial')}
            </button>
          </div>
        </div>

        {/* ── Master Control Panel ── */}
        {hasSession && (
          <div>
            <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden" data-tour="master">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-12">
                <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div>
                {/* ── Top Bar ── */}
                <div className="px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between gap-4 flex-wrap">
                  {/* Left: period name + badge */}
                  <div className="flex items-center gap-3 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
                      {session?.config?.period_name || '—'}
                    </h2>
                    <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${sessionBadge.color}`}>
                      {sessionBadge.label}
                    </span>
                  </div>

                  {/* Right: resetting hint + Export + ActionMenu */}
                  <div className="flex items-center gap-2 shrink-0">
                    {resetting && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium animate-pulse">
                        {resetSlow ? t('Cleaning up...') : t('Resetting...')}
                      </span>
                    )}

                    {/* Toggle Files Button */}
                    {session?.uploaded_files?.length > 0 && (
                      <button
                        onClick={() => setShowUploadedFiles(!showUploadedFiles)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          showUploadedFiles
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        title={showUploadedFiles ? t('Hide Uploaded Files') : t('Show Uploaded Files')}
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('Files')}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${showUploadedFiles ? 'bg-emerald-200/50 dark:bg-emerald-800/50' : 'bg-gray-200 dark:bg-gray-700'}`}>
                          {session.uploaded_files.length}
                        </span>
                      </button>
                    )}

                    {/* Export dropdown */}
                    <div className="relative" data-export-menu data-tour="export">
                      <button
                        onClick={() => setShowExportMenu(prev => !prev)}
                        disabled={downloading}
                        aria-label={t('Export options')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {downloading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                        {t('Export')}
                        <ChevronDownIcon className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {showExportMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 mt-1 w-52 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 overflow-hidden"
                          >
                            {exportOptions.map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => { handleDownload(opt.step); setShowExportMenu(false); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                {opt.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <ActionMenu items={actionMenuItems} />
                  </div>
                </div>

                {/* ── Info Strip ── */}
                <div className="px-6 lg:px-8 pb-5 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatDate(session?.config?.opening_date)} — {formatDate(session?.config?.ending_date)}</span>
                  </div>
                  <div className="h-3.5 w-px bg-gray-200 dark:bg-gray-700" />
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{t('Transactions')}</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{movementRows.toLocaleString()}</span>
                  </div>
                </div>

                {/* ── Primary Actions & Uploaded Files ── */}
                <div className="px-6 lg:px-8 pb-6 flex flex-col md:flex-row items-stretch gap-4">

                  {/* Primary Actions Container */}
                  {movementRows > 0 && (
                    <div
                      className={`relative py-5 px-4 rounded-[2rem] bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#111] border border-gray-200/60 dark:border-gray-800/60 flex flex-col items-center gap-4 min-w-0 transition-all duration-300 ease-in-out ${showUploadedFiles && session?.uploaded_files?.length > 0 ? 'md:w-[60%]' : 'w-full'}`}
                      data-tour="automation"
                    >

                          {/* Floating pill tab switcher */}
                          <div className="flex w-full p-1.5 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-full border border-gray-200 dark:border-gray-700/50 shadow-inner">
                            <button
                              onClick={() => setAutomationTab('settlement')}
                              disabled={isAutomationTabLocked}
                              aria-label={t('Settlement tab')}
                              className={`relative flex-1 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                                automationTab === 'settlement'
                                  ? 'bg-white dark:bg-[#2a2a2a] text-indigo-700 dark:text-indigo-300 shadow-md'
                                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                              } disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                              <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
                              {t('Settlement')}
                              {settlementSSE.isRunning && (
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
                                </span>
                              )}
                              {settlementSSE.result && !settlementSSE.isRunning && (
                                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                            </button>
                            <button
                              onClick={() => setAutomationTab('open_new')}
                              disabled={isAutomationTabLocked}
                              aria-label={t('Open New tab')}
                              className={`relative flex-1 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                                automationTab === 'open_new'
                                  ? 'bg-white dark:bg-[#2a2a2a] text-purple-700 dark:text-purple-300 shadow-md'
                                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                              } disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                              <BanknotesIcon className="w-3.5 h-3.5" />
                              {t('Open New')}
                              {openNewSSE.isRunning && (
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500" />
                                </span>
                              )}
                              {openNewSSE.result && !openNewSSE.isRunning && (
                                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                            </button>
                            <button
                              onClick={() => setAutomationTab('reconcile')}
                              disabled={isAutomationTabLocked}
                              aria-label={t('Reconcile tab')}
                              className={`relative flex-1 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                                automationTab === 'reconcile'
                                  ? 'bg-white dark:bg-[#2a2a2a] text-cyan-700 dark:text-cyan-300 shadow-md'
                                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                              } disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                              <ScaleIcon className="w-3.5 h-3.5" />
                              {t('Reconcile')}
                              {reconcileRunning && (
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
                                </span>
                              )}
                              {reconcileResult && !reconcileRunning && (
                                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                            </button>
                          </div>

                          {/* Action card */}
                          <div className="w-full bg-white/80 dark:bg-white/[0.04] backdrop-blur-md p-2 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.07)] dark:shadow-none border border-gray-200/50 dark:border-gray-700/30 relative overflow-hidden">
                            {/* Ambient glow matching active tab */}
                            <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 blur-3xl opacity-[0.15] rounded-full pointer-events-none transition-colors duration-700 ${
                              automationTab === 'settlement'
                                ? 'bg-indigo-500'
                                : automationTab === 'open_new'
                                  ? 'bg-purple-500'
                                  : 'bg-cyan-500'
                            }`} />

                            <div className="relative z-10">
                              <AnimatePresence mode="wait">
                                {automationTab === 'settlement' ? (
                                  <motion.div
                                    key="settlement"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.18 }}
                                    className="flex flex-col gap-2"
                                  >
                                    <div className="flex gap-2">
                                      <button
                                        onClick={handlePreviewSettlement}
                                        disabled={previewingSettlement || settlementSSE.isRunning || openNewSSE.isRunning || reconcileRunning}
                                        aria-label={t('Preview settlement candidates')}
                                        title={t('Preview what settlement will do (dry run)')}
                                        className="flex items-center justify-center gap-1.5 w-[100px] py-3 bg-white dark:bg-[#2a2a2a] text-indigo-600 dark:text-indigo-400 font-bold rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-gray-100 dark:border-gray-800 shadow-sm transition-all disabled:opacity-50 text-sm flex-shrink-0"
                                      >
                                        {previewingSettlement
                                          ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                          : <EyeIcon className="w-4 h-4" />
                                        }
                                        {t('Preview')}
                                      </button>
                                      <button
                                        onClick={handleRunSettlement}
                                        disabled={settlementSSE.isRunning || openNewSSE.isRunning || reconcileRunning}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-gray-100 hover:bg-black dark:hover:bg-white text-white dark:text-gray-900 rounded-2xl font-bold shadow-md transition-all disabled:opacity-50"
                                      >
                                        {settlementSSE.isRunning
                                          ? <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                          : <ArrowsRightLeftIcon className="w-5 h-5" />
                                        }
                                        {settlementSSE.isRunning ? t('Running Settlement...') : t('Run Settlement')}
                                      </button>
                                    </div>
                                  </motion.div>
                                ) : automationTab === 'open_new' ? (
                                  <motion.div
                                    key="open_new"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.18 }}
                                    className="flex flex-col gap-2"
                                  >
                                    {/* Lookup files upload - drag & drop zone */}
                                    <FileUploadZone
                                      onFilesSelected={handleLookupFilesSelected}
                                      accept=".xlsx,.xls,.pdf"
                                      multiple
                                      compact
                                      selectedFiles={lookupFiles}
                                      label={t('Upload Lookup Files')}
                                      hint={t('Drag & drop or click to browse')}
                                      colorTheme="purple"
                                      showFileList={true}
                                      onRemoveFile={removeLookupFile}
                                      id="lookup-files-upload"
                                    />

                                    {/* Preview + Run Open New buttons row */}
                                    <div className="flex gap-2">
                                      <button
                                        onClick={handlePreviewOpenNew}
                                        disabled={previewingOpenNew || openNewSSE.isRunning || settlementSSE.isRunning || reconcileRunning}
                                        aria-label={t('Preview open-new candidates')}
                                        title={t('Preview what open-new will do (dry run)')}
                                        className="flex items-center justify-center gap-1.5 w-[100px] py-3 bg-white dark:bg-[#2a2a2a] text-purple-600 dark:text-purple-400 font-bold rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-100 dark:border-gray-800 shadow-sm transition-all disabled:opacity-50 text-sm flex-shrink-0"
                                      >
                                        {previewingOpenNew
                                          ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                          : <EyeIcon className="w-4 h-4" />
                                        }
                                        {t('Preview')}
                                      </button>
                                      <button
                                        onClick={handleRunOpenNew}
                                        disabled={openNewSSE.isRunning || settlementSSE.isRunning || reconcileRunning}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-gray-100 hover:bg-black dark:hover:bg-white text-white dark:text-gray-900 rounded-2xl font-bold shadow-md transition-all disabled:opacity-50"
                                      >
                                        {openNewSSE.isRunning
                                          ? <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                          : <BanknotesIcon className="w-5 h-5" />
                                        }
                                        {openNewSSE.isRunning ? t('Running Open New...') : t('Run Open New')}
                                      </button>
                                    </div>
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="reconcile"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.18 }}
                                    className="flex flex-col gap-2"
                                  >
                                    <button
                                      onClick={handleRunReconcile}
                                      disabled={!canRunReconcile || reconcileRunning}
                                      className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-bold shadow-md transition-all disabled:opacity-50"
                                    >
                                      {reconcileRunning
                                        ? <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                        : <ScaleIcon className="w-5 h-5" />
                                      }
                                      {reconcileRunning ? t('Running Reconcile...') : t('Run Reconcile')}
                                    </button>

                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="rounded-xl px-3 py-2 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/40">
                                        <p className="text-[10px] uppercase tracking-wide text-cyan-700 dark:text-cyan-300 font-semibold">
                                          {t('Step 8')}
                                        </p>
                                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
                                          {reconcileResult
                                            ? (reconcileResult?.step8_internal_transfer_reconcile?.is_balanced ? t('Balanced') : t('Has differences'))
                                            : t('No data')}
                                        </p>
                                      </div>
                                      <div className="rounded-xl px-3 py-2 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/40">
                                        <p className="text-[10px] uppercase tracking-wide text-cyan-700 dark:text-cyan-300 font-semibold">
                                          {t('Step 9')}
                                        </p>
                                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
                                          {reconcileResult
                                            ? (reconcileResult?.step9_cash_balance_reconcile?.is_balanced ? t('Balanced') : t('Has differences'))
                                            : t('No data')}
                                        </p>
                                      </div>
                                    </div>

                                    {reconcileResult && (
                                      <div className="rounded-xl px-3 py-2 bg-white dark:bg-[#2a2a2a] border border-gray-100 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300">
                                        {t('Total Accounts')}: {(reconcileResult?.step9_cash_balance_reconcile?.total_accounts || 0).toLocaleString()} | {t('Not Reconciled')}: {(reconcileResult?.step9_cash_balance_reconcile?.not_reconciled_count || 0).toLocaleString()}
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                    </div>
                  )}

                  {/* Uploaded Files Side Panel — CSS-only transition, always mounted */}
                  {session?.uploaded_files?.length > 0 && (
                    <div
                      className={`hidden md:block overflow-hidden transition-all duration-300 ease-in-out ${
                        showUploadedFiles ? 'md:w-[40%] opacity-100' : 'w-0 opacity-0'
                      }`}
                    >
                      <div className="h-full py-4 px-3 rounded-[2rem] bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#111] border border-gray-200/60 dark:border-gray-800/60 min-w-[220px] flex flex-col">
                        <div className="flex items-center justify-between mb-3 flex-shrink-0">
                          <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider flex items-center gap-1.5">
                            <DocumentTextIcon className="w-3.5 h-3.5" />
                            {t('Files')}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">
                            {((session?.uploaded_files?.reduce((acc, f) => acc + (f.file_size || 0), 0) || 0) / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 min-h-0">
                          {session.uploaded_files.map((file, idx) => (
                            <div
                              key={`${file.filename}-${idx}`}
                              className="flex items-center gap-2 px-2.5 py-2 bg-white dark:bg-white/[0.04] rounded-lg border border-gray-200 dark:border-gray-700/40 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                            >
                              <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400 flex-shrink-0">
                                <DocumentTextIcon className="w-3.5 h-3.5" />
                              </div>
                              <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate" title={file.filename}>
                                {file.filename}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
            </div>
          </div>
        )}

        {/* ── Loading / No-Session / Upload / Errors ── */}
        <div className="mt-6 space-y-6">

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
            <div className="bg-white dark:bg-[#222] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 text-center" data-tour="session">
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

              {/* Upload Card */}
              <motion.div
                layout
                className="flex-1 w-full min-w-0 bg-white dark:bg-[#222] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 relative z-10"
                data-tour="upload"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('Upload Files')}
                  </h2>

                  {/* Toggle Progress Panel */}
                  {(uploadSSE.steps.length > 0 || movementSSE.steps.length > 0 || uploading || uploadingMovement || hasSettlementStarted || hasOpenNewStarted) && (
                    <button
                      onClick={() => setShowProgress(!showProgress)}
                      aria-label={showProgress ? t('Hide progress panel') : t('Show progress panel')}
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
                          {(uploading || uploadingMovement || settlementSSE.isRunning || openNewSSE.isRunning) && (
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

                {/* Two Upload Zones Side by Side */}
                <div className="flex flex-col md:flex-row gap-0 p-6">

                  {/* LEFT: Bank Statements */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {t('Upload Bank Statements')}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {t('Upload parsed bank statement Excel files')}
                    </p>

                    <div className="flex-1">
                      <FileUploadZone
                        onFilesSelected={handleFilesSelected}
                        accept=".xlsx,.xls"
                        multiple={true}
                        disabled={uploading || uploadingMovement}
                        selectedFiles={files}
                        onRemoveFile={handleRemoveFile}
                        colorTheme="emerald"
                        label={t('Drop Excel files here')}
                        hint={t('Parsed bank statements (.xlsx)')}
                      />
                    </div>

                    <button
                      onClick={() => {
                        handleUpload();
                      }}
                      disabled={uploading || uploadingMovement || files.length === 0}
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
                  </div>

                  {/* Vertical Divider */}
                  <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-700 mx-6" />
                  <div className="md:hidden h-px bg-gray-200 dark:bg-gray-700 my-6" />

                  {/* RIGHT: Movement Data */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {t('Upload Movement Data')}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {t('Upload pre-classified Movement file')}
                    </p>

                    <div className="flex-1">
                      <FileUploadZone
                        onFilesSelected={handleMovementFileSelected}
                        accept=".xlsx,.xls"
                        multiple={false}
                        selectedFiles={movementFile ? [movementFile] : []}
                        onRemoveFile={handleRemoveMovementFile}
                        colorTheme="purple"
                        label={t('Drop Movement file here')}
                        hint={t('Movement Data (.xlsx)')}
                      />
                    </div>

                    <button
                      onClick={handleUploadMovement}
                      disabled={uploadingMovement || uploading || !movementFile}
                      className="mt-4 w-full py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {uploadingMovement ? (
                        <>
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          {t('Uploading Movement Data...')}
                        </>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="w-5 h-5" />
                          {t('Upload Movement File')}
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </motion.div>

              {/* RIGHT: Sliding Progress Panel (Desktop) */}
              <DesktopProgressPanel
                showProgress={showProgress}
                uploading={uploading}
                uploadingMovement={uploadingMovement}
                downloading={downloading}
                uploadSSE={uploadSSE}
                movementSSE={movementSSE}
                settlementSSE={settlementSSE}
                openNewSSE={openNewSSE}
                hasSettlementStarted={hasSettlementStarted}
                hasOpenNewStarted={hasOpenNewStarted}
                settlementSteps={SETTLEMENT_STEPS}
                openNewSteps={OPEN_NEW_STEPS}
                settlementStepRefs={settlementStepRefs}
                openNewStepRefs={openNewStepRefs}
                onDownload={handleDownload}
              />

              {/* Mobile: Progress Panel */}
              <MobileProgressPanel
                visible={showProgress || uploading || uploadingMovement || settlementSSE.isRunning || openNewSSE.isRunning}
                uploading={uploading}
                uploadingMovement={uploadingMovement}
                uploadSSE={uploadSSE}
                movementSSE={movementSSE}
                settlementSSE={settlementSSE}
                openNewSSE={openNewSSE}
                hasSettlementStarted={hasSettlementStarted}
                hasOpenNewStarted={hasOpenNewStarted}
                settlementError={settlementError}
                openNewError={openNewError}
                onClose={() => setShowProgress(false)}
                onDownload={handleDownload}
              />
            </div>
          )}

          {/* Per-module Error Display (#9) */}
          <AnimatePresence>
            {[
              { key: 'upload', error: uploadError, label: t('Upload error'), onClear: () => setUploadError(null) },
              { key: 'movement', error: movementError, label: t('Movement upload error'), onClear: () => setMovementError(null) },
              { key: 'settlement', error: settlementError, label: t('Settlement error'), onClear: () => setSettlementError(null) },
              { key: 'openNew', error: openNewError, label: t('Open-new error'), onClear: () => setOpenNewError(null) },
              { key: 'reconcile', error: reconcileError, label: t('Reconcile error'), onClear: () => setReconcileError(null) },
            ].filter(e => !!e.error).map(({ key, error: errMsg, label, onClear }) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
              >
                <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-sm text-red-700 dark:text-red-300 break-words">{errMsg}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(errMsg);
                      toast.success(t('Error copied to clipboard'));
                    }}
                    aria-label={t('Copy error details')}
                    title={t('Copy error details')}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClear}
                    aria-label={t('Dismiss error')}
                    title={t('Dismiss')}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>{/* end full-width section */}

        {/* Onboarding Tour */}
        <TutorialGuide open={showTour} onClose={() => setShowTour(false)} />
      </div>

      {/* Create Session Modal */}
      <CreateSessionModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={async () => {
          setHasDownloadedResult(false);
          await loadSessions();
        }}
      />

      {/* Settlement Preview Modal */}
      <SettlementPreviewModal
        preview={settlementPreview}
        onClose={() => setSettlementPreview(null)}
      />

      {/* Open-New Preview Modal */}
      <OpenNewPreviewModal
        preview={openNewPreview}
        onClose={() => setOpenNewPreview(null)}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default CashReport;
