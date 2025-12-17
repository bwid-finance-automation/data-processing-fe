import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  LockClosedIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  FolderOpenIcon,
  FolderIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Breadcrumb from '../components/common/Breadcrumb';
import { getProject, getProjects, getProjectBankStatements, createProject, verifyProjectPassword } from '../services/project/project-apis';
import {
  parseBankStatements,
  parseBankStatementsPDF,
  downloadBankStatementResults,
  downloadBankStatementFromHistory,
  getUploadedFiles,
  downloadUploadedFile
} from '../services/bank-statement/bank-statement-apis';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const BankStatementParser = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectUuid = searchParams.get('project');

  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [fileMode, setFileMode] = useState('excel'); // 'excel' or 'pdf'

  // Project context
  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [projectsList, setProjectsList] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const projectDropdownRef = useRef(null);

  // PDF password management
  const [encryptedFiles, setEncryptedFiles] = useState({}); // {fileName: true/false}
  const [filePasswords, setFilePasswords] = useState({}); // {fileName: password}
  const [passwordDialog, setPasswordDialog] = useState({ open: false, fileName: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [checkingPdf, setCheckingPdf] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // Uploaded files history
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loadingUploadedFiles, setLoadingUploadedFiles] = useState(false);

  // Parse history (local)
  const [parseHistory, setParseHistory] = useState([]);

  // Project bank statements (from API)
  const [projectBankStatements, setProjectBankStatements] = useState([]);
  const [loadingProjectHistory, setLoadingProjectHistory] = useState(false);

  // Create project dialog
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectPassword, setNewProjectPassword] = useState('');
  const [showNewProjectPassword, setShowNewProjectPassword] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  // Project password dialog
  const [projectPasswordDialog, setProjectPasswordDialog] = useState({
    open: false,
    project: null,
    password: '',
  });
  const [projectPasswordError, setProjectPasswordError] = useState('');
  const [verifyingProjectPassword, setVerifyingProjectPassword] = useState(false);
  const [showProjectPassword, setShowProjectPassword] = useState(false);

  // Download history session state
  const [downloadingSessionId, setDownloadingSessionId] = useState(null);
  // Track expanded/collapsed state for history sessions (first one expanded by default)
  const [expandedHistorySessions, setExpandedHistorySessions] = useState({});

  // Fetch project info if projectUuid is provided
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectUuid) {
        setProject(null);
        setProjectBankStatements([]);
        return;
      }

      setLoadingProject(true);
      try {
        const projectData = await getProject(projectUuid);

        // Check if project is protected and password dialog is not already open
        if (projectData.is_protected && !projectPasswordDialog.open) {
          // Show password dialog for protected project
          setProjectPasswordDialog({
            open: true,
            project: projectData,
            password: '',
          });
          setProjectPasswordError('');
          setShowProjectPassword(false);
          setProject(null); // Don't set project until password verified
        } else if (!projectData.is_protected) {
          setProject(projectData);
        }
        // If dialog is already open, don't change anything (user is entering password)
      } catch (err) {
        console.error('Error fetching project:', err);
        setProject(null);
      } finally {
        setLoadingProject(false);
      }
    };

    fetchProject();
  }, [projectUuid]);

  // Fetch project bank statements when project is selected and verified
  useEffect(() => {
    const fetchProjectBankStatements = async () => {
      // Only fetch if project is set (meaning password was verified for protected projects)
      if (!project || !projectUuid) {
        setProjectBankStatements([]);
        return;
      }

      setLoadingProjectHistory(true);
      try {
        const data = await getProjectBankStatements(projectUuid);
        // API returns { sessions: [...], case_type, total_sessions, ... }
        setProjectBankStatements(data.sessions || []);
      } catch (err) {
        console.error('Error fetching project bank statements:', err);
        setProjectBankStatements([]);
      } finally {
        setLoadingProjectHistory(false);
      }
    };

    fetchProjectBankStatements();
  }, [project, projectUuid, results?.session_id]); // Refetch when project verified or new parse completes

  // Fetch all projects for dropdown
  useEffect(() => {
    const fetchProjectsList = async () => {
      setLoadingProjects(true);
      try {
        const data = await getProjects();
        setProjectsList(data.projects || []);
      } catch (err) {
        console.error('Error fetching projects list:', err);
        setProjectsList([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjectsList();
  }, []);

  // Handle project selection
  const handleSelectProject = (selectedProject) => {
    // Clear results when switching projects or going to standalone
    setResults(null);
    setFiles([]);
    setError(null);
    setExpandedHistorySessions({}); // Reset expanded state for new project

    if (selectedProject) {
      // Check if project is protected
      if (selectedProject.is_protected) {
        // Show password dialog
        setProjectPasswordDialog({
          open: true,
          project: selectedProject,
          password: '',
        });
        setProjectPasswordError('');
        setShowProjectPassword(false);
        setShowProjectDropdown(false);
      } else {
        // No password, select directly
        navigate(`/bank-statement-parser?project=${selectedProject.uuid}`);
        setShowProjectDropdown(false);
      }
    } else {
      navigate('/bank-statement-parser');
      setShowProjectDropdown(false);
    }
  };

  // Handle project password verification
  const handleProjectPasswordSubmit = async () => {
    if (!projectPasswordDialog.password || !projectPasswordDialog.project) return;

    setVerifyingProjectPassword(true);
    setProjectPasswordError('');

    try {
      const result = await verifyProjectPassword(
        projectPasswordDialog.project.uuid,
        projectPasswordDialog.password
      );

      if (result.verified) {
        // Password correct, set the project and close dialog
        setProject(projectPasswordDialog.project);
        // Navigate if not already on this project URL
        if (projectUuid !== projectPasswordDialog.project.uuid) {
          navigate(`/bank-statement-parser?project=${projectPasswordDialog.project.uuid}`);
        }
        setProjectPasswordDialog({ open: false, project: null, password: '' });
      } else {
        setProjectPasswordError(t('Incorrect password'));
      }
    } catch (err) {
      console.error('Error verifying project password:', err);
      setProjectPasswordError(t('Failed to verify password'));
    } finally {
      setVerifyingProjectPassword(false);
    }
  };

  // Handle project password cancel
  const handleProjectPasswordCancel = () => {
    setProjectPasswordDialog({ open: false, project: null, password: '' });
    setProjectPasswordError('');
    // If user cancels password on a protected project, redirect to standalone
    if (projectUuid) {
      navigate('/bank-statement-parser');
    }
  };

  // Handle create new project
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setCreatingProject(true);
    try {
      const newProject = await createProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || null,
        password: newProjectPassword.trim() || null
      });

      // Add to projects list
      setProjectsList(prev => [newProject, ...prev]);

      // Select the new project
      navigate(`/bank-statement-parser?project=${newProject.uuid}`);

      // Reset and close dialog
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectPassword('');
      setShowNewProjectPassword(false);
      setShowCreateProject(false);
      setShowProjectDropdown(false);
    } catch (err) {
      console.error('Error creating project:', err);
      setError(t('Failed to create project. Please try again.'));
    } finally {
      setCreatingProject(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle download from history
  const handleDownloadFromHistory = async (sessionId) => {
    if (downloadingSessionId) return; // Prevent multiple downloads

    setDownloadingSessionId(sessionId);
    try {
      const blob = await downloadBankStatementFromHistory(sessionId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bank_statements_${sessionId.slice(0, 8)}.xlsx`;
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

  const supportedBanksFallback = ['ACB', 'VIB', 'CTBC', 'KBANK', 'SINOPAC', 'OCB', 'WOORI', 'MBB', 'BIDV', 'VTB', 'VCB'];
  const supportedBanksPDF = ['KBANK', 'SCB', 'TCB', 'VIB'];
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
    ? ['.xlsx', '.xls']
    : ['.pdf'];

  const acceptString = fileMode === 'excel'
    ? '.xlsx,.xls'
    : '.pdf';

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
    const validFiles = droppedFiles.filter(isValidFile);

    addFiles(validFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = async (newFiles) => {
    const validFiles = newFiles.filter(isValidFile);

    // Prevent duplicates
    const existingNames = files.map(f => f.name);
    const uniqueFiles = validFiles.filter(f => !existingNames.includes(f.name));

    if (uniqueFiles.length === 0) return;

    setFiles(prev => [...prev, ...uniqueFiles]);
    setError(null);
    setResults(null);

    // Check PDF files for encryption (only in PDF mode)
    if (fileMode === 'pdf') {
      setCheckingPdf(true);
      const newEncryptedFiles = { ...encryptedFiles };

      for (const file of uniqueFiles) {
        const isEncrypted = await checkPdfEncryption(file);
        newEncryptedFiles[file.name] = isEncrypted;

        // If encrypted, show password dialog
        if (isEncrypted) {
          setPasswordDialog({ open: true, fileName: file.name, password: '' });
          // Wait for user to close dialog before checking next file
          break; // Process one at a time
        }
      }

      setEncryptedFiles(newEncryptedFiles);
      setCheckingPdf(false);
    }
  };

  const removeFile = (index) => {
    const fileName = files[index]?.name;
    setFiles(prev => prev.filter((_, i) => i !== index));

    // Clean up password state for removed file
    if (fileName) {
      setEncryptedFiles(prev => {
        const newState = { ...prev };
        delete newState[fileName];
        return newState;
      });
      setFilePasswords(prev => {
        const newState = { ...prev };
        delete newState[fileName];
        return newState;
      });
    }
  };

  // Password dialog handlers
  const handlePasswordSubmit = async () => {
    if (!passwordDialog.password) return;

    setVerifyingPassword(true);
    setPasswordError('');

    // Verify the password is correct
    const isValid = await verifyPdfPassword(passwordDialog.fileName, passwordDialog.password);

    if (!isValid) {
      setPasswordError(t('Incorrect password. Please try again.'));
      setVerifyingPassword(false);
      return;
    }

    // Password is correct, save it
    setFilePasswords(prev => ({
      ...prev,
      [passwordDialog.fileName]: passwordDialog.password
    }));

    setPasswordDialog({ open: false, fileName: '', password: '' });
    setPasswordError('');
    setVerifyingPassword(false);
    setShowPassword(false);

    // Check for next encrypted file without password
    const nextEncryptedFile = files.find(f =>
      encryptedFiles[f.name] && !filePasswords[f.name] && f.name !== passwordDialog.fileName
    );
    if (nextEncryptedFile) {
      setPasswordDialog({ open: true, fileName: nextEncryptedFile.name, password: '' });
    }
  };

  const handlePasswordCancel = () => {
    setPasswordDialog({ open: false, fileName: '', password: '' });
    setPasswordError('');
    setShowPassword(false);
  };

  const openPasswordDialog = (fileName) => {
    setPasswordDialog({
      open: true,
      fileName,
      password: filePasswords[fileName] || ''
    });
  };

  const handleModeChange = (mode) => {
    if (mode !== fileMode) {
      setFileMode(mode);
      setFiles([]); // Clear files when switching modes
      setResults(null);
      setError(null);
      // Clear password state when switching modes
      setEncryptedFiles({});
      setFilePasswords({});
      setPasswordDialog({ open: false, fileName: '', password: '' });
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      setError(t('Please select at least one bank statement file'));
      return;
    }

    // Check if any encrypted PDF is missing password
    if (fileMode === 'pdf') {
      const missingPassword = files.find(f => encryptedFiles[f.name] && !filePasswords[f.name]);
      if (missingPassword) {
        setError(`${t('Please enter password for encrypted file')}: ${missingPassword.name}`);
        setPasswordDialog({ open: true, fileName: missingPassword.name, password: '' });
        return;
      }
    }

    setProcessing(true);
    setError(null);
    setResults(null);

    try {
      const response = fileMode === 'excel'
        ? await parseBankStatements(files, projectUuid)
        : await parseBankStatementsPDF(files, filePasswords, projectUuid);
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
      setError(t('Failed to download results file'));
    }
  };

  const handleClear = () => {
    setFiles([]);
    setResults(null);
    setError(null);
    setEncryptedFiles({});
    setFilePasswords({});
    setPasswordDialog({ open: false, fileName: '', password: '' });
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
          <div className="mt-4">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FolderIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {t('Save to Project')}:
                    </span>
                  </div>

                  {/* Project Dropdown */}
                  <div className="relative mt-1" ref={projectDropdownRef}>
                    <button
                      onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                      disabled={loadingProjects}
                      className="w-full max-w-md flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-left hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                    >
                      {loadingProject ? (
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          {t('Loading...')}
                        </span>
                      ) : project ? (
                        <span className="font-medium text-gray-900 dark:text-gray-100">{project.project_name}</span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">{t('Select a project...')}</span>
                      )}
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showProjectDropdown && (
                      <div className="absolute z-50 mt-1 w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {/* Create New Project Option */}
                        <button
                          onClick={() => {
                            setShowCreateProject(true);
                            setShowProjectDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-200 dark:border-gray-700 flex items-center gap-2"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="font-medium">{t('Create New Project')}</span>
                        </button>

                        {/* No Project Option */}
                        <button
                          onClick={() => handleSelectProject(null)}
                          className="w-full px-4 py-2 text-left text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
                        >
                          {t('No project (standalone)')}
                        </button>

                        {loadingProjects ? (
                          <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                            <div className="w-5 h-5 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                            {t('Loading projects...')}
                          </div>
                        ) : projectsList.length === 0 ? (
                          <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                            {t('No projects found')}
                          </div>
                        ) : (
                          projectsList.map((p) => (
                            <button
                              key={p.uuid}
                              onClick={() => handleSelectProject(p)}
                              className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                p.uuid === projectUuid
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <FolderIcon className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{p.project_name}</span>
                                {p.is_protected && (
                                  <LockClosedIcon className="h-3.5 w-3.5 text-amber-500" title={t('Password protected')} />
                                )}
                              </div>
                              {p.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 truncate">
                                  {p.description}
                                </p>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {project && (
                <button
                  onClick={() => navigate(`/projects/${projectUuid}`)}
                  className="ml-4 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  {t('View Project')}
                </button>
              )}
            </div>
          </div>
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
                </div>
              </div>

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
                    {t('Drag and drop')} {fileMode === 'excel' ? 'Excel' : 'PDF'} {t('files here, or')}
                  </p>
                  <label className="inline-block">
                    <input
                      type="file"
                      multiple
                      accept={acceptString}
                      onChange={handleFileInput}
                      className="hidden"
                      disabled={processing}
                    />
                    <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer inline-block transition-colors">
                      {t('Browse Files')}
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    {t('Supported formats')}: {fileMode === 'excel' ? '.xlsx, .xls' : '.pdf'}
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

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('Selected Files')} ({files.length})
                    {checkingPdf && <span className="ml-2 text-xs text-blue-600">{t('Checking encryption...')}</span>}
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {files.map((file, index) => {
                      const isEncrypted = encryptedFiles[file.name];
                      const hasPassword = !!filePasswords[file.name];

                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isEncrypted && !hasPassword
                              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isEncrypted ? (
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
                                {isEncrypted && (
                                  <span className={`ml-2 ${hasPassword ? 'text-green-600' : 'text-amber-600'}`}>
                                    {hasPassword ? `• ${t('Password set')}` : `• ${t('Encrypted - needs password')}`}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {isEncrypted && (
                              <button
                                onClick={() => openPasswordDialog(file.name)}
                                disabled={processing}
                                className="p-1 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors disabled:opacity-50"
                                title={hasPassword ? 'Change password' : 'Enter password'}
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
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">{t('Processing bank statements...')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    {fileMode === 'pdf' ? t('Running OCR and extracting data...') : t('Auto-detecting banks and extracting data')}
                  </p>
                </div>
              )}

              {/* Results Display */}
              {results && !processing && (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">{t('Transactions')}</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {results.summary?.total_transactions || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300 mb-1">{t('Accounts')}</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {results.summary?.unique_accounts || 0}
                      </p>
                    </div>
                  </div>

                  {/* Banks Detected */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
                      {t('Banks Detected')} ({results.summary?.banks_detected?.length || 0})
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
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        {t('Files are stored for 30 days. Download them before they expire.')}
                      </p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
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
                      </div>
                    </div>
                  )}
                  {loadingUploadedFiles && (
                    <div className="mt-4 text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('Loading uploaded files...')}</p>
                    </div>
                  )}


                  {/* File Info */}
                  {results.session_id && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
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
              <span>{t('Upload one or more bank statement files')} ({fileMode === 'excel' ? t('Excel format') : t('PDF format - will be processed with OCR')})</span>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                {t('Project Parse History')}
                <span className="text-sm font-normal text-gray-500">
                  ({projectBankStatements.length})
                </span>
              </h3>
            </div>

            {/* Loading state for project history */}
            {loadingProjectHistory && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-2"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('Loading history...')}</p>
              </div>
            )}

            {/* Project Bank Statements - Grouped by Session */}
            {projectUuid && !loadingProjectHistory && projectBankStatements.length > 0 && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {projectBankStatements.map((session, sessionIdx) => {
                  // API returns: session_id, processed_at, file_count, total_transactions, banks[], files[]
                  const hasPdf = session.files?.some(f => f.file_name?.toLowerCase().endsWith('.pdf'));
                  const isExpanded = expandedHistorySessions[session.session_id] ?? (sessionIdx === 0);

                  return (
                    <motion.div
                      key={session.session_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: sessionIdx * 0.05 }}
                      className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                      {/* Decorative accent line */}
                      <div className={`absolute top-0 left-0 w-1 h-full ${hasPdf ? 'bg-gradient-to-b from-orange-500 to-red-500' : 'bg-gradient-to-b from-emerald-500 to-emerald-600'}`} />

                      {/* Main content */}
                      <div className="pl-4 pr-4 py-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1 min-w-0">
                            {/* Type and Banks badges */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${
                                hasPdf
                                  ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800'
                                  : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800'
                              }`}>
                                {hasPdf ? (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {hasPdf ? 'PDF' : 'Excel'}
                              </span>
                              {session.banks?.map(bank => (
                                <span key={bank} className="inline-flex items-center px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium ring-1 ring-blue-100 dark:ring-blue-800">
                                  {bank}
                                </span>
                              ))}
                            </div>

                            {/* Date and time */}
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{formatDate(session.processed_at)}</span>
                            </div>
                          </div>

                          {/* Download button */}
                          <button
                            onClick={() => handleDownloadFromHistory(session.session_id)}
                            disabled={downloadingSessionId === session.session_id}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-400 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:cursor-not-allowed"
                            title={t('Download Excel')}
                          >
                            {downloadingSessionId === session.session_id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>{t('Downloading...')}</span>
                              </>
                            ) : (
                              <>
                                <ArrowDownTrayIcon className="h-4 w-4" />
                                <span>{t('Download')}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-3 p-3 bg-gray-100/50 dark:bg-gray-900/50 rounded-lg">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                              <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{session.file_count || 0}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('files')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-100/50 dark:bg-gray-900/50 rounded-lg">
                            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{session.total_transactions || 0}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('transactions')}</p>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible files section */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                          <button
                            onClick={() => setExpandedHistorySessions(prev => ({
                              ...prev,
                              [session.session_id]: !isExpanded
                            }))}
                            className="flex items-center justify-between w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                          >
                            <span className="font-medium">{t('Files')} ({session.files?.length || 0})</span>
                            <svg
                              className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Files list - animated */}
                          <motion.div
                            initial={false}
                            animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2 mt-3">
                              {session.files?.map((file, idx) => (
                                <div
                                  key={file.uuid || idx}
                                  className="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
                                >
                                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                                    file.file_name?.toLowerCase().endsWith('.pdf')
                                      ? 'bg-orange-100 dark:bg-orange-900/30'
                                      : 'bg-emerald-100 dark:bg-emerald-900/30'
                                  }`}>
                                    <DocumentTextIcon className={`h-4 w-4 ${
                                      file.file_name?.toLowerCase().endsWith('.pdf')
                                        ? 'text-orange-600 dark:text-orange-400'
                                        : 'text-emerald-600 dark:text-emerald-400'
                                    }`} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate font-medium">
                                      {file.file_name || '-'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-gray-500 dark:text-gray-500">{file.bank_name}</span>
                                      <span className="text-gray-300 dark:text-gray-600">•</span>
                                      <span className="text-xs text-gray-500 dark:text-gray-500">{file.transaction_count || 0} {t('txns')}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
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
          </motion.div>
        )}
      </div>

      {/* Password Dialog Modal */}
      {passwordDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#222] rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <LockClosedIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('Password Required')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('This PDF file is password-protected')}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 truncate">
                {t('File')}: <span className="font-medium">{passwordDialog.fileName}</span>
              </p>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordDialog.password}
                  onChange={(e) => {
                    setPasswordDialog(prev => ({ ...prev, password: e.target.value }));
                    setPasswordError(''); // Clear error when typing
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !verifyingPassword && handlePasswordSubmit()}
                  placeholder={t('Enter PDF password')}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    passwordError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  autoFocus
                  disabled={verifyingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  disabled={verifyingPassword}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-4 w-4" />
                  {passwordError}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePasswordCancel}
                disabled={verifyingPassword}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handlePasswordSubmit}
                disabled={!passwordDialog.password || verifyingPassword}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifyingPassword ? (
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

      {/* Create Project Dialog Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#222] rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <FolderIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('Create New Project')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('Create a project to organize your parsed files')}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('Project Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !creatingProject && handleCreateProject()}
                  placeholder={t('Enter project name')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  disabled={creatingProject}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('Description')} ({t('optional')})
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder={t('Enter project description')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={creatingProject}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('Password')} ({t('optional')})
                </label>
                <div className="relative">
                  <input
                    type={showNewProjectPassword ? 'text' : 'password'}
                    value={newProjectPassword}
                    onChange={(e) => setNewProjectPassword(e.target.value)}
                    placeholder={t('Set password to protect project')}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={creatingProject}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewProjectPassword(!showNewProjectPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showNewProjectPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('Leave empty for no password protection')}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateProject(false);
                  setNewProjectName('');
                  setNewProjectDescription('');
                  setNewProjectPassword('');
                  setShowNewProjectPassword(false);
                }}
                disabled={creatingProject}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || creatingProject}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creatingProject ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('Creating...')}
                  </>
                ) : (
                  t('Create Project')
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Project Password Dialog Modal */}
      {projectPasswordDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#222] rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <LockClosedIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('Project Password Required')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('This project is password protected')}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 truncate">
                {t('Project')}: <span className="font-medium">{projectPasswordDialog.project?.project_name}</span>
              </p>
              <div className="relative">
                <input
                  type={showProjectPassword ? 'text' : 'password'}
                  value={projectPasswordDialog.password}
                  onChange={(e) => {
                    setProjectPasswordDialog(prev => ({ ...prev, password: e.target.value }));
                    setProjectPasswordError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !verifyingProjectPassword && handleProjectPasswordSubmit()}
                  placeholder={t('Enter project password')}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    projectPasswordError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  autoFocus
                  disabled={verifyingProjectPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowProjectPassword(!showProjectPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showProjectPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {projectPasswordError && (
                <p className="mt-1 text-sm text-red-500">{projectPasswordError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleProjectPasswordCancel}
                disabled={verifyingProjectPassword}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleProjectPasswordSubmit}
                disabled={!projectPasswordDialog.password || verifyingProjectPassword}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifyingProjectPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('Verifying...')}
                  </>
                ) : (
                  t('Unlock')
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BankStatementParser;
