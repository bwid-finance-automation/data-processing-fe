import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderIcon,
  ChevronDownIcon,
  LockClosedIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import AIAnalysis from "@components/variance/AIAnalysis";
import Account511Analysis from "@components/variance/Account511Analysis";
import Breadcrumb from "@components/common/Breadcrumb";
import { getProject, getProjects, createProject, verifyProjectPassword } from '../services/project/project-apis';

export default function VarianceAnalysis() {
  const [activeTab, setActiveTab] = useState('ai');
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
  const [error, setError] = useState(null);

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
    document.title = `${t('varianceAnalysisTitle')} - BW Industrial`;
  }, [t]);

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
    if (selectedProject) {
      if (selectedProject.is_protected) {
        const verifiedProjects = JSON.parse(sessionStorage.getItem('verifiedProjects') || '{}');
        if (verifiedProjects[selectedProject.uuid]) {
          navigate(`/variance-analysis?project=${selectedProject.uuid}`);
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
        navigate(`/variance-analysis?project=${selectedProject.uuid}`);
        setShowProjectDropdown(false);
      }
    } else {
      navigate('/variance-analysis');
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

        navigate(`/variance-analysis?project=${projectPasswordDialog.project.uuid}`);
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
      navigate(`/variance-analysis?project=${newProject.uuid}`);
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
    { label: t("financeAccountingDept"), href: "/project/2" },
    { label: t('varianceAnalysisTitle') },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#181818]">
      <div className="container mx-auto px-6 py-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/project/2")}
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 mb-6 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-[#222] dark:hover:text-[#f5efe6] bg-white dark:bg-[#222] rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
        >
          <span className="text-lg font-bold">←</span>
          <span className="font-medium">{t("backButton")}</span>
        </motion.button>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-[#222] dark:text-[#f5efe6] mb-2 gradient-text">
            {t('varianceAnalysisTitle')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t('varianceAnalysisSubtitle')}
          </p>

          {/* Project Selector */}
          <div className="mt-4">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-3">
                <FolderIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('Project')}:
                </span>
                <div className="relative" ref={projectDropdownRef}>
                  <button
                    onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                    disabled={loadingProject}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#222] border border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-400 dark:hover:border-orange-500 transition-colors min-w-[200px]"
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
                          className="w-full px-4 py-2 text-left text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors border-b border-gray-200 dark:border-gray-700 flex items-center gap-2"
                        >
                          <PlusIcon className="h-4 w-4" />
                          <span className="font-medium">{t('Create New Project')}</span>
                        </button>

                        {/* Standalone option */}
                        <button
                          onClick={() => handleSelectProject(null)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                            !project ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                          }`}
                        >
                          <span className="text-gray-600 dark:text-gray-400">{t('Standalone Mode')}</span>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{t('Process without saving to project')}</p>
                        </button>
                        <div className="border-t border-gray-200 dark:border-gray-700" />

                        {loadingProjects ? (
                          <div className="px-4 py-3 text-center text-gray-500">
                            <div className="inline-block w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-2" />
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
                                project?.uuid === p.uuid ? 'bg-orange-50 dark:bg-orange-900/20' : ''
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
                <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">
                  {t('Results will be saved to project')}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-[#222] p-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex gap-2 mb-6">
          <motion.button
            onClick={() => setActiveTab('ai')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`relative flex-1 py-4 px-6 rounded-lg font-semibold transition-all overflow-hidden ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
            }`}
          >
            {activeTab === 'ai' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="text-lg font-bold">AI</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                activeTab === 'ai'
                  ? 'bg-white/25 text-white'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              }`}>
                Analysis
              </span>
            </span>
          </motion.button>

          <motion.button
            onClick={() => setActiveTab('account511')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`relative flex-1 py-4 px-6 rounded-lg font-semibold transition-all overflow-hidden ${
              activeTab === 'account511'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
            }`}
          >
            {activeTab === 'account511' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="text-lg font-bold">Account 511</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                activeTab === 'account511'
                  ? 'bg-white/25 text-white'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              }`}>
                Revenue
              </span>
            </span>
          </motion.button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'ai' && <AIAnalysis projectUuid={projectUuid} />}
            {activeTab === 'account511' && <Account511Analysis projectUuid={projectUuid} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-gray-600 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-700">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {t('Variance Analysis')}
        </motion.p>
      </footer>

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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#181818] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#181818] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
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
                      className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#181818] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateProject(false);
                    setNewProjectName('');
                    setNewProjectDescription('');
                    setNewProjectPassword('');
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || creatingProject}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#181818] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
