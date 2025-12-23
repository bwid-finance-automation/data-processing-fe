import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  FolderIcon,
  ChevronDownIcon,
  LockClosedIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import {
  createSession,
  uploadInputFile,
  uploadMasterDataFile,
  listInputFiles,
  listMasterDataFiles,
  listOutputFiles,
  deleteFile,
  downloadFile,
  processBilling,
  getSystemStatus,
  getMasterDataStatus,
} from '@services/billingApi';
import { getProject, getProjects, createProject, verifyProjectPassword } from '../services/project/project-apis';

export default function UtilityBilling() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const projectUuid = searchParams.get('project');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // File lists
  const [inputFiles, setInputFiles] = useState([]);
  const [masterDataFiles, setMasterDataFiles] = useState([]);
  const [outputFiles, setOutputFiles] = useState([]);

  // Upload progress
  const [uploadProgress, setUploadProgress] = useState(0);

  // Status
  const [systemStatus, setSystemStatus] = useState(null);
  const [masterDataStatus, setMasterDataStatus] = useState(null);

  // Processing results
  const [processingResult, setProcessingResult] = useState(null);

  // Project context
  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [projectsList, setProjectsList] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const projectDropdownRef = useRef(null);

  // Create project dialog
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectPassword, setNewProjectPassword] = useState('');
  const [showNewProjectPassword, setShowNewProjectPassword] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState(null);

  // Project password dialog
  const [projectPasswordDialog, setProjectPasswordDialog] = useState({
    open: false,
    project: null,
    password: '',
  });
  const [projectPasswordError, setProjectPasswordError] = useState('');
  const [verifyingProjectPassword, setVerifyingProjectPassword] = useState(false);
  const [showProjectPassword, setShowProjectPassword] = useState(false);

  // Initialize session
  useEffect(() => {
    initializeSession();
  }, []);

  // Update document title
  useEffect(() => {
    document.title = `${t('utilityBillingTitle')} - BW Industrial`;
  }, [t]);

  const initializeSession = async () => {
    try {
      setLoading(true);
      // Pass projectUuid if provided (for project integration)
      const response = await createSession(projectUuid);
      setSessionId(response.session_id);
      toast.success(t('sessionCreated'));
    } catch (error) {
      toast.error(t('sessionFailed'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Load file lists
  const loadFiles = async () => {
    if (!sessionId) return;

    try {
      const [input, masterData, output] = await Promise.all([
        listInputFiles(sessionId),
        listMasterDataFiles(sessionId),
        listOutputFiles(sessionId),
      ]);

      setInputFiles(input);
      setMasterDataFiles(masterData);
      setOutputFiles(output);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  // Load status
  const loadStatus = async () => {
    if (!sessionId) return;

    try {
      const [system, masterData] = await Promise.all([
        getSystemStatus(sessionId),
        getMasterDataStatus(sessionId),
      ]);

      setSystemStatus(system);
      setMasterDataStatus(masterData);
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  // Reload data
  useEffect(() => {
    if (sessionId) {
      loadFiles();
      loadStatus();
    }
  }, [sessionId]);

  // Fetch project info if projectUuid is provided
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectUuid) {
        setProject(null);
        setLoadingProject(false);
        return;
      }

      setLoadingProject(true);
      try {
        const projectData = await getProject(projectUuid);
        if (projectData.is_protected) {
          const verifiedProjects = JSON.parse(sessionStorage.getItem('verifiedProjects') || '{}');
          if (verifiedProjects[projectUuid]) {
            setProject(projectData);
          } else {
            setProjectPasswordDialog({
              open: true,
              project: projectData,
              password: '',
            });
          }
        } else {
          setProject(projectData);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setProjectError(t('Failed to load project'));
      } finally {
        setLoadingProject(false);
      }
    };
    fetchProject();
  }, [projectUuid, t]);

  // Fetch projects list when dropdown opens
  useEffect(() => {
    const fetchProjects = async () => {
      if (showProjectDropdown && projectsList.length === 0) {
        setLoadingProjects(true);
        try {
          const data = await getProjects(0, 50);
          setProjectsList(data.projects || []);
        } catch (err) {
          console.error('Error fetching projects:', err);
        } finally {
          setLoadingProjects(false);
        }
      }
    };
    fetchProjects();
  }, [showProjectDropdown, projectsList.length]);

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

  // Handle project selection
  const handleSelectProject = (selectedProject) => {
    if (selectedProject) {
      if (selectedProject.is_protected) {
        const verifiedProjects = JSON.parse(sessionStorage.getItem('verifiedProjects') || '{}');
        if (verifiedProjects[selectedProject.uuid]) {
          navigate(`/utility-billing?project=${selectedProject.uuid}`);
          setShowProjectDropdown(false);
        } else {
          setProjectPasswordDialog({
            open: true,
            project: selectedProject,
            password: '',
          });
          setProjectPasswordError('');
          setShowProjectPassword(false);
          setShowProjectDropdown(false);
        }
      } else {
        navigate(`/utility-billing?project=${selectedProject.uuid}`);
        setShowProjectDropdown(false);
      }
    } else {
      navigate('/utility-billing');
      setProject(null);
      setShowProjectDropdown(false);
    }
  };

  // Handle project password verification
  const handleVerifyProjectPassword = async () => {
    if (!projectPasswordDialog.password.trim()) {
      setProjectPasswordError(t('Password is required'));
      return;
    }

    setVerifyingProjectPassword(true);
    try {
      const result = await verifyProjectPassword(
        projectPasswordDialog.project.uuid,
        projectPasswordDialog.password
      );
      if (result.verified) {
        const verifiedProjects = JSON.parse(sessionStorage.getItem('verifiedProjects') || '{}');
        verifiedProjects[projectPasswordDialog.project.uuid] = true;
        sessionStorage.setItem('verifiedProjects', JSON.stringify(verifiedProjects));

        navigate(`/utility-billing?project=${projectPasswordDialog.project.uuid}`);
        setProjectPasswordDialog({ open: false, project: null, password: '' });
      } else {
        setProjectPasswordError(t('Invalid password'));
      }
    } catch (err) {
      setProjectPasswordError(err.response?.data?.detail || t('Failed to verify password'));
    } finally {
      setVerifyingProjectPassword(false);
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
      setProjectsList(prev => [newProject, ...prev]);
      navigate(`/utility-billing?project=${newProject.uuid}`);
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectPassword('');
      setShowNewProjectPassword(false);
      setShowCreateProject(false);
      setShowProjectDropdown(false);
    } catch (err) {
      console.error('Error creating project:', err);
      setProjectError(t('Failed to create project. Please try again.'));
    } finally {
      setCreatingProject(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file, type) => {
    if (!sessionId) {
      toast.error(t('noActiveSession'));
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);

      const uploadFunction = type === 'input' ? uploadInputFile : uploadMasterDataFile;

      await uploadFunction(sessionId, file, (progress) => {
        setUploadProgress(progress);
      });

      toast.success(file.name + ' ' + t('fileUploaded'));
      await loadFiles();
      await loadStatus();
    } catch (error) {
      toast.error(error.message || t('uploadFailed'));
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Handle file delete
  const handleFileDelete = async (fileType, filename) => {
    if (!sessionId) return;

    try {
      await deleteFile(sessionId, fileType, filename);
      toast.success(t('fileDeleted'));
      await loadFiles();
      await loadStatus();
    } catch (error) {
      toast.error(t('deleteFailed'));
    }
  };

  // Handle file download
  const handleFileDownload = async (fileType, filename) => {
    if (!sessionId) return;

    try {
      await downloadFile(sessionId, fileType, filename);
      toast.success(t('fileDownloaded'));
    } catch (error) {
      toast.error(t('downloadFailed'));
    }
  };

  // Handle process billing
  const handleProcessBilling = async () => {
    if (!sessionId) {
      toast.error(t('noActiveSession'));
      return;
    }

    try {
      setProcessing(true);
      toast.info(t('processingData'));

      const result = await processBilling(sessionId);

      if (result.success) {
        setProcessingResult(result);
        toast.success(t('processingSuccess'));
        await loadFiles();
        await loadStatus();
      } else {
        toast.error(result.message || t('processingFailed'));
        setProcessingResult(result);
      }
    } catch (error) {
      toast.error(error.message || t('processingFailed'));
    } finally {
      setProcessing(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // File upload component
  const FileUploadZone = ({ title, type, acceptedFiles = '.xlsx,.xls', requiredFiles = [] }) => (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
      <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        Select multiple files or choose an entire folder ({acceptedFiles})
      </p>
      {requiredFiles.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-left bg-gray-50 dark:bg-gray-800 p-2 rounded">
          <p className="font-semibold mb-1">Required files (you can select all at once):</p>
          <ul className="list-disc list-inside space-y-0.5">
            {requiredFiles.map((file, idx) => (
              <li key={idx}>{file}</li>
            ))}
          </ul>
        </div>
      )}
      <input
        type="file"
        accept={acceptedFiles}
        multiple={true}
        onChange={(e) => {
          const files = Array.from(e.target.files);
          if (files.length > 0) {
            // Upload files sequentially
            files.forEach(file => handleFileUpload(file, type));
          }
          e.target.value = null;
        }}
        className="hidden"
        id={'upload-' + type}
        disabled={loading}
      />
      <input
        type="file"
        accept={acceptedFiles}
        webkitdirectory=""
        directory=""
        onChange={(e) => {
          const files = Array.from(e.target.files);
          if (files.length > 0) {
            // Filter only Excel files and upload sequentially
            const excelFiles = files.filter(f =>
              f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
            );
            excelFiles.forEach(file => handleFileUpload(file, type));
          }
          e.target.value = null;
        }}
        className="hidden"
        id={'upload-folder-' + type}
        disabled={loading}
      />
      <div className="flex gap-2 justify-center">
        <label
          htmlFor={'upload-' + type}
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('uploading') : t('chooseFile')}
        </label>
        <label
          htmlFor={'upload-folder-' + type}
          className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('uploading') : 'Choose Folder'}
        </label>
      </div>
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: uploadProgress + '%' }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
        </div>
      )}
    </div>
  );

  // File list component
  const FileList = ({ title, files, fileType }) => (
    <div className="bg-white dark:bg-[#222] rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{title}</h3>
      {files.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noFilesUploaded')}</p>
      ) : (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#181818] rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                <DocumentIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{file.filename}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)} • {formatDate(file.uploaded_at)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {(fileType === 'output' || fileType === 'validation') && (
                  <button
                    onClick={() => handleFileDownload(fileType, file.filename)}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                    title={t('download')}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  </button>
                )}
                {(fileType === 'input' || fileType === 'master-data') && (
                  <button
                    onClick={() => handleFileDelete(fileType, file.filename)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title={t('delete')}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading && !sessionId) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#181818] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('initializingSession')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#181818] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/project/2')}
          className="flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-400 hover:text-[#222] dark:hover:text-[#f5efe6] transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>{t('backToProjects')}</span>
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#222] dark:text-[#f5efe6] mb-2">
            {t('utilityBillingTitle')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('utilityBillingSubtitle')}
          </p>

          {/* Project Selector */}
          <div className="mt-4">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
              <div className="flex items-center gap-3">
                <FolderIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('Project')}:
                </span>
                <div className="relative" ref={projectDropdownRef}>
                  <button
                    onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                    disabled={loadingProject}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#222] border border-gray-300 dark:border-gray-600 rounded-lg hover:border-cyan-400 dark:hover:border-cyan-500 transition-colors min-w-[200px]"
                  >
                    {loadingProject ? (
                      <span className="text-gray-400">{t('Loading...')}</span>
                    ) : project ? (
                      <>
                        <span className="text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
                          {project.project_name}
                        </span>
                        {project.is_protected && (
                          <LockClosedIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        )}
                      </>
                    ) : (
                      <span className="text-gray-500">{t('Standalone Mode')}</span>
                    )}
                    <ChevronDownIcon className="h-4 w-4 text-gray-400 ml-auto" />
                  </button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {showProjectDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-[#222] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-auto"
                      >
                        {/* Create New Project Option */}
                        <button
                          onClick={() => {
                            setShowCreateProject(true);
                            setShowProjectDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors border-b border-gray-200 dark:border-gray-700 flex items-center gap-2"
                        >
                          <PlusIcon className="h-4 w-4" />
                          <span className="font-medium">{t('Create New Project')}</span>
                        </button>

                        {/* Standalone option */}
                        <button
                          onClick={() => handleSelectProject(null)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                            !project ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''
                          }`}
                        >
                          <span className="text-gray-600 dark:text-gray-400">{t('Standalone Mode')}</span>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{t('Process without saving to project')}</p>
                        </button>
                        <div className="border-t border-gray-200 dark:border-gray-700" />

                        {loadingProjects ? (
                          <div className="px-4 py-3 text-center text-gray-500">
                            <div className="inline-block w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mr-2" />
                            {t('Loading...')}
                          </div>
                        ) : projectsList.length === 0 ? (
                          <div className="px-4 py-3 text-center text-gray-500">
                            {t('No projects found')}
                          </div>
                        ) : (
                          projectsList.map((p) => (
                            <button
                              key={p.uuid}
                              onClick={() => handleSelectProject(p)}
                              className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                project?.uuid === p.uuid ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900 dark:text-gray-100 truncate">
                                  {p.project_name}
                                </span>
                                {p.is_protected && (
                                  <LockClosedIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                )}
                              </div>
                              {p.description && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                  {p.description}
                                </p>
                              )}
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {project && (
                <span className="text-xs px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded">
                  {t('Results will be saved to project')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Cards */}
        {systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">{t('inputFiles')}</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{systemStatus.input_files_count}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-600 dark:text-green-400">{t('masterDataFiles')}</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{systemStatus.master_data_files_count}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm text-purple-600 dark:text-purple-400">{t('outputFiles')}</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{systemStatus.output_files_count}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('systemStatus')}</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 capitalize">{systemStatus.status}</p>
            </div>
          </div>
        )}

        {/* Upload Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FileUploadZone title={t('uploadCSInput')} type="input" />
          <FileUploadZone
            title={t('uploadMasterData')}
            type="master-data"
            requiredFiles={[
              'Customers_Master.xlsx',
              'UnitForLease_Master.xlsx',
              'Config_Mapping.xlsx'
            ]}
          />
        </div>

        {/* Master Data Status */}
        {masterDataStatus && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">{t('masterDataStatus')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-yellow-600 dark:text-yellow-400">{t('customers')}: </span>
                <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                  {masterDataStatus.customers_count || t('notUploaded')}
                </span>
              </div>
              <div>
                <span className="text-yellow-600 dark:text-yellow-400">{t('units')}: </span>
                <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                  {masterDataStatus.units_count || t('notUploaded')}
                </span>
              </div>
              <div>
                <span className="text-yellow-600 dark:text-yellow-400">{t('config')}: </span>
                <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                  {masterDataStatus.subsidiary_config_exists ? '✓' : '✗'}
                </span>
              </div>
              <div>
                <span className="text-yellow-600 dark:text-yellow-400">{t('lastUpdated')}: </span>
                <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                  {masterDataStatus.last_updated ? new Date(masterDataStatus.last_updated).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Process Button */}
        <div className="mb-8">
          <button
            onClick={handleProcessBilling}
            disabled={processing || !sessionId || inputFiles.length === 0 || masterDataFiles.length === 0}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? t('processingBilling') : t('processBilling')}
          </button>
          {inputFiles.length === 0 && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{t('uploadAtLeastOneInput')}</p>
          )}
          {masterDataFiles.length === 0 && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{t('uploadMasterDataFiles')}</p>
          )}
        </div>

        {/* Processing Result */}
        {processingResult && (
          <div className={'border rounded-lg p-6 mb-8 ' + (
            processingResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          )}>
            <h3 className={'text-lg font-semibold mb-3 ' + (
              processingResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
            )}>
              {processingResult.success ? t('processingComplete') : t('processingFailed')}
            </h3>
            <p className={'mb-4 ' + (
              processingResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
            )}>
              {processingResult.message}
            </p>
            {processingResult.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">{t('inputRecords')}</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{processingResult.stats.total_input_records}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">{t('invoicesGenerated')}</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{processingResult.stats.total_invoices}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">{t('lineItems')}</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{processingResult.stats.total_line_items}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">{t('processingTime')}</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{processingResult.stats.processing_time_seconds.toFixed(2)}s</p>
                </div>
              </div>
            )}
            {processingResult.validation_issues && processingResult.validation_issues.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                  {processingResult.validation_issues.length} {t('validationIssues')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* File Lists */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FileList title={t('inputFiles')} files={inputFiles} fileType="input" />
          <FileList title={t('masterDataFiles')} files={masterDataFiles} fileType="master-data" />
          <FileList title={t('outputFiles')} files={outputFiles} fileType="output" />
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 py-6 text-center text-gray-600 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-700"
        >
          <p>{t('utilityBillingSystem')}</p>
        </motion.footer>
      </div>

      {/* Create Project Dialog */}
      <AnimatePresence>
        {showCreateProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowCreateProject(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#222] rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('Create New Project')}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Project Name')} *
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder={t('Enter project name')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#181818] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Description')}
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder={t('Optional description')}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#181818] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Password')} ({t('Optional')})
                  </label>
                  <div className="relative">
                    <input
                      type={showNewProjectPassword ? 'text' : 'password'}
                      value={newProjectPassword}
                      onChange={(e) => setNewProjectPassword(e.target.value)}
                      placeholder={t('Leave empty for no protection')}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#181818] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewProjectPassword(!showNewProjectPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewProjectPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {projectError && (
                  <p className="text-sm text-red-500">{projectError}</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateProject(false);
                    setNewProjectName('');
                    setNewProjectDescription('');
                    setNewProjectPassword('');
                    setProjectError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || creatingProject}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingProject ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('Creating...')}
                    </span>
                  ) : (
                    t('Create Project')
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Password Dialog */}
      <AnimatePresence>
        {projectPasswordDialog.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setProjectPasswordDialog({ open: false, project: null, password: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#222] rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <LockClosedIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {t('Protected Project')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {projectPasswordDialog.project?.project_name}
                  </p>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('This project is password protected. Please enter the password to continue.')}
              </p>

              <div className="relative mb-4">
                <input
                  type={showProjectPassword ? 'text' : 'password'}
                  value={projectPasswordDialog.password}
                  onChange={(e) => setProjectPasswordDialog(prev => ({ ...prev, password: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyProjectPassword()}
                  placeholder={t('Enter password')}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#181818] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowProjectPassword(!showProjectPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showProjectPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {projectPasswordError && (
                <p className="text-sm text-red-500 mb-4">{projectPasswordError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setProjectPasswordDialog({ open: false, project: null, password: '' });
                    setProjectPasswordError('');
                    setShowProjectPassword(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleVerifyProjectPassword}
                  disabled={!projectPasswordDialog.password.trim() || verifyingProjectPassword}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyingProjectPassword ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('Verifying...')}
                    </span>
                  ) : (
                    t('Unlock')
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
