import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getProject,
  getProjects,
  createProject,
  verifyProjectPassword
} from '@services/project/project-apis';

/**
 * Custom hook for project management functionality
 * Encapsulates all project-related state and logic that was previously duplicated across multiple pages
 *
 * @param {Object} options Configuration options
 * @param {string} options.basePath - Base path for navigation (e.g., '/bank-statement-parser')
 * @param {Function} options.onProjectChange - Callback when project changes (for resetting page-specific state)
 * @returns {Object} Project management state and handlers
 */
export function useProjectManagement({ basePath, onProjectChange }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectUuid = searchParams.get('project');
  const projectDropdownRef = useRef(null);

  // Core project state
  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [projectsList, setProjectsList] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectError, setProjectError] = useState(null);

  // Create project dialog state
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [createProjectForm, setCreateProjectForm] = useState({
    name: '',
    description: '',
    password: ''
  });
  const [showNewProjectPassword, setShowNewProjectPassword] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  // Password verification dialog state
  const [passwordDialog, setPasswordDialog] = useState({
    open: false,
    project: null,
    password: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch project info when projectUuid changes
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectUuid) {
        setProject(null);
        setLoadingProject(false);
        return;
      }

      setLoadingProject(true);
      setProjectError(null);

      try {
        const projectData = await getProject(projectUuid);

        if (projectData.is_protected) {
          // Check if already verified in this session
          const verifiedProjects = JSON.parse(
            sessionStorage.getItem('verifiedProjects') || '{}'
          );

          if (verifiedProjects[projectUuid]) {
            setProject(projectData);
          } else {
            // Show password dialog
            setPasswordDialog({
              open: true,
              project: projectData,
              password: ''
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
  const handleSelectProject = useCallback((selectedProject) => {
    // Call onProjectChange callback to reset page-specific state
    onProjectChange?.();

    if (selectedProject) {
      if (selectedProject.is_protected) {
        // Check if already verified in this session
        const verifiedProjects = JSON.parse(
          sessionStorage.getItem('verifiedProjects') || '{}'
        );

        if (verifiedProjects[selectedProject.uuid]) {
          navigate(`${basePath}?project=${selectedProject.uuid}`);
          setShowProjectDropdown(false);
        } else {
          // Show password dialog
          setPasswordDialog({
            open: true,
            project: selectedProject,
            password: ''
          });
          setPasswordError('');
          setShowPassword(false);
          setShowProjectDropdown(false);
        }
      } else {
        navigate(`${basePath}?project=${selectedProject.uuid}`);
        setShowProjectDropdown(false);
      }
    } else {
      // Standalone mode - no project
      navigate(basePath);
      setProject(null);
      setShowProjectDropdown(false);
    }
  }, [basePath, navigate, onProjectChange]);

  // Handle password verification
  const handleVerifyPassword = useCallback(async () => {
    if (!passwordDialog.password.trim()) {
      setPasswordError(t('Password is required'));
      return;
    }

    setVerifyingPassword(true);

    try {
      const result = await verifyProjectPassword(
        passwordDialog.project.uuid,
        passwordDialog.password
      );

      if (result.verified) {
        // Store in session storage
        const verifiedProjects = JSON.parse(
          sessionStorage.getItem('verifiedProjects') || '{}'
        );
        verifiedProjects[passwordDialog.project.uuid] = true;
        sessionStorage.setItem('verifiedProjects', JSON.stringify(verifiedProjects));

        navigate(`${basePath}?project=${passwordDialog.project.uuid}`);
        setPasswordDialog({ open: false, project: null, password: '' });
        setPasswordError('');
      } else {
        setPasswordError(t('Invalid password'));
      }
    } catch (err) {
      setPasswordError(err.response?.data?.detail || t('Failed to verify password'));
    } finally {
      setVerifyingPassword(false);
    }
  }, [basePath, navigate, passwordDialog, t]);

  // Handle create new project
  const handleCreateProject = useCallback(async () => {
    if (!createProjectForm.name.trim()) return;

    setCreatingProject(true);
    setProjectError(null);

    try {
      const newProject = await createProject({
        name: createProjectForm.name.trim(),
        description: createProjectForm.description.trim() || null,
        password: createProjectForm.password.trim() || null
      });

      // Add to projects list
      setProjectsList(prev => [newProject, ...prev]);

      // Navigate to the new project
      navigate(`${basePath}?project=${newProject.uuid}`);

      // Reset form
      setCreateProjectForm({ name: '', description: '', password: '' });
      setShowNewProjectPassword(false);
      setShowCreateProject(false);
      setShowProjectDropdown(false);
    } catch (err) {
      console.error('Error creating project:', err);
      setProjectError(t('Failed to create project. Please try again.'));
    } finally {
      setCreatingProject(false);
    }
  }, [basePath, createProjectForm, navigate, t]);

  // Cancel password dialog
  const cancelPasswordDialog = useCallback(() => {
    setPasswordDialog({ open: false, project: null, password: '' });
    setPasswordError('');
    setShowPassword(false);
  }, []);

  // Reset create project form
  const resetCreateForm = useCallback(() => {
    setCreateProjectForm({ name: '', description: '', password: '' });
    setShowNewProjectPassword(false);
    setShowCreateProject(false);
  }, []);

  // Toggle project dropdown
  const toggleProjectDropdown = useCallback(() => {
    setShowProjectDropdown(prev => !prev);
  }, []);

  // Refresh projects list
  const refreshProjectsList = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const data = await getProjects(0, 50);
      setProjectsList(data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  return {
    // Core state
    project,
    projectUuid,
    loadingProject,
    projectsList,
    loadingProjects,
    showProjectDropdown,
    projectDropdownRef,
    projectError,

    // Create project state
    showCreateProject,
    createProjectForm,
    showNewProjectPassword,
    creatingProject,

    // Password dialog state
    passwordDialog,
    passwordError,
    verifyingPassword,
    showPassword,

    // Setters
    setShowProjectDropdown,
    setShowCreateProject,
    setCreateProjectForm,
    setShowNewProjectPassword,
    setPasswordDialog,
    setShowPassword,
    setProjectError,

    // Handlers
    handleSelectProject,
    handleVerifyPassword,
    handleCreateProject,
    cancelPasswordDialog,
    resetCreateForm,
    toggleProjectDropdown,
    refreshProjectsList,

    // Aliases for backward compatibility
    showCreatePassword: showNewProjectPassword,
    setShowCreatePassword: setShowNewProjectPassword,
    handleCloseCreateDialog: resetCreateForm,
    handleClosePasswordDialog: cancelPasswordDialog,
  };
}

export default useProjectManagement;
