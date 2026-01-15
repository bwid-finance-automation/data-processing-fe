import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  FolderIcon,
  ChevronDownIcon,
  LockClosedIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import Breadcrumb from '@components/common/Breadcrumb';
import { fpaApiClient, FPA_API_BASE_URL } from '@configs/APIs';
import { getProject, getProjects, createProject, verifyProjectPassword } from '../services/project/project-apis';

function GLAVarianceAnalysis() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectUuid = searchParams.get('project');

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

  // Project password dialog
  const [projectPasswordDialog, setProjectPasswordDialog] = useState({
    open: false,
    project: null,
    password: '',
  });
  const [projectPasswordError, setProjectPasswordError] = useState('');
  const [verifyingProjectPassword, setVerifyingProjectPassword] = useState(false);
  const [showProjectPassword, setShowProjectPassword] = useState(false);

  useEffect(() => {
    document.title = `GLA Variance Analysis - BW Industrial`;
  }, []);

  const fileInputRef = useRef(null);

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
        setError(t('Failed to load project'));
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
    setResult(null);
    setFile(null);
    setError(null);

    if (selectedProject) {
      if (selectedProject.is_protected) {
        const verifiedProjects = JSON.parse(sessionStorage.getItem('verifiedProjects') || '{}');
        if (verifiedProjects[selectedProject.uuid]) {
          navigate(`/gla-variance-analysis?project=${selectedProject.uuid}`);
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
        navigate(`/gla-variance-analysis?project=${selectedProject.uuid}`);
        setShowProjectDropdown(false);
      }
    } else {
      navigate('/gla-variance-analysis');
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

        navigate(`/gla-variance-analysis?project=${projectPasswordDialog.project.uuid}`);
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
      navigate(`/gla-variance-analysis?project=${newProject.uuid}`);
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

  const breadcrumbItems = [
    { label: t("home") || "Home", href: "/" },
    { label: t("departments") || "Departments", href: "/department" },
    { label: t("fpaRDept"), href: "/project/1" },
    { label: "GLA Variance Analysis" },
  ];

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        toast.error(t('Invalid file format'), {
          description: t('Only .xlsx and .xls files are allowed'),
        });
        event.target.value = '';
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file before analyzing');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    // Add project_uuid if provided (for project integration)
    if (projectUuid) {
      formData.append('project_uuid', projectUuid);
    }

    // AI analysis is always enabled
    const url = `/gla-variance/analyze`;

    try {
      const response = await fpaApiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (filename) => {
    window.open(`${FPA_API_BASE_URL}/gla-variance/download/${filename}`, '_blank');
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatNumber = (num) => {
    if (num === 0) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#181818] dark:to-[#0d0d0d] py-8 px-4">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/project/1")}
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 mb-6 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-[#222] dark:hover:text-[#f5efe6] bg-white dark:bg-[#222] rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm"
        >
          <span className="text-lg font-bold">&#8592;</span>
          <span className="font-medium">{t("backButton")}</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-500 dark:to-teal-600 rounded-xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">
                GLA Variance Analysis
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
                Compare Gross Leasable Area between periods to track Handover and Committed GLA changes
              </p>
            </div>
          </div>

          {/* Project Selector */}
          <div className="mt-4">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <FolderIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('Project')}:
                </span>
                <div className="relative" ref={projectDropdownRef}>
                  <button
                    onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                    disabled={loadingProject}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#222] border border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors min-w-[200px]"
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
                          className="w-full px-4 py-2 text-left text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border-b border-gray-200 dark:border-gray-700 flex items-center gap-2"
                        >
                          <PlusIcon className="h-4 w-4" />
                          <span className="font-medium">{t('Create New Project')}</span>
                        </button>

                        {/* Standalone option */}
                        <button
                          onClick={() => handleSelectProject(null)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                            !project ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                          }`}
                        >
                          <span className="text-gray-600 dark:text-gray-400">{t('Standalone Mode')}</span>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{t('Process without saving to project')}</p>
                        </button>
                        <div className="border-t border-gray-200 dark:border-gray-700" />

                        {loadingProjects ? (
                          <div className="px-4 py-3 text-center text-gray-500">
                            <div className="inline-block w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-2" />
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
                                project?.uuid === p.uuid ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
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
                <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded">
                  {t('Results will be saved to project')}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* File Upload Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-white dark:bg-[#222] rounded-2xl shadow-xl border-2 border-emerald-200 dark:border-emerald-800 overflow-hidden">
            {/* Header Badge */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Upload GLA Data File</h3>
                  <p className="text-white/70 text-sm">Excel file with 4 sheets (2 previous + 2 current periods)</p>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div className="p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="gla-file"
              />
              <label
                htmlFor="gla-file"
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                  file
                    ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    file ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
                  }`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {file ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      )}
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {file ? file.name : 'Click to choose file'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {file ? `${(file.size / 1024).toFixed(2)} KB` : 'Excel (.xlsx, .xls)'}
                    </p>
                  </div>
                </div>
              </label>

              {/* Sheet Requirements Info */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">Required Sheet Names (exact match):</p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-4 font-mono">
                  <li>• Handover GLA - Previous</li>
                  <li>• Handover GLA - Current</li>
                  <li>• Committed GLA - Previous</li>
                  <li>• Committed GLA - Current</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Analysis Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg border border-purple-200 dark:border-purple-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">AI-Powered Analysis Enabled</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  AI will analyze variances and generate a downloadable PDF report with insights
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Analyze Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <motion.button
            onClick={handleAnalyze}
            disabled={loading || !file}
            whileHover={{ scale: loading || !file ? 1 : 1.02 }}
            whileTap={{ scale: loading || !file ? 1 : 0.98 }}
            className="w-full text-white text-lg font-bold py-5 px-6 rounded-xl shadow-2xl disabled:from-gray-300 dark:disabled:from-gray-600 disabled:via-gray-400 dark:disabled:via-gray-700 disabled:to-gray-400 dark:disabled:to-gray-700 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 relative overflow-hidden group bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-700 hover:via-indigo-700 hover:to-cyan-700"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>AI Analyzing GLA Data...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>Analyze with AI & Generate PDF</span>
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
          </motion.button>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6"
            >
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 rounded-xl p-5 shadow-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">Error</h4>
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-white dark:bg-[#222] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Results Header */}
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">GLA Variance Results</h2>
                        <p className="text-white/80 text-sm">{result.previous_period} vs {result.current_period}</p>
                      </div>
                    </div>
                    <motion.button
                      onClick={handleReset}
                      whileHover={{ scale: 1.05, rotate: 180 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      New Analysis
                    </motion.button>
                  </div>
                </div>

                <div className="p-8">
                  {/* Statistics Grid - Committed */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Committed GLA</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-200 dark:border-green-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-sm font-bold text-green-700 dark:text-green-400">Increased</span>
                      </div>
                      <div className="text-3xl font-extrabold text-green-900 dark:text-green-300">
                        {result.statistics.committed.increased}
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">projects</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-5 border border-red-200 dark:border-red-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                        <span className="text-sm font-bold text-red-700 dark:text-red-400">Decreased</span>
                      </div>
                      <div className="text-3xl font-extrabold text-red-900 dark:text-red-300">
                        {result.statistics.committed.decreased}
                      </div>
                      <p className="text-xs text-red-600 dark:text-red-500 mt-1">projects</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-400">Unchanged</span>
                      </div>
                      <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-300">
                        {result.statistics.committed.unchanged}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">projects</p>
                    </motion.div>
                  </div>

                  {/* Statistics Grid - Handover */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Handover GLA</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-200 dark:border-green-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-sm font-bold text-green-700 dark:text-green-400">Increased</span>
                      </div>
                      <div className="text-3xl font-extrabold text-green-900 dark:text-green-300">
                        {result.statistics.handover.increased}
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">projects</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-5 border border-red-200 dark:border-red-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                        <span className="text-sm font-bold text-red-700 dark:text-red-400">Decreased</span>
                      </div>
                      <div className="text-3xl font-extrabold text-red-900 dark:text-red-300">
                        {result.statistics.handover.decreased}
                      </div>
                      <p className="text-xs text-red-600 dark:text-red-500 mt-1">projects</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-400">Unchanged</span>
                      </div>
                      <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-300">
                        {result.statistics.handover.unchanged}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">projects</p>
                    </motion.div>
                  </div>

                  {/* Total Variance Summary */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Total Portfolio Variance</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Committed Variance</p>
                        <p className={`text-xl font-bold ${result.statistics.committed.total_variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {result.statistics.committed.total_variance >= 0 ? '+' : ''}{formatNumber(result.statistics.committed.total_variance)} sqm
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Handover Variance</p>
                        <p className={`text-xl font-bold ${result.statistics.handover.total_variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {result.statistics.handover.total_variance >= 0 ? '+' : ''}{formatNumber(result.statistics.handover.total_variance)} sqm
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">RBF Committed</p>
                        <p className={`text-xl font-bold ${result.statistics.by_type.rbf.committed_variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {result.statistics.by_type.rbf.committed_variance >= 0 ? '+' : ''}{formatNumber(result.statistics.by_type.rbf.committed_variance)} sqm
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">RBW Committed</p>
                        <p className={`text-xl font-bold ${result.statistics.by_type.rbw.committed_variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {result.statistics.by_type.rbw.committed_variance >= 0 ? '+' : ''}{formatNumber(result.statistics.by_type.rbw.committed_variance)} sqm
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Download Buttons */}
                  <div className="space-y-3">
                    {/* Excel Download */}
                    <motion.button
                      onClick={() => handleDownload(result.output_file)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full group relative overflow-hidden flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-base font-bold py-4 px-6 rounded-xl shadow-xl transition-all duration-300"
                    >
                      <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download Excel Report</span>
                    </motion.button>

                    {/* PDF Download (if AI analysis was used) */}
                    {result.pdf_file && (
                      <motion.button
                        onClick={() => handleDownload(result.pdf_file)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full group relative overflow-hidden flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-base font-bold py-4 px-6 rounded-xl shadow-xl transition-all duration-300"
                      >
                        <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>Download AI Analysis PDF</span>
                      </motion.button>
                    )}
                  </div>

                  {/* AI Status Info */}
                  {result.ai_analysis && (
                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-sm text-purple-700 dark:text-purple-300">
                          {result.ai_analysis.status === 'success'
                            ? `AI Analysis completed using ${result.ai_analysis.model || 'AI'}`
                            : `AI Analysis: ${result.ai_analysis.error || 'Error occurred'}`
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {/* File Info */}
                  <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">File Information</h3>
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Uploaded File</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{result.filename}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 py-6 text-center text-gray-600 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-700"
        >
          <p>GLA Variance Analysis Tool - BW Industrial Development</p>
        </motion.footer>
      </div>

      {/* Create Project Dialog Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#222] rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <PlusIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
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
                  onKeyDown={(e) => e.key === 'Enter' && !creatingProject && handleCreateProject()}
                  placeholder={t('Enter project name')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
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
                    placeholder={t('Set password protection')}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={creatingProject}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewProjectPassword(!showNewProjectPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showNewProjectPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowCreateProject(false);
                  setNewProjectName('');
                  setNewProjectDescription('');
                  setNewProjectPassword('');
                  setShowNewProjectPassword(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                disabled={creatingProject}
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || creatingProject}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  {t('Protected Project')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {projectPasswordDialog.project?.project_name}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('This project is password protected. Please enter the password to continue.')}
            </p>

            <div className="relative">
              <input
                type={showProjectPassword ? 'text' : 'password'}
                value={projectPasswordDialog.password}
                onChange={(e) => setProjectPasswordDialog(prev => ({ ...prev, password: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && !verifyingProjectPassword && handleVerifyProjectPassword()}
                placeholder={t('Enter password')}
                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{projectPasswordError}</p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setProjectPasswordDialog({ open: false, project: null, password: '' });
                  setProjectPasswordError('');
                  setShowProjectPassword(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                disabled={verifyingProjectPassword}
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleVerifyProjectPassword}
                disabled={!projectPasswordDialog.password.trim() || verifyingProjectPassword}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
}

export default GLAVarianceAnalysis;
