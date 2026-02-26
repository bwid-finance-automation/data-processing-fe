import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DocumentTextIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Breadcrumb, ProjectSelector, CreateProjectDialog, PasswordDialog } from '@components/common';
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
import FilePasswordDialog from '../components/bank-statement/FilePasswordDialog';
import FileUploadSection from '../components/bank-statement/FileUploadSection';
import ResultsSection from '../components/bank-statement/ResultsSection';
import ParseHistorySection from '../components/bank-statement/ParseHistorySection';
import TutorialGuide from '../components/bank-statement/TutorialGuide';

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
  const [showTour, setShowTour] = useState(false);

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
  const [_parseHistory, setParseHistory] = useState([]);

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
          const arrayBuffer = e.target?.result;
          if (!(arrayBuffer instanceof ArrayBuffer)) {
            resolve(false);
            return;
          }
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

  const _handleClearHistory = () => {
    setParseHistory([]);
    localStorage.removeItem('bankStatementParseHistory');
  };

  const _handleRemoveHistoryItem = (sessionId) => {
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

  const _historyTotals = projectBankStatements.reduce((acc, session) => {
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
          <div className="mt-4 flex items-center justify-between" data-tour="bs-header">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-[#f5efe6]">
                  {t('Bank Statement Parser')}
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  {t('Upload bank statements to automatically extract transactions and balances')}
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

          {/* Project Selector */}
          <div data-tour="bs-project">
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Upload Section */}
          <div data-tour="bs-upload">
            <FileUploadSection
              fileMode={fileMode}
              processing={processing}
              loadingProject={loadingProject}
              files={files}
              dragActive={dragActive}
              acceptString={acceptString}
              supportedBanks={supportedBanks}
              supportedBanksPDF={supportedBanksPDF}
              struckBanks={struckBanks}
              struckBanksPDF={struckBanksPDF}
              encryptedFiles={encryptedFiles}
              encryptedZipFiles={encryptedZipFiles}
              filePasswords={filePasswords}
              zipPasswords={zipPasswords}
              zipPdfPasswords={zipPdfPasswords}
              checkingPdf={checkingPdf}
              checkingZip={checkingZip}
              projectUuid={projectUuid}
              onModeChange={handleModeChange}
              onDrag={handleDrag}
              onDrop={handleDrop}
              onFileInput={handleFileInput}
              onRemoveFile={removeFile}
              onOpenPasswordDialog={openFilePasswordDialog}
              onOpenZipContentsDialog={openZipContentsDialog}
              onProcess={handleProcess}
              onClear={handleClear}
              formatFileSize={formatFileSize}
            />
          </div>

          {/* Results Section */}
          <div data-tour="bs-results">
            <ResultsSection
              results={results}
              processing={processing}
              error={error}
              processingTime={processingTime}
              fileMode={fileMode}
              files={files}
              uploadedFiles={uploadedFiles}
              loadingUploadedFiles={loadingUploadedFiles}
              onDownload={handleDownload}
              onDownloadOriginalFile={handleDownloadOriginalFile}
              formatFileSize={formatFileSize}
            />
          </div>

        </div>

        {/* Parse History Section */}
        <div data-tour="bs-history" className="mt-6">
          <ParseHistorySection
            projectUuid={projectUuid}
            projectBankStatements={projectBankStatements}
            filteredProjectBankStatements={filteredProjectBankStatements}
            loadingProjectHistory={loadingProjectHistory}
            historyTimeFilter={historyTimeFilter}
            historyBankFilter={historyBankFilter}
            historyFileTypeFilter={historyFileTypeFilter}
            uniqueBanksInHistory={uniqueBanksInHistory}
            expandedHistorySessions={expandedHistorySessions}
            downloadingSessionId={downloadingSessionId}
            onTimeFilterChange={setHistoryTimeFilter}
            onBankFilterChange={setHistoryBankFilter}
            onFileTypeFilterChange={setHistoryFileTypeFilter}
            onToggleExpand={(sessionId) => setExpandedHistorySessions(prev => ({
              ...prev,
              [sessionId]: !prev[sessionId]
            }))}
            onDownloadFromHistory={handleDownloadFromHistory}
            onNavigateToSession={(sessionId) => navigate(`/bank-statement-parser/session/${sessionId}`)}
            formatDate={formatDate}
          />
        </div>
      </div>

      {/* Onboarding Tour */}
      <TutorialGuide open={showTour} onClose={() => setShowTour(false)} />

      {/* File Password Dialog Modal (PDF/ZIP) */}
      <FilePasswordDialog
        dialog={filePasswordDialog}
        onPasswordChange={(password) => {
          setFilePasswordDialog(prev => ({ ...prev, password }));
          setFilePasswordError('');
        }}
        showPassword={showFilePassword}
        onToggleShowPassword={() => setShowFilePassword(!showFilePassword)}
        error={filePasswordError}
        verifying={verifyingFilePassword}
        onSubmit={handleFilePasswordSubmit}
        onCancel={handleFilePasswordCancel}
      />

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
