import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  PencilIcon,
  LockClosedIcon,
  LockOpenIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/common/Breadcrumb';
import {
  getProjects,
  searchProjects,
  createProject,
  updateProject,
  deleteProject,
  setProjectPassword,
  verifyProjectPassword
} from '../services/project/project-apis';

const ProjectManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Modal states
  const [createModal, setCreateModal] = useState({ open: false, name: '', description: '', password: '' });
  const [editModal, setEditModal] = useState({ open: false, project: null, name: '', description: '', currentPassword: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, project: null, currentPassword: '' });
  const [passwordModal, setPasswordModal] = useState({ open: false, project: null, currentPassword: '', newPassword: '', confirmPassword: '' });
  const [verifyModal, setVerifyModal] = useState({ open: false, project: null, password: '', targetPath: '' });

  // UI states
  const [showPassword, setShowPassword] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const breadcrumbItems = [
    { label: t('Home'), href: '/' },
    { label: t('Projects'), href: '/projects' }
  ];

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.response?.data?.detail || t('Failed to load projects'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Search handler with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        setSearching(true);
        try {
          const results = await searchProjects(searchQuery);
          setProjects(results);
        } catch (err) {
          console.error('Error searching projects:', err);
        } finally {
          setSearching(false);
        }
      } else {
        fetchProjects();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchProjects]);

  // Create project handler
  const handleCreateProject = async () => {
    if (!createModal.name.trim()) {
      setActionError(t('Project name is required'));
      return;
    }

    // Validate password minimum length if provided
    if (createModal.password && createModal.password.length < 4) {
      setActionError(t('Password must be at least 4 characters'));
      return;
    }

    setSubmitting(true);
    setActionError('');
    try {
      const newProject = await createProject({
        name: createModal.name.trim(),
        description: createModal.description.trim() || null,
        password: createModal.password || null
      });
      setProjects(prev => [newProject, ...prev]);
      setCreateModal({ open: false, name: '', description: '', password: '' });
    } catch (err) {
      console.error('Error creating project:', err);
      setActionError(err.response?.data?.detail || t('Failed to create project'));
    } finally {
      setSubmitting(false);
    }
  };

  // Update project handler
  const handleUpdateProject = async () => {
    if (!editModal.name.trim()) {
      setActionError(t('Project name is required'));
      return;
    }

    // Check password for protected projects
    if (editModal.project?.is_protected && !editModal.currentPassword) {
      setActionError(t('Current password is required for protected project'));
      return;
    }

    setSubmitting(true);
    setActionError('');
    try {
      const updateData = {
        project_name: editModal.name.trim(),
        description: editModal.description.trim() || null
      };
      if (editModal.project?.is_protected) {
        updateData.current_password = editModal.currentPassword;
      }
      const updated = await updateProject(editModal.project.uuid, updateData);
      setProjects(prev => prev.map(p => p.uuid === updated.uuid ? updated : p));
      setEditModal({ open: false, project: null, name: '', description: '', currentPassword: '' });
    } catch (err) {
      console.error('Error updating project:', err);
      setActionError(err.response?.data?.detail || t('Failed to update project'));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete project handler
  const handleDeleteProject = async () => {
    // Check password for protected projects
    if (deleteModal.project?.is_protected && !deleteModal.currentPassword) {
      setActionError(t('Current password is required for protected project'));
      return;
    }

    setSubmitting(true);
    setActionError('');
    try {
      const currentPassword = deleteModal.project?.is_protected ? deleteModal.currentPassword : null;
      await deleteProject(deleteModal.project.uuid, currentPassword);
      setProjects(prev => prev.filter(p => p.uuid !== deleteModal.project.uuid));
      setDeleteModal({ open: false, project: null, currentPassword: '' });
    } catch (err) {
      console.error('Error deleting project:', err);
      setActionError(err.response?.data?.detail || t('Failed to delete project'));
    } finally {
      setSubmitting(false);
    }
  };

  // Set password handler
  const handleSetPassword = async () => {
    if (!passwordModal.newPassword) {
      setActionError(t('New password is required'));
      return;
    }
    if (passwordModal.newPassword.length < 4) {
      setActionError(t('Password must be at least 4 characters'));
      return;
    }
    if (passwordModal.newPassword !== passwordModal.confirmPassword) {
      setActionError(t('Passwords do not match'));
      return;
    }
    if (passwordModal.project.is_protected && !passwordModal.currentPassword) {
      setActionError(t('Current password is required'));
      return;
    }

    setSubmitting(true);
    setActionError('');
    try {
      await setProjectPassword(
        passwordModal.project.uuid,
        passwordModal.newPassword,
        passwordModal.project.is_protected ? passwordModal.currentPassword : null
      );
      setProjects(prev => prev.map(p =>
        p.uuid === passwordModal.project.uuid ? { ...p, is_protected: true } : p
      ));
      setPasswordModal({ open: false, project: null, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Error setting password:', err);
      setActionError(err.response?.data?.detail || t('Failed to set password'));
    } finally {
      setSubmitting(false);
    }
  };

  // Verify password and navigate
  const handleVerifyAndNavigate = async () => {
    if (!verifyModal.password) {
      setActionError(t('Password is required'));
      return;
    }

    setSubmitting(true);
    setActionError('');
    try {
      const result = await verifyProjectPassword(verifyModal.project.uuid, verifyModal.password);
      if (result.verified) {
        // Store verified project in sessionStorage
        const verifiedProjects = JSON.parse(sessionStorage.getItem('verifiedProjects') || '{}');
        verifiedProjects[verifyModal.project.uuid] = true;
        sessionStorage.setItem('verifiedProjects', JSON.stringify(verifiedProjects));

        setVerifyModal({ open: false, project: null, password: '', targetPath: '' });
        navigate(verifyModal.targetPath);
      } else {
        setActionError(t('Incorrect password'));
      }
    } catch (err) {
      console.error('Error verifying password:', err);
      setActionError(err.response?.data?.detail || t('Failed to verify password'));
    } finally {
      setSubmitting(false);
    }
  };

  // Navigate to project workspace
  const handleOpenProject = (project) => {
    const targetPath = `/projects/${project.uuid}`;

    if (project.is_protected) {
      // Check if already verified in this session
      const verifiedProjects = JSON.parse(sessionStorage.getItem('verifiedProjects') || '{}');
      if (verifiedProjects[project.uuid]) {
        navigate(targetPath);
      } else {
        setVerifyModal({ open: true, project, password: '', targetPath });
        setActionError('');
      }
    } else {
      navigate(targetPath);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    // Append 'Z' if not present to indicate UTC time
    let dateString = isoString;
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
      dateString += 'Z';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleShowPassword = (key) => {
    setShowPassword(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3] dark:bg-[#181818] transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#222] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb items={breadcrumbItems} />
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-[#f5efe6]">
                  {t('Project Management')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {t('Manage your projects and organize related data')}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCreateModal({ open: true, name: '', description: '', password: '' });
                setActionError('');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all"
            >
              <PlusIcon className="h-5 w-5" />
              {t('New Project')}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search projects...')}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#222] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('Loading projects...')}</p>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project, index) => (
              <motion.div
                key={project.uuid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleOpenProject(project)}
                className="bg-white dark:bg-[#222] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden group hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="p-4">
                  {/* Header row */}
                  <div className="flex items-center gap-2 mb-2">
                    <FolderIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate flex-1">
                      {project.project_name}
                    </h3>
                    {project.is_protected && (
                      <LockClosedIcon className="h-4 w-4 text-amber-500 flex-shrink-0" title={t('Password protected')} />
                    )}
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
                      {project.description}
                    </p>
                  )}

                  {/* Footer row */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(project.created_at).split(' ')[0]}
                    </span>
                    {project.case_count > 0 && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                        {project.case_count} {t('cases')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons - compact */}
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPasswordModal({
                        open: true,
                        project,
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                      setActionError('');
                    }}
                    className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                    title={project.is_protected ? t('Change password') : t('Set password')}
                  >
                    {project.is_protected ? (
                      <LockClosedIcon className="h-4 w-4" />
                    ) : (
                      <LockOpenIcon className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditModal({
                        open: true,
                        project,
                        name: project.project_name,
                        description: project.description || ''
                      });
                      setActionError('');
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title={t('Edit')}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModal({ open: true, project });
                      setActionError('');
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title={t('Delete')}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-16">
            <FolderIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {searchQuery ? t('No projects found') : t('No projects yet')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery
                ? t('Try adjusting your search')
                : t('Create your first project to get started')}
            </p>
            {!searchQuery && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCreateModal({ open: true, name: '', description: '', password: '' });
                  setActionError('');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all"
              >
                <PlusIcon className="h-5 w-5" />
                {t('Create Project')}
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {createModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#222] rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {t('Create New Project')}
                </h3>
                <button
                  onClick={() => setCreateModal({ open: false, name: '', description: '', password: '' })}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Project Name')} *
                  </label>
                  <input
                    type="text"
                    value={createModal.name}
                    onChange={(e) => setCreateModal(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('Enter project name')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Description')}
                  </label>
                  <textarea
                    value={createModal.description}
                    onChange={(e) => setCreateModal(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('Enter project description (optional)')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Password')} ({t('optional')})
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.create ? 'text' : 'password'}
                      value={createModal.password}
                      onChange={(e) => setCreateModal(prev => ({ ...prev, password: e.target.value }))}
                      placeholder={t('Set a password to protect this project')}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowPassword('create')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showPassword.create ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {actionError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setCreateModal({ open: false, name: '', description: '', password: '' })}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={submitting || !createModal.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('Creating...')}
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-5 w-5" />
                      {t('Create')}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Project Modal */}
      <AnimatePresence>
        {editModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#222] rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {t('Edit Project')}
                </h3>
                <button
                  onClick={() => setEditModal({ open: false, project: null, name: '', description: '', currentPassword: '' })}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {editModal.project?.is_protected && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                      <LockClosedIcon className="h-5 w-5" />
                      <span className="font-medium">{t('Protected Project')}</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword.editCurrent ? 'text' : 'password'}
                        value={editModal.currentPassword}
                        onChange={(e) => setEditModal(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder={t('Enter current password')}
                        className="w-full px-4 py-2 pr-10 border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowPassword('editCurrent')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showPassword.editCurrent ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Project Name')} *
                  </label>
                  <input
                    type="text"
                    value={editModal.name}
                    onChange={(e) => setEditModal(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus={!editModal.project?.is_protected}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Description')}
                  </label>
                  <textarea
                    value={editModal.description}
                    onChange={(e) => setEditModal(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {actionError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditModal({ open: false, project: null, name: '', description: '', currentPassword: '' })}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleUpdateProject}
                  disabled={submitting || !editModal.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('Saving...')}
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      {t('Save')}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#222] rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {t('Delete Project')}
                </h3>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('Are you sure you want to delete')} <strong>{deleteModal.project?.project_name}</strong>?
                {t('This action cannot be undone.')}
              </p>

              {deleteModal.project?.is_protected && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                    <LockClosedIcon className="h-5 w-5" />
                    <span className="font-medium">{t('Protected Project')}</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword.deleteCurrent ? 'text' : 'password'}
                      value={deleteModal.currentPassword}
                      onChange={(e) => setDeleteModal(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder={t('Enter current password to confirm')}
                      className="w-full px-4 py-2 pr-10 border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowPassword('deleteCurrent')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showPassword.deleteCurrent ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {actionError && (
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">{actionError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ open: false, project: null, currentPassword: '' })}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleDeleteProject}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('Deleting...')}
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-5 w-5" />
                      {t('Delete')}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {passwordModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#222] rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <LockClosedIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {passwordModal.project?.is_protected ? t('Change Password') : t('Set Password')}
                </h3>
              </div>

              <div className="space-y-4">
                {passwordModal.project?.is_protected && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('Current Password')} *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.current ? 'text' : 'password'}
                        value={passwordModal.currentPassword}
                        onChange={(e) => setPasswordModal(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowPassword('current')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showPassword.current ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('New Password')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordModal.newPassword}
                      onChange={(e) => setPasswordModal(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowPassword('new')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showPassword.new ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Confirm Password')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordModal.confirmPassword}
                      onChange={(e) => setPasswordModal(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowPassword('confirm')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showPassword.confirm ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {actionError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setPasswordModal({ open: false, project: null, currentPassword: '', newPassword: '', confirmPassword: '' })}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleSetPassword}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('Saving...')}
                    </>
                  ) : (
                    <>
                      <LockClosedIcon className="h-5 w-5" />
                      {t('Set Password')}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Verify Password Modal */}
      <AnimatePresence>
        {verifyModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#222] rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <LockClosedIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('Enter Password')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {verifyModal.project?.name}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="relative">
                    <input
                      type={showPassword.verify ? 'text' : 'password'}
                      value={verifyModal.password}
                      onChange={(e) => {
                        setVerifyModal(prev => ({ ...prev, password: e.target.value }));
                        setActionError('');
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && !submitting && handleVerifyAndNavigate()}
                      placeholder={t('Enter project password')}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowPassword('verify')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showPassword.verify ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {actionError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setVerifyModal({ open: false, project: null, password: '', targetPath: '' })}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleVerifyAndNavigate}
                  disabled={submitting || !verifyModal.password}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('Verifying...')}
                    </>
                  ) : (
                    t('Open Project')
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectManagement;
