import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArchiveBoxIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Breadcrumb, ScrollContainer, ProjectSelector, CreateProjectDialog, PasswordDialog } from '@components/common';
import { useProjectManagement } from '@hooks';
import { getProjectBankStatements } from '../services/project/project-apis';
import {
  parseBankStatements,
  parseBankStatementsPDF,
  downloadBankStatementResults,
  downloadBankStatementFromHistory,
  getUploadedFiles,
  downloadUploadedFile,
  verifyZipPassword,
  analyzeZipContents
} from '../services/bank-statement/bank-statement-apis';
import ZipContentsDialog from '../components/bank-statement/ZipContentsDialog';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const BankStatementParser = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [fileMode, setFileMode] = useState('excel');

  // Use the custom hook for project management
  const {
    project,
    projectUuid,
    loadingProject,
    projectsList,
    loadingProjects,
    showProjectDropdown,
    setShowProjectDropdown,
    projectDropdownRef,
    showCreateProject,
    setShowCreateProject,
    createProjectForm,
    setCreateProjectForm,
    creatingProject,
    projectError,
    showCreatePassword,
    setShowCreatePassword,
    passwordDialog: projectPasswordDialog,
    setPasswordDialog: setProjectPasswordDialog,
    passwordError: projectPasswordError,
    verifyingPassword: verifyingProjectPassword,
    showPassword: showProjectPassword,
    setShowPassword: setShowProjectPassword,
    handleSelectProject: baseHandleSelectProject,
    handleVerifyPassword: handleProjectPasswordSubmit,
    handleCreateProject,
    handleCloseCreateDialog,
    handleClosePasswordDialog: handleProjectPasswordCancel,
  } = useProjectManagement({
    basePath: '/bank-statement-parser',
    onProjectChange: useCallback(() => {
      // Clear results when switching projects
      setResults(null);
      setFiles([]);
      setError(null);
      setExpandedHistorySessions({});
    }, []),
  });

  // PDF password management (separate from project password)
  const [encryptedFiles, setEncryptedFiles] = useState({});
  const [filePasswords, setFilePasswords] = useState({});
  const [filePasswordDialog, setFilePasswordDialog] = useState({ open: false, fileName: '', password: '', fileType: 'pdf' });
  const [showFilePassword, setShowFilePassword] = useState(false);
  const [checkingPdf, setCheckingPdf] = useState(false);
  const [filePasswordError, setFilePasswordError] = useState('');
  const [verifyingFilePassword, setVerifyingFilePassword] = useState(false);

  // ZIP password management
  const [encryptedZipFiles, setEncryptedZipFiles] = useState({});
  const [zipPasswords, setZipPasswords] = useState({});
  const [checkingZip, setCheckingZip] = useState(false);

  // ZIP contents dialog
  const [zipContentsDialog, setZipContentsDialog] = useState({
    open: false,
    zipFile: null,
    zipFileName: '',
    analysis: null,
    isLoading: false
  });
  const [zipPdfPasswords, setZipPdfPasswords] = useState({});
  const [pendingZipFiles, setPendingZipFiles] = useState([]);

  // Uploaded files history
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loadingUploadedFiles, setLoadingUploadedFiles] = useState(false);

  // Parse history (local)
  const [parseHistory, setParseHistory] = useState([]);

  // Project bank statements (from API)
  const [projectBankStatements, setProjectBankStatements] = useState([]);
  const [loadingProjectHistory, setLoadingProjectHistory] = useState(false);

  // Download history session state
  const [downloadingSessionId, setDownloadingSessionId] = useState(null);
  const [expandedHistorySessions, setExpandedHistorySessions] = useState({});

  // History filter states
  const [historyTimeFilter, setHistoryTimeFilter] = useState('all');
  const [historyBankFilter, setHistoryBankFilter] = useState('all');
  const [historyFileTypeFilter, setHistoryFileTypeFilter] = useState('all');

  // Fetch project bank statements when project is selected and verified
  useEffect(() => {
    const fetchProjectBankStatements = async () => {
      if (!project || !projectUuid) {
        setProjectBankStatements([]);
        return;
      }

      setLoadingProjectHistory(true);
      try {
        const data = await getProjectBankStatements(projectUuid);
        const statements = data?.sessions || data?.bank_statements || data?.cases || data;
        setProjectBankStatements(Array.isArray(statements) ? statements : []);
      } catch (err) {
        console.error('Error fetching project bank statements:', err);
        setProjectBankStatements([]);
      } finally {
        setLoadingProjectHistory(false);
      }
    };

    fetchProjectBankStatements();
  }, [project, projectUuid, results?.session_id]);

  // Handle download from history
  const handleDownloadFromHistory = async (sessionId) => {
    if (downloadingSessionId) return; // Prevent multiple downloads

    setDownloadingSessionId(sessionId);
    try {
      const { blob, filename } = await downloadBankStatementFromHistory(sessionId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading from history:', err);
      setError(t('Failed to download. Please try again.'));
    } finally {
      setDownloadingSessionId(null);
    }
  };

  const supportedBanksFallback = ['ACB', 'VIB', 'VCB', 'TCB', 'SC', 'KBANK', 'SINOPAC', 'OCB', 'WOORI', 'MBB', 'BIDV', 'VTB', 'UOB'];
  const supportedBanksPDF = ['KBANK', 'SC', 'TCB', 'VIB', 'ACB', 'UOB'];
  const struckBanks = new Set([]);
  const struckBanksPDF = new Set([]); 
  const supportedBanks = results?.supported_banks || supportedBanksFallback;

  const breadcrumbItems = [
    { label: t('Home'), href: '/' },
    { label: t('Department'), href: '/department' },
    { label: t('Finance & Accounting Department'), href: '/project/2' },
    { label: t('Bank Statement Parser'), href: '/bank-statement-parser' }
  ];

  const acceptedExtensions = fileMode === 'excel'
    ? ['.xlsx', '.xls', '.zip']
    : fileMode === 'pdf'
      ? ['.pdf', '.zip']
      : ['.zip']; // zip mode - only .zip files

  const acceptString = fileMode === 'excel'
    ? '.xlsx,.xls,.zip'
    : fileMode === 'pdf'
      ? '.pdf,.zip'
      : '.zip'; // zip mode - only .zip files

  const isValidFile = (file) => {
    const fileName = file.name.toLowerCase();
    return acceptedExtensions.some(ext => fileName.endsWith(ext));
  };

  // Check if a PDF file is password-protected
  const checkPdfEncryption = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

          loadingTask.promise
            .then(() => {
              // PDF opened successfully without password
              resolve(false);
            })
            .catch((error) => {
              // Check if error is due to password protection
              // pdf.js can throw PasswordException with code 1 (NEED_PASSWORD) or 2 (INCORRECT_PASSWORD)
              const isPasswordError =
                error.name === 'PasswordException' ||
                error.code === 1 ||
                error.code === 2 ||
                (error.message && error.message.toLowerCase().includes('password'));

              if (isPasswordError) {
                console.log('PDF is password protected:', file.name);
                resolve(true);
              } else {
                // Other error, assume not encrypted
                console.warn('PDF check error:', error);
                resolve(false);
              }
            });
        } catch (err) {
          console.warn('Error checking PDF:', err);
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file);
    });
  };

  // Verify PDF password is correct
  const verifyPdfPassword = async (fileName, password) => {
    const file = files.find(f => f.name === fileName);
    if (!file) return false;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, password });

          loadingTask.promise
            .then(() => {
              // Password is correct
              resolve(true);
            })
            .catch((error) => {
              // Password is incorrect or other error
              if (error.name === 'PasswordException' || error.code === 2) {
                resolve(false); // Incorrect password
              } else {
                console.warn('PDF verify error:', error);
                resolve(false);
              }
            });
        } catch (err) {
          console.warn('Error verifying PDF password:', err);
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file);
    });
  };

  // Check if a ZIP file is password-protected by reading file headers
  const checkZipEncryption = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target.result;
          const dataView = new DataView(arrayBuffer);

          // ZIP local file header signature: 0x04034b50 (PK\x03\x04)
          let offset = 0;
          while (offset < arrayBuffer.byteLength - 30) {
            // Check for local file header signature
            const signature = dataView.getUint32(offset, true);
            if (signature !== 0x04034b50) {
              // Not a local file header, might be central directory
              break;
            }

            // General purpose bit flag is at offset 6 (2 bytes)
            const generalPurposeFlag = dataView.getUint16(offset + 6, true);

            // Bit 0: If set, file is encrypted
            if (generalPurposeFlag & 0x0001) {
              console.log('ZIP file is encrypted:', file.name);
              resolve(true);
              return;
            }

            // Move to next file header
            // Compressed size is at offset 18 (4 bytes)
            // File name length is at offset 26 (2 bytes)
            // Extra field length is at offset 28 (2 bytes)
            const compressedSize = dataView.getUint32(offset + 18, true);
            const fileNameLength = dataView.getUint16(offset + 26, true);
            const extraFieldLength = dataView.getUint16(offset + 28, true);

            // Skip to next local file header
            offset += 30 + fileNameLength + extraFieldLength + compressedSize;
          }

          // No encrypted entries found
          resolve(false);
        } catch (err) {
          console.warn('Error checking ZIP encryption:', err);
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file);
    });
  };

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
    // Pass all files to addFiles - it will handle validation and show toast for invalid files
    addFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
    // Reset input value to allow re-selecting the same file after clear
    e.target.value = '';
  };

  const addFiles = async (newFiles) => {
    const validFiles = newFiles.filter(isValidFile);
    const invalidFiles = newFiles.filter(f => !isValidFile(f));

    // Show toast for invalid files
    if (invalidFiles.length > 0) {
      const invalidNames = invalidFiles.map(f => f.name).join(', ');
      const allowedFormats = fileMode === 'excel'
        ? '.xlsx, .xls, .zip'
        : fileMode === 'pdf'
          ? '.pdf, .zip'
          : '.zip';
      toast.error(t('Invalid file format'), {
        description: `${t('Only')} ${allowedFormats} ${t('files are allowed')}. ${t('Rejected')}: ${invalidNames}`,
      });
    }

    // Prevent duplicates
    const existingNames = files.map(f => f.name);
    const uniqueFiles = validFiles.filter(f => !existingNames.includes(f.name));

    if (uniqueFiles.length === 0) return;

    setFiles(prev => [...prev, ...uniqueFiles]);
    setError(null);
    setResults(null);

    // Check ZIP files for encryption (both modes support ZIP)
    const zipFilesAdded = uniqueFiles.filter(f => f.name.toLowerCase().endsWith('.zip'));
    if (zipFilesAdded.length > 0) {
      setCheckingZip(true);
      const newEncryptedZipFiles = { ...encryptedZipFiles };
      let firstEncryptedZip = null;
      const unencryptedZips = [];

      for (const file of zipFilesAdded) {
        const isEncrypted = await checkZipEncryption(file);
        newEncryptedZipFiles[file.name] = isEncrypted;

        if (isEncrypted && !firstEncryptedZip) {
          firstEncryptedZip = file.name;
        } else if (!isEncrypted) {
          unencryptedZips.push(file);
        }
      }

      setEncryptedZipFiles(newEncryptedZipFiles);
      setCheckingZip(false);

      // Show password dialog for first encrypted ZIP
      if (firstEncryptedZip) {
        // Store unencrypted zips for later analysis
        setPendingZipFiles(unencryptedZips);
        setFilePasswordDialog({ open: true, fileName: firstEncryptedZip, password: '', fileType: 'zip' });
      } else if (unencryptedZips.length > 0) {
        // No encrypted ZIPs, analyze the first unencrypted ZIP for PDF contents
        analyzeZipFile(unencryptedZips[0], null, unencryptedZips.slice(1));
      }
    }

    // Check PDF files for encryption (only in PDF mode)
    if (fileMode === 'pdf') {
      const pdfFiles = uniqueFiles.filter(f => f.name.toLowerCase().endsWith('.pdf'));
      if (pdfFiles.length > 0) {
        setCheckingPdf(true);
        const newEncryptedFiles = { ...encryptedFiles };
        let firstEncryptedFile = null;

        for (const file of pdfFiles) {
          const isEncrypted = await checkPdfEncryption(file);
          newEncryptedFiles[file.name] = isEncrypted;

          if (isEncrypted && !firstEncryptedFile) {
            firstEncryptedFile = file.name;
          }
        }

        setEncryptedFiles(newEncryptedFiles);
        setCheckingPdf(false);

        // Show password dialog for first encrypted PDF (only if no ZIP dialog was shown)
        if (firstEncryptedFile && !filePasswordDialog.open) {
          setFilePasswordDialog({ open: true, fileName: firstEncryptedFile, password: '', fileType: 'pdf' });
        }
      }
    }
  };

  const removeFile = (index) => {
    const fileName = files[index]?.name;
    const isZipFile = fileName?.toLowerCase().endsWith('.zip');

    setFiles(prev => prev.filter((_, i) => i !== index));

    // Clean up password state for removed file
    if (fileName) {
      setEncryptedFiles(prev => {
        const newState = { ...prev };
        delete newState[fileName];
        return newState;
      });
      setEncryptedZipFiles(prev => {
        const newState = { ...prev };
        delete newState[fileName];
        return newState;
      });
      setFilePasswords(prev => {
        const newState = { ...prev };
        delete newState[fileName];
        return newState;
      });
      setZipPasswords(prev => {
        const newState = { ...prev };
        delete newState[fileName];
        return newState;
      });

      // Clean up ZIP PDF passwords if removing a ZIP file
      if (isZipFile) {
        // Clear all ZIP PDF passwords (since we don't track which PDF belongs to which ZIP)
        setZipPdfPasswords({});
      }

      // Remove from pending queue if present
      setPendingZipFiles(prev => prev.filter(f => f.name !== fileName));

      // Close dialogs if the removed file is currently being processed
      if (filePasswordDialog.open && filePasswordDialog.fileName === fileName) {
        setFilePasswordDialog({ open: false, fileName: '', password: '', fileType: 'pdf' });
        setFilePasswordError('');
        setShowFilePassword(false);
      }
      if (zipContentsDialog.open && zipContentsDialog.zipFileName === fileName) {
        setZipContentsDialog({ open: false, zipFile: null, zipFileName: '', analysis: null, isLoading: false });
      }
    }
  };

  // File password dialog handlers (PDF/ZIP)
  const handleFilePasswordSubmit = async () => {
    if (!filePasswordDialog.password) return;

    const isZipFile = filePasswordDialog.fileType === 'zip';

    if (isZipFile) {
      // Verify ZIP password using backend API
      setVerifyingFilePassword(true);
      setFilePasswordError('');

      try {
        const file = files.find(f => f.name === filePasswordDialog.fileName);
        if (!file) {
          setFilePasswordError(t('File not found'));
          setVerifyingFilePassword(false);
          return;
        }

        const result = await verifyZipPassword(file, filePasswordDialog.password);

        if (!result.valid) {
          setFilePasswordError(t('Incorrect password. Please try again.'));
          setVerifyingFilePassword(false);
          return;
        }

        // Password is correct, save it
        const confirmedZipPassword = filePasswordDialog.password;
        const confirmedZipFileName = filePasswordDialog.fileName;

        setZipPasswords(prev => ({
          ...prev,
          [confirmedZipFileName]: confirmedZipPassword
        }));

        setFilePasswordDialog({ open: false, fileName: '', password: '', fileType: 'pdf' });
        setFilePasswordError('');
        setVerifyingFilePassword(false);
        setShowFilePassword(false);

        // After ZIP password is confirmed, analyze the ZIP contents for encrypted PDFs
        const zipFile = files.find(f => f.name === confirmedZipFileName);
        if (zipFile) {
          // Find remaining encrypted ZIPs that still need passwords
          const remainingEncryptedZips = files.filter(f =>
            encryptedZipFiles[f.name] && !zipPasswords[f.name] && f.name !== confirmedZipFileName
          );
          // Combine with pending unencrypted ZIPs
          const allRemainingZips = [...remainingEncryptedZips, ...pendingZipFiles];

          // Analyze this ZIP first
          analyzeZipFile(zipFile, confirmedZipPassword, allRemainingZips);
          setPendingZipFiles([]);
        } else {
          // Fallback: Check for next encrypted ZIP file without password
          const nextEncryptedZip = files.find(f =>
            encryptedZipFiles[f.name] && !zipPasswords[f.name] && f.name !== confirmedZipFileName
          );
          if (nextEncryptedZip) {
            setFilePasswordDialog({ open: true, fileName: nextEncryptedZip.name, password: '', fileType: 'zip' });
          }
        }
      } catch (err) {
        console.error('Error verifying ZIP password:', err);
        setFilePasswordError(t('Failed to verify password. Please try again.'));
        setVerifyingFilePassword(false);
      }
    } else {
      // PDF file - verify password
      setVerifyingFilePassword(true);
      setFilePasswordError('');

      // Verify the password is correct
      const isValid = await verifyPdfPassword(filePasswordDialog.fileName, filePasswordDialog.password);

      if (!isValid) {
        setFilePasswordError(t('Incorrect password. Please try again.'));
        setVerifyingFilePassword(false);
        return;
      }

      // Password is correct, save it
      setFilePasswords(prev => ({
        ...prev,
        [filePasswordDialog.fileName]: filePasswordDialog.password
      }));

      setFilePasswordDialog({ open: false, fileName: '', password: '', fileType: 'pdf' });
      setFilePasswordError('');
      setVerifyingFilePassword(false);
      setShowFilePassword(false);

      // Check for next encrypted file without password
      const nextEncryptedFile = files.find(f =>
        encryptedFiles[f.name] && !filePasswords[f.name] && f.name !== filePasswordDialog.fileName
      );
      if (nextEncryptedFile) {
        setFilePasswordDialog({ open: true, fileName: nextEncryptedFile.name, password: '', fileType: 'pdf' });
      }
    }
  };

  const handleFilePasswordCancel = () => {
    setFilePasswordDialog({ open: false, fileName: '', password: '', fileType: 'pdf' });
    setFilePasswordError('');
    setShowFilePassword(false);
    setVerifyingFilePassword(false);
  };

  const openFilePasswordDialog = (fileName, fileType = 'pdf') => {
    const existingPassword = fileType === 'zip' ? zipPasswords[fileName] : filePasswords[fileName];
    setFilePasswordDialog({
      open: true,
      fileName,
      password: existingPassword || '',
      fileType
    });
  };

  // Analyze ZIP file contents to detect encrypted PDFs
  const analyzeZipFile = async (zipFile, zipPassword = null, remainingZips = []) => {
    setZipContentsDialog({
      open: true,
      zipFile: zipFile,
      zipFileName: zipFile.name,
      analysis: null,
      isLoading: true
    });

    try {
      const analysis = await analyzeZipContents(zipFile, zipPassword);
      setZipContentsDialog(prev => ({
        ...prev,
        analysis: analysis,
        isLoading: false
      }));

      // Store remaining zips for later
      setPendingZipFiles(remainingZips);
    } catch (err) {
      console.error('Error analyzing ZIP contents:', err);
      setZipContentsDialog(prev => ({
        ...prev,
        analysis: { error: err.response?.data?.detail || err.message || 'Failed to analyze ZIP' },
        isLoading: false
      }));
    }
  };

  // Handle ZIP contents dialog confirm
  const handleZipContentsConfirm = (pdfPasswords) => {
    // Merge new PDF passwords with existing ones
    setZipPdfPasswords(prev => ({ ...prev, ...pdfPasswords }));

    // Close dialog
    setZipContentsDialog({
      open: false,
      zipFile: null,
      zipFileName: '',
      analysis: null,
      isLoading: false
    });

    // Check if there are more ZIP files to analyze
    if (pendingZipFiles.length > 0) {
      const nextZip = pendingZipFiles[0];
      const remainingZips = pendingZipFiles.slice(1);
      setPendingZipFiles(remainingZips);

      // Check if this ZIP needs a password
      if (encryptedZipFiles[nextZip.name]) {
        // Show password dialog for this ZIP
        setFilePasswordDialog({ open: true, fileName: nextZip.name, password: '', fileType: 'zip' });
      } else {
        // Analyze the ZIP
        analyzeZipFile(nextZip, null, remainingZips);
      }
    }
  };

  // Handle ZIP contents dialog close
  const handleZipContentsClose = () => {
    setZipContentsDialog({
      open: false,
      zipFile: null,
      zipFileName: '',
      analysis: null,
      isLoading: false
    });
    setPendingZipFiles([]);
  };

  // Open ZIP contents dialog for a specific file
  const openZipContentsDialog = (fileName) => {
    const file = files.find(f => f.name === fileName);
    if (file) {
      const zipPassword = zipPasswords[fileName] || null;
      analyzeZipFile(file, zipPassword, []);
    }
  };

  const handleModeChange = (mode) => {
    if (mode !== fileMode) {
      setFileMode(mode);
      setFiles([]); // Clear files when switching modes
      // Keep results - don't clear when switching tabs
      setError(null);
      // Keep processingTime - associated with results
      // Clear password state when switching modes
      setEncryptedFiles({});
      setEncryptedZipFiles({});
      setFilePasswords({});
      setZipPasswords({});
      setZipPdfPasswords({});
      setPendingZipFiles([]);
      setFilePasswordDialog({ open: false, fileName: '', password: '', fileType: 'pdf' });
      setFilePasswordError('');
      setShowFilePassword(false);
      setVerifyingFilePassword(false);
      setZipContentsDialog({ open: false, zipFile: null, zipFileName: '', analysis: null, isLoading: false });
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      setError(t('Please select at least one bank statement file'));
      return;
    }

    // Check if any encrypted ZIP is missing password
    const missingZipPassword = files.find(f => encryptedZipFiles[f.name] && !zipPasswords[f.name]);
    if (missingZipPassword) {
      setError(`${t('Please enter password for encrypted file')}: ${missingZipPassword.name}`);
      setFilePasswordDialog({ open: true, fileName: missingZipPassword.name, password: '', fileType: 'zip' });
      return;
    }

    // Check if any encrypted PDF is missing password
    if (fileMode === 'pdf') {
      const missingPassword = files.find(f => encryptedFiles[f.name] && !filePasswords[f.name]);
      if (missingPassword) {
        setError(`${t('Please enter password for encrypted file')}: ${missingPassword.name}`);
        setFilePasswordDialog({ open: true, fileName: missingPassword.name, password: '', fileType: 'pdf' });
        return;
      }
    }

    setProcessing(true);
    setError(null);
    setResults(null);
    setProcessingTime(null);

    const startTime = performance.now();

    try {
      // ZIP mode uses parseBankStatements which handles both Excel and PDF inside ZIP
      // Pass zipPdfPasswords for encrypted PDFs inside ZIP files
      const response = fileMode === 'pdf'
        ? await parseBankStatementsPDF(files, filePasswords, zipPasswords, projectUuid, zipPdfPasswords)
        : await parseBankStatements(files, zipPasswords, projectUuid, zipPdfPasswords);

      const endTime = performance.now();
      const elapsed = (endTime - startTime) / 1000; // Convert to seconds
      setProcessingTime(elapsed);

      setResults(response);

      // Show success toast
      const totalTransactions = response.total_transactions || 0;
      toast(t('Parse completed successfully', { count: totalTransactions }).toUpperCase(), {
        duration: 4000,
        unstyled: true,
        className: "flex items-center justify-center px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg",
        style: { backgroundColor: 'rgba(34, 197, 94, 0.5)', backdropFilter: 'blur(8px)' },
      });
    } catch (err) {
      console.error('Error processing bank statements:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to process bank statements';
      setError(errorMessage);

      // Show error toast
      toast(t('Parse failed').toUpperCase(), {
        duration: 4000,
        unstyled: true,
        className: "flex items-center justify-center px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg",
        style: { backgroundColor: 'rgba(239, 68, 68, 0.5)', backdropFilter: 'blur(8px)' },
      });
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
      const { blob, filename } = await downloadBankStatementResults(sessionId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(t('Failed to download results file'));
    }
  };

  const handleClear = () => {
    setFiles([]);
    setResults(null);
    setError(null);
    setProcessingTime(null);
    setEncryptedFiles({});
    setEncryptedZipFiles({});
    setFilePasswords({});
    setZipPasswords({});
    setZipPdfPasswords({});
    setPendingZipFiles([]);
    setFilePasswordDialog({ open: false, fileName: '', password: '', fileType: 'pdf' });
    setFilePasswordError('');
    setShowFilePassword(false);
    setVerifyingFilePassword(false);
    setZipContentsDialog({ open: false, zipFile: null, zipFileName: '', analysis: null, isLoading: false });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    // Append 'Z' if not present to indicate UTC time
    let dateString = isoString;
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
      dateString += 'Z';
    }
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClearHistory = () => {
    setParseHistory([]);
    localStorage.removeItem('bankStatementParseHistory');
  };

  const handleRemoveHistoryItem = (sessionId) => {
    setParseHistory(prev => {
      const newHistory = prev.filter(h => h.id !== sessionId);
      try {
        localStorage.setItem('bankStatementParseHistory', JSON.stringify(newHistory));
      } catch (err) {
        console.error('Error saving parse history:', err);
      }
      return newHistory;
    });
  };

  // Get unique banks from history for filter dropdown
  const uniqueBanksInHistory = [...new Set(
    projectBankStatements.flatMap(session => session.banks || [])
  )].sort();

  const historyTotals = projectBankStatements.reduce((acc, session) => {
    const uploadedCount = session.uploaded_files?.length || 0;
    const parsedCount = session.files?.length || 0;
    const derivedFileCount = session.file_count || Math.max(uploadedCount, parsedCount) || uploadedCount || parsedCount;
    acc.files += derivedFileCount;
    acc.transactions += session.total_transactions || 0;

    if (session.processed_at) {
      const processedDate = new Date(session.processed_at);
      if (!acc.latest || processedDate > acc.latest) {
        acc.latest = processedDate;
      }
    }
    return acc;
  }, { files: 0, transactions: 0, latest: null });

  // Filter history based on selected filters
  const filteredProjectBankStatements = projectBankStatements.filter(session => {
    // Time filter
    if (historyTimeFilter !== 'all') {
      const sessionDate = new Date(session.processed_at);
      const now = new Date();
      if (historyTimeFilter === '24h') {
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (sessionDate < twentyFourHoursAgo) return false;
      } else if (historyTimeFilter === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (sessionDate < oneWeekAgo) return false;
      }
    }

    // Bank filter
    if (historyBankFilter !== 'all') {
      if (!session.banks || !session.banks.includes(historyBankFilter)) return false;
    }

    // File type filter - check both uploaded_files and files arrays
    if (historyFileTypeFilter !== 'all') {
      const uploadedFiles = session.uploaded_files || [];
      const files = session.files || [];

      // Check uploaded files for ZIP
      const hasZip = uploadedFiles.some(f => f.file_name?.toLowerCase().endsWith('.zip'));

      // Check for PDF in uploaded files OR extracted from ZIP OR in parsed files
      const uploadedPdf = uploadedFiles.some(f => f.file_name?.toLowerCase().endsWith('.pdf'));
      const extractedPdf = uploadedFiles.some(f => (f.metadata?.extracted_pdf_count || 0) > 0);
      const parsedPdf = files.some(f => f.file_name?.toLowerCase().endsWith('.pdf'));
      const hasPdf = uploadedPdf || extractedPdf || parsedPdf;

      // Check for Excel in uploaded files OR extracted from ZIP OR in parsed files
      const uploadedExcel = uploadedFiles.some(f => {
        const name = f.file_name?.toLowerCase();
        return name?.endsWith('.xlsx') || name?.endsWith('.xls');
      });
      const extractedExcel = uploadedFiles.some(f => (f.metadata?.extracted_excel_count || 0) > 0);
      const parsedExcel = files.some(f => {
        const name = f.file_name?.toLowerCase();
        return name?.endsWith('.xlsx') || name?.endsWith('.xls');
      });
      const hasExcel = uploadedExcel || extractedExcel || parsedExcel;

      if (historyFileTypeFilter === 'pdf' && !hasPdf) return false;
      if (historyFileTypeFilter === 'excel' && !hasExcel) return false;
      if (historyFileTypeFilter === 'zip' && !hasZip) return false;
    }

    return true;
  });

  // Load parse history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('bankStatementParseHistory');
      if (savedHistory) {
        setParseHistory(JSON.parse(savedHistory));
      }
    } catch (err) {
      console.error('Error loading parse history:', err);
    }
  }, []);

  // Save results to history when parsing completes
  useEffect(() => {
    if (results?.session_id) {
      const historyEntry = {
        id: results.session_id,
        timestamp: new Date().toISOString(),
        mode: fileMode,
        summary: results.summary,
        download_url: results.download_url,
        fileNames: files.map(f => f.name)
      };

      setParseHistory(prev => {
        // Prevent duplicates
        const exists = prev.some(h => h.id === results.session_id);
        if (exists) return prev;

        // Keep last 20 entries
        const newHistory = [historyEntry, ...prev].slice(0, 20);

        // Save to localStorage
        try {
          localStorage.setItem('bankStatementParseHistory', JSON.stringify(newHistory));
        } catch (err) {
          console.error('Error saving parse history:', err);
        }

        return newHistory;
      });
    }
  }, [results?.session_id]);

  // Fetch uploaded files when processing completes
  useEffect(() => {
    const fetchUploadedFiles = async () => {
      if (results?.session_id) {
        setLoadingUploadedFiles(true);
        try {
          const filesData = await getUploadedFiles(results.session_id);
          setUploadedFiles(filesData.files || []);
        } catch (err) {
          console.error('Error fetching uploaded files:', err);
          setUploadedFiles([]);
        } finally {
          setLoadingUploadedFiles(false);
        }
      } else {
        setUploadedFiles([]);
      }
    };
    fetchUploadedFiles();
  }, [results?.session_id]);

  // Handle downloading original uploaded file
  const handleDownloadOriginalFile = async (fileId, filename) => {
    try {
      const response = await downloadUploadedFile(fileId);
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(t('Failed to download original file'));
    }
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
              {t('Bank Statement Parser')}
            </h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('Upload bank statements to automatically extract transactions and balances')}
          </p>

          {/* Project Selector */}
          <ProjectSelector
            project={project}
            loadingProject={loadingProject}
            projectsList={projectsList}
            loadingProjects={loadingProjects}
            showDropdown={showProjectDropdown}
            onToggleDropdown={() => setShowProjectDropdown(!showProjectDropdown)}
            dropdownRef={projectDropdownRef}
            onSelectProject={baseHandleSelectProject}
            onCreateNew={() => {
              setShowCreateProject(true);
              setShowProjectDropdown(false);
            }}
            colorTheme="blue"
            className="mt-4"
          />
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
                {t('Upload Bank Statements')}
              </h2>

              {/* File Mode Toggle */}
              <div className="mb-4">
                <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
                  <button
                    onClick={() => handleModeChange('excel')}
                    disabled={processing}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      fileMode === 'excel'
                        ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {t('Excel Files')}
                  </button>
                  <button
                    onClick={() => handleModeChange('pdf')}
                    disabled={processing}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      fileMode === 'pdf'
                        ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {t('PDF Files (OCR)')}
                  </button>
                  <button
                    onClick={() => handleModeChange('zip')}
                    disabled={processing}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1 ${
                      fileMode === 'zip'
                        ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <ArchiveBoxIcon className="h-4 w-4" />
                    {t('ZIP Files')}
                  </button>
                </div>
              </div>

              {/* Drag & Drop Zone */}
              <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    loadingProject
                      ? 'border-gray-300 dark:border-gray-700 opacity-50 cursor-not-allowed'
                      : dragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
                  }`}
                  onDragEnter={loadingProject ? undefined : handleDrag}
                  onDragLeave={loadingProject ? undefined : handleDrag}
                  onDragOver={loadingProject ? undefined : handleDrag}
                  onDrop={loadingProject ? undefined : handleDrop}
                >
                  {fileMode === 'zip' ? (
                    <ArchiveBoxIcon className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                  ) : (
                    <CloudArrowUpIcon className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                  )}
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {t('Drag and drop')} {fileMode === 'excel' ? 'Excel' : fileMode === 'pdf' ? 'PDF' : 'ZIP'} {t('files here, or')}
                  </p>
                  <label className="inline-block">
                    <input
                      key={`file-input-${projectUuid || 'standalone'}-${fileMode}`}
                      type="file"
                      multiple
                      accept={acceptString}
                      onChange={handleFileInput}
                      className="hidden"
                      disabled={processing || loadingProject}
                    />
                    <span className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer inline-block transition-colors ${loadingProject ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {t('Browse Files')}
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    {t('Supported formats')}: {fileMode === 'excel' ? '.xlsx, .xls, .zip' : fileMode === 'pdf' ? '.pdf, .zip' : '.zip'}
                  </p>
                </div>

              {/* Supported Banks - Excel mode */}
              {fileMode === 'excel' && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    {t('Supported Banks')} ({supportedBanks.length} {t('banks')})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {supportedBanks.map(bank => {
                      const normalizedBank = bank?.toString() || '';
                      const isStruck = struckBanks.has(normalizedBank.toUpperCase());

                      return (
                        <span
                          key={normalizedBank}
                          className={`px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium border border-blue-200 dark:border-blue-700 ${isStruck
                            ? 'line-through text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                            : 'text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {normalizedBank}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Supported Banks - PDF mode */}
              {fileMode === 'pdf' && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    {t('Supported Banks')} ({supportedBanksPDF.length} {t('banks')})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {supportedBanksPDF.map(bank => {
                      const normalizedBank = bank?.toString() || '';
                      const isStruck = struckBanksPDF.has(normalizedBank.toUpperCase());

                      return (
                        <span
                          key={normalizedBank}
                          className={`px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium border border-blue-200 dark:border-blue-700 ${isStruck
                            ? 'line-through text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                            : 'text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {normalizedBank}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ZIP Mode Info */}
              {fileMode === 'zip' && (
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                    <ArchiveBoxIcon className="h-4 w-4" />
                    {t('ZIP Archive Processing')}
                  </h3>
                  <div className="flex flex-wrap gap-3 text-xs mb-3">
                    <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-2.5 py-1.5 rounded-md border border-purple-200 dark:border-purple-700">
                      <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-purple-700 dark:text-purple-300">.xlsx, .xls {t('files')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-2.5 py-1.5 rounded-md border border-purple-200 dark:border-purple-700">
                      <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-purple-700 dark:text-purple-300">.pdf {t('files')} (OCR)</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-2.5 py-1.5 rounded-md border border-purple-200 dark:border-purple-700">
                      <LockClosedIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-purple-700 dark:text-purple-300">{t('Password-protected ZIP supported')}</span>
                    </div>
                  </div>

                  {/* Supported Banks for Excel */}
                  <div className="mb-3">
                    <p className="text-xs font-medium text-purple-800 dark:text-purple-200 mb-1.5">
                      Excel ({supportedBanks.length} {t('banks')}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {supportedBanks.map(bank => (
                        <span
                          key={bank}
                          className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded text-xs font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                        >
                          {bank}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Supported Banks for PDF */}
                  <div>
                    <p className="text-xs font-medium text-purple-800 dark:text-purple-200 mb-1.5">
                      PDF ({supportedBanksPDF.length} {t('banks')}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {supportedBanksPDF.map(bank => (
                        <span
                          key={bank}
                          className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded text-xs font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                        >
                          {bank}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('Selected Files')} ({files.length})
                    {(checkingPdf || checkingZip) && <span className="ml-2 text-xs text-blue-600">{t('Checking encryption...')}</span>}
                  </h3>
                  <ScrollContainer maxHeight="max-h-60" className="space-y-2">
                    {files.map((file, index) => {
                      const isZipFile = file.name.toLowerCase().endsWith('.zip');
                      const isZipEncrypted = encryptedZipFiles[file.name];
                      const isPdfEncrypted = encryptedFiles[file.name];
                      const hasPassword = isZipFile ? !!zipPasswords[file.name] : !!filePasswords[file.name];
                      const needsPassword = isZipFile ? (isZipEncrypted && !hasPassword) : (isPdfEncrypted && !hasPassword);

                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            needsPassword
                              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                              : (isZipEncrypted || isPdfEncrypted) && hasPassword
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isZipFile ? (
                              isZipEncrypted ? (
                                <LockClosedIcon className={`h-5 w-5 flex-shrink-0 ${
                                  hasPassword ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                                }`} />
                              ) : (
                                <ArchiveBoxIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                              )
                            ) : isPdfEncrypted ? (
                              <LockClosedIcon className={`h-5 w-5 flex-shrink-0 ${
                                hasPassword ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                              }`} />
                            ) : (
                              <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.size)}
                                {isZipFile && isZipEncrypted && (
                                  <span className={`ml-2 ${hasPassword ? 'text-green-600' : 'text-amber-600'}`}>
                                    {hasPassword ? `• ${t('ZIP Password set')}` : `• ${t('Encrypted - needs password')}`}
                                  </span>
                                )}
                                {isZipFile && Object.keys(zipPdfPasswords).length > 0 && (
                                  <span className="ml-2 text-blue-600">
                                    • {Object.keys(zipPdfPasswords).length} {t('PDF password(s)')}
                                  </span>
                                )}
                                {!isZipFile && isPdfEncrypted && (
                                  <span className={`ml-2 ${hasPassword ? 'text-green-600' : 'text-amber-600'}`}>
                                    {hasPassword ? `• ${t('Password set')}` : `• ${t('Encrypted - needs password')}`}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {isZipFile && isZipEncrypted && (
                              <button
                                onClick={() => openFilePasswordDialog(file.name, 'zip')}
                                disabled={processing}
                                className={`p-1 transition-colors disabled:opacity-50 ${
                                  hasPassword
                                    ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                                    : 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300'
                                }`}
                                title={hasPassword ? t('Change ZIP password') : t('Enter ZIP password')}
                              >
                                <KeyIcon className="h-5 w-5" />
                              </button>
                            )}
                            {isZipFile && (
                              <button
                                onClick={() => openZipContentsDialog(file.name)}
                                disabled={processing || (isZipEncrypted && !hasPassword)}
                                className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                                title={t('View ZIP contents & manage PDF passwords')}
                              >
                                <FolderOpenIcon className="h-5 w-5" />
                              </button>
                            )}
                            {!isZipFile && isPdfEncrypted && (
                              <button
                                onClick={() => openFilePasswordDialog(file.name, 'pdf')}
                                disabled={processing}
                                className="p-1 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors disabled:opacity-50"
                                title={hasPassword ? t('Change password') : t('Enter password')}
                              >
                                <KeyIcon className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => removeFile(index)}
                              disabled={processing}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </ScrollContainer>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleProcess}
                  disabled={processing || files.length === 0}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {processing ? t('Processing...') : t('Process Files')}
                </button>
                <button
                  onClick={handleClear}
                  disabled={processing}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {t('Clear')}
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
                {t('Results')}
              </h2>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">{t('Error')}</h4>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing State */}
              {processing && (
                <div className="py-6">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300 font-medium">{t('Processing bank statements...')}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {fileMode === 'pdf' ? t('Running OCR and extracting data...') : fileMode === 'zip' ? t('Extracting and processing files from ZIP...') : t('Auto-detecting banks and extracting data')}
                      </p>
                    </div>
                  </div>

                  {/* File Processing List */}
                  <ScrollContainer maxHeight="max-h-60" className="space-y-2">
                    {files.map((file, index) => (
                      <motion.div
                        key={file.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                            <DocumentTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {fileMode === 'pdf' ? t('OCR processing...') : fileMode === 'zip' ? t('Extracting...') : t('Parsing...')}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                            {/* Indeterminate progress bar - animates infinitely */}
                            <motion.div
                              className="absolute h-full w-8 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"
                              initial={{ x: -32 }}
                              animate={{ x: 64 }}
                              transition={{
                                duration: 1.2,
                                ease: 'easeInOut',
                                repeat: Infinity,
                                delay: index * 0.2
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </ScrollContainer>

                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
                    {fileMode === 'pdf'
                      ? t('PDF files may take 10-30 seconds each depending on complexity')
                      : fileMode === 'zip'
                        ? t('ZIP files are extracted and processed automatically (may include OCR for PDFs)')
                        : t('Excel files typically process in a few seconds')
                    }
                  </p>
                </div>
              )}

              {/* Results Display */}
              {results && !processing && (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">{t('Transactions')}</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {results.summary?.total_transactions || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300 mb-1">{t('Accounts')}</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {results.summary?.total_accounts || results.summary?.total_balances || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">{t('Processing Time')}</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {processingTime ? `${processingTime.toFixed(1)}s` : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={handleDownload}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    {t('Download Results (Excel)')}
                  </button>

                  {/* Uploaded Files Section */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <FolderOpenIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {t('Original Files')} ({uploadedFiles.length})
                        </h4>
                      </div>
                      <ScrollContainer maxHeight="max-h-40" className="space-y-2">
                        {uploadedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <DocumentTextIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                {file.original_filename}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                ({formatFileSize(file.file_size)})
                              </span>
                            </div>
                            <button
                              onClick={() => handleDownloadOriginalFile(file.id, file.original_filename)}
                              className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title={t('Download original file')}
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </ScrollContainer>
                    </div>
                  )}
                  {loadingUploadedFiles && (
                    <div className="mt-4 text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('Loading uploaded files...')}</p>
                    </div>
                  )}


                  {/* AI Usage Metrics (PDF mode only) */}
                  {results.ai_usage && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                        </svg>
                        <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
                          {t('AI Processing Details')}
                        </h4>
                        <span className="ml-auto text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full">
                          {results.ai_usage.model_name || 'Gemini'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Input Tokens')}</p>
                          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                            {results.ai_usage.total_input_tokens?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Output Tokens')}</p>
                          <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                            {results.ai_usage.total_output_tokens?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Total Tokens')}</p>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {results.ai_usage.total_tokens?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('AI Time')}</p>
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                            {results.ai_usage.total_processing_time_seconds?.toFixed(1) || 0}s
                          </p>
                        </div>
                      </div>
                      {results.ai_usage.files_processed > 1 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                          {t('Files processed')}: {results.ai_usage.files_successful}/{results.ai_usage.files_processed}
                        </p>
                      )}
                    </div>
                  )}

                  {/* File Info */}
                  {results.session_id && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-2">
                      {t('Session ID')}: {results.session_id}
                    </p>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!results && !processing && !error && (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                  <p className="text-gray-500 dark:text-gray-500">
                    {t('Upload and process files to see results')}
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
            {t('How It Works')}
          </h3>
          <ol className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <span>{t('Upload one or more bank statement files')} ({fileMode === 'excel' ? t('Excel format') : fileMode === 'pdf' ? t('PDF format - will be processed with OCR') : t('ZIP format - contains Excel and/or PDF files')})</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <span>{t('System automatically detects the bank and extracts transactions & balances')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <span>{t('Download standardized Excel file with 3 sheets: Transactions, Balances, and Summary')}</span>
            </li>
          </ol>
        </motion.div>

        {/* Parse History Section - Only show when project is selected and has history */}
        {projectUuid && (projectBankStatements.length > 0 || loadingProjectHistory) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 bg-white dark:bg-[#222] rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800"
          >
            {/* Modern Header with integrated filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                  <DocumentTextIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {t('Parse History')}
                    <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                      {filteredProjectBankStatements.length}{filteredProjectBankStatements.length !== projectBankStatements.length ? ` / ${projectBankStatements.length}` : ''}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    {t('Live for 7 days')}
                  </p>
                </div>
              </div>

              {/* Compact Filters */}
              {projectBankStatements.length > 0 && !loadingProjectHistory && (
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={historyTimeFilter}
                    onChange={(e) => setHistoryTimeFilter(e.target.value)}
                    className="h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-all hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    <option value="all">{t('All Time')}</option>
                    <option value="24h">{t('Last 24h')}</option>
                    <option value="week">{t('This Week')}</option>
                  </select>

                  {uniqueBanksInHistory.length > 0 && (
                    <select
                      value={historyBankFilter}
                      onChange={(e) => setHistoryBankFilter(e.target.value)}
                      className="h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-all hover:border-gray-300 dark:hover:border-gray-600"
                    >
                      <option value="all">{t('All Banks')}</option>
                      {uniqueBanksInHistory.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  )}

                  <select
                    value={historyFileTypeFilter}
                    onChange={(e) => setHistoryFileTypeFilter(e.target.value)}
                    className="h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-all hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    <option value="all">{t('All Types')}</option>
                    <option value="excel">Excel</option>
                    <option value="pdf">PDF</option>
                    <option value="zip">ZIP</option>
                  </select>

                  {(historyTimeFilter !== 'all' || historyBankFilter !== 'all' || historyFileTypeFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setHistoryTimeFilter('all');
                        setHistoryBankFilter('all');
                        setHistoryFileTypeFilter('all');
                      }}
                      className="h-9 px-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    >
                      {t('Clear')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Loading state for project history */}
            {loadingProjectHistory && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-2"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('Loading history...')}</p>
              </div>
            )}

            {/* Project Bank Statements - Modern List */}
            {projectUuid && !loadingProjectHistory && filteredProjectBankStatements.length > 0 && (
              <ScrollContainer maxHeight="max-h-[600px]" className="space-y-3 pr-1">
                {filteredProjectBankStatements.map((session, sessionIdx) => {
                  const uploadedFiles = session.uploaded_files || [];
                  const uploadedZipFiles = uploadedFiles.filter(f => f.file_name?.toLowerCase().endsWith('.zip')) || [];
                  const uploadedPdfFiles = uploadedFiles.filter(f => f.file_name?.toLowerCase().endsWith('.pdf')) || [];
                  const uploadedExcelFiles = uploadedFiles.filter(f => {
                    const name = f.file_name?.toLowerCase();
                    return name?.endsWith('.xlsx') || name?.endsWith('.xls');
                  }) || [];

                  let extractedExcelCount = 0;
                  let extractedPdfCount = 0;
                  uploadedZipFiles.forEach(zip => {
                    const meta = zip.metadata || {};
                    extractedExcelCount += meta.extracted_excel_count || 0;
                    extractedPdfCount += meta.extracted_pdf_count || 0;
                  });

                  const fallbackFiles = session.files || [];
                  const fallbackPdfFiles = fallbackFiles.filter(f => f.file_name?.toLowerCase().endsWith('.pdf')) || [];
                  const fallbackExcelFiles = fallbackFiles.filter(f => {
                    const name = f.file_name?.toLowerCase();
                    return name?.endsWith('.xlsx') || name?.endsWith('.xls');
                  }) || [];

                  const hasZip = uploadedZipFiles.length > 0;
                  const hasPdf = uploadedPdfFiles.length > 0 || extractedPdfCount > 0 || fallbackPdfFiles.length > 0;
                  const hasExcel = uploadedExcelFiles.length > 0 || extractedExcelCount > 0 || fallbackExcelFiles.length > 0;

                  const displayExcelCount = uploadedExcelFiles.length + extractedExcelCount || fallbackExcelFiles.length;
                  const displayPdfCount = uploadedPdfFiles.length + extractedPdfCount || fallbackPdfFiles.length;

                  const isExpanded = expandedHistorySessions[session.session_id] ?? false;

                  return (
                    <motion.div
                      key={session.session_id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: sessionIdx * 0.03 }}
                      className="group"
                    >
                      <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all duration-200">
                        {/* Main Row */}
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            {/* Left: Date & Info */}
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              {/* Date Block */}
                              <div className="flex-shrink-0 text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-none">
                                  {new Date(session.processed_at).getDate()}
                                </div>
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                  {new Date(session.processed_at).toLocaleDateString('en', { month: 'short' })}
                                </div>
                              </div>

                              {/* Divider */}
                              <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>

                              {/* Info */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {session.banks?.map(bank => (
                                    <span key={bank} className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                      {bank}
                                    </span>
                                  ))}
                                  {sessionIdx === 0 && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                                      {t('Latest')}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{formatDate(session.processed_at).split(',')[1]?.trim() || formatDate(session.processed_at)}</span>
                                  <span className="text-gray-300 dark:text-gray-600">|</span>
                                  <span>{session.file_count || displayExcelCount + displayPdfCount || 0} {t('files')}</span>
                                  <span className="text-gray-300 dark:text-gray-600">|</span>
                                  <span>{(session.total_transactions || 0).toLocaleString()} {t('txns')}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right: File Types & Actions */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {/* File Type Badges */}
                              <div className="hidden sm:flex items-center gap-1.5">
                                {hasZip && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                    ZIP
                                  </span>
                                )}
                                {hasExcel && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                    Excel
                                  </span>
                                )}
                                {hasPdf && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                    PDF
                                  </span>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setExpandedHistorySessions(prev => ({
                                    ...prev,
                                    [session.session_id]: !isExpanded
                                  }))}
                                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                  title={t('View Files')}
                                >
                                  <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => navigate(`/bank-statement-parser/session/${session.session_id}`)}
                                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                  title={t('View Details')}
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDownloadFromHistory(session.session_id)}
                                  disabled={downloadingSessionId === session.session_id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors disabled:cursor-not-allowed"
                                  title={t('Download Excel')}
                                >
                                  {downloadingSessionId === session.session_id ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                  )}
                                  <span className="hidden sm:inline">{t('Download')}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Files Section */}
                        <motion.div
                          initial={false}
                          animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0">
                            <div className="border-t border-gray-100 dark:border-gray-700/50 pt-3">
                              <div className="grid gap-2">
                                {session.files?.map((file, idx) => (
                                  <div
                                    key={file.uuid || idx}
                                    className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        file.file_name?.toLowerCase().endsWith('.pdf')
                                          ? 'bg-orange-100 dark:bg-orange-900/40'
                                          : 'bg-emerald-100 dark:bg-emerald-900/40'
                                      }`}>
                                        <span className={`text-xs font-bold ${
                                          file.file_name?.toLowerCase().endsWith('.pdf')
                                            ? 'text-orange-600 dark:text-orange-400'
                                            : 'text-emerald-600 dark:text-emerald-400'
                                        }`}>
                                          {file.file_name?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'XLS'}
                                        </span>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                          {file.file_name || '-'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {file.bank_name}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {(file.transaction_count || 0).toLocaleString()}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('txns')}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </ScrollContainer>
            )}

            {/* Empty state when no history */}
            {!loadingProjectHistory && projectBankStatements.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <DocumentTextIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{t('No parse history yet')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('Process files to see history here')}</p>
              </div>
            )}

            {/* Empty state when filters result in no matches */}
            {!loadingProjectHistory && projectBankStatements.length > 0 && filteredProjectBankStatements.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{t('No matching results')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('Try adjusting your filters')}</p>
                <button
                  onClick={() => {
                    setHistoryTimeFilter('all');
                    setHistoryBankFilter('all');
                    setHistoryFileTypeFilter('all');
                  }}
                  className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  {t('Clear all filters')}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* File Password Dialog Modal (PDF/ZIP) */}
      {filePasswordDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#222] rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${
                filePasswordDialog.fileType === 'zip'
                  ? 'bg-purple-100 dark:bg-purple-900/30'
                  : 'bg-amber-100 dark:bg-amber-900/30'
              }`}>
                {filePasswordDialog.fileType === 'zip' ? (
                  <ArchiveBoxIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                ) : (
                  <LockClosedIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {filePasswordDialog.fileType === 'zip' ? t('ZIP Password') : t('Password Required')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {filePasswordDialog.fileType === 'zip'
                    ? t('Enter password if this ZIP file is encrypted')
                    : t('This PDF file is password-protected')}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 truncate">
                {t('File')}: <span className="font-medium">{filePasswordDialog.fileName}</span>
              </p>
              <div className="relative">
                <input
                  type={showFilePassword ? 'text' : 'password'}
                  value={filePasswordDialog.password}
                  onChange={(e) => {
                    setFilePasswordDialog(prev => ({ ...prev, password: e.target.value }));
                    setFilePasswordError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !verifyingFilePassword && handleFilePasswordSubmit()}
                  placeholder={filePasswordDialog.fileType === 'zip' ? t('Enter ZIP password') : t('Enter PDF password')}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    filePasswordError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  autoFocus
                  disabled={verifyingFilePassword}
                />
                <button
                  type="button"
                  onClick={() => setShowFilePassword(!showFilePassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  disabled={verifyingFilePassword}
                >
                  {showFilePassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {filePasswordError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-4 w-4" />
                  {filePasswordError}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleFilePasswordCancel}
                disabled={verifyingFilePassword}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleFilePasswordSubmit}
                disabled={!filePasswordDialog.password || verifyingFilePassword}
                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  filePasswordDialog.fileType === 'zip'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {verifyingFilePassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('Verifying...')}
                  </>
                ) : (
                  t('Confirm')
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ZIP Contents Dialog */}
      <ZipContentsDialog
        isOpen={zipContentsDialog.open}
        onClose={handleZipContentsClose}
        zipAnalysis={zipContentsDialog.analysis}
        onConfirm={handleZipContentsConfirm}
        isLoading={zipContentsDialog.isLoading}
        zipFileName={zipContentsDialog.zipFileName}
      />

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={showCreateProject}
        onClose={handleCloseCreateDialog}
        onSubmit={handleCreateProject}
        form={createProjectForm}
        onFormChange={setCreateProjectForm}
        showPassword={showCreatePassword}
        onToggleShowPassword={() => setShowCreatePassword(!showCreatePassword)}
        creating={creatingProject}
        error={projectError}
        colorTheme="blue"
      />

      {/* Project Password Dialog */}
      <PasswordDialog
        open={projectPasswordDialog.open}
        onClose={handleProjectPasswordCancel}
        onSubmit={handleProjectPasswordSubmit}
        title={t('Protected Project')}
        subtitle={projectPasswordDialog.project?.project_name}
        description={t('This project is password protected. Please enter the password to continue.')}
        password={projectPasswordDialog.password}
        onPasswordChange={(value) => setProjectPasswordDialog(prev => ({ ...prev, password: value }))}
        showPassword={showProjectPassword}
        onToggleShowPassword={() => setShowProjectPassword(!showProjectPassword)}
        loading={verifyingProjectPassword}
        error={projectPasswordError}
        colorTheme="blue"
      />
    </div>
  );
};

export default BankStatementParser;
