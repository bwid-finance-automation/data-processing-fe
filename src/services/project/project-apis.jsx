import { projectApiClient } from '../../configs/APIs';

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @param {string} projectData.name - Project name (required)
 * @param {string} projectData.description - Project description (optional)
 * @param {string} projectData.password - Project password (optional)
 * @returns {Promise} Created project data
 */
export const createProject = async (projectData) => {
  try {
    // Map frontend field names to backend expected names
    const payload = {
      project_name: projectData.name,
    };
    if (projectData.description) {
      payload.description = projectData.description;
    }
    if (projectData.password) {
      payload.password = projectData.password;
    }

    const response = await projectApiClient.post('', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

/**
 * Get list of all projects
 * @param {number} skip - Number of records to skip (default: 0)
 * @param {number} limit - Maximum number of records to return (default: 100)
 * @returns {Promise} List of projects
 */
export const getProjects = async (skip = 0, limit = 100) => {
  try {
    const response = await projectApiClient.get('/', {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

/**
 * Search projects by name
 * @param {string} query - Search query string
 * @param {number} limit - Maximum number of results (default: 20)
 * @returns {Promise} List of matching projects
 */
export const searchProjects = async (query, limit = 20) => {
  try {
    const response = await projectApiClient.get('/search', {
      params: { q: query, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching projects:', error);
    throw error;
  }
};

/**
 * Get project details by UUID
 * @param {string} uuid - Project UUID
 * @returns {Promise} Project details
 */
export const getProject = async (uuid) => {
  try {
    const response = await projectApiClient.get(`/${uuid}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
};

/**
 * Update project details
 * @param {string} uuid - Project UUID
 * @param {Object} updateData - Data to update
 * @param {string} updateData.project_name - New project name (optional)
 * @param {string} updateData.description - New description (optional)
 * @param {string} updateData.current_password - Current password (required if project is protected)
 * @returns {Promise} Updated project data
 */
export const updateProject = async (uuid, updateData) => {
  try {
    const response = await projectApiClient.put(`/${uuid}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

/**
 * Delete a project
 * @param {string} uuid - Project UUID
 * @param {string} currentPassword - Current password (required if project is protected)
 * @returns {Promise} Deletion confirmation
 */
export const deleteProject = async (uuid, currentPassword = null) => {
  try {
    const payload = {};
    if (currentPassword) {
      payload.current_password = currentPassword;
    }
    const response = await projectApiClient.post(`/${uuid}/delete`, payload);
    return response.data;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

/**
 * Set or change project password
 * @param {string} uuid - Project UUID
 * @param {string} newPassword - New password (null to remove password)
 * @param {string} currentPassword - Current password (required if project is already protected)
 * @returns {Promise} Success response
 */
export const setProjectPassword = async (uuid, newPassword, currentPassword = null) => {
  try {
    const payload = { password: newPassword };
    if (currentPassword) {
      payload.current_password = currentPassword;
    }
    const response = await projectApiClient.post(`/${uuid}/password`, payload);
    return response.data;
  } catch (error) {
    console.error('Error setting project password:', error);
    throw error;
  }
};

/**
 * Verify project password
 * @param {string} uuid - Project UUID
 * @param {string} password - Password to verify
 * @returns {Promise} Verification result
 */
export const verifyProjectPassword = async (uuid, password) => {
  try {
    const response = await projectApiClient.post(`/${uuid}/verify`, { password });
    return response.data;
  } catch (error) {
    console.error('Error verifying project password:', error);
    throw error;
  }
};

/**
 * Get list of cases for a project
 * @param {string} uuid - Project UUID
 * @returns {Promise} List of project cases
 */
export const getProjectCases = async (uuid) => {
  try {
    const response = await projectApiClient.get(`/${uuid}/cases`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project cases:', error);
    throw error;
  }
};

/**
 * Get bank statement history for a project
 * @param {string} uuid - Project UUID
 * @returns {Promise} List of bank statement records linked to project
 */
export const getProjectBankStatements = async (uuid) => {
  try {
    const response = await projectApiClient.get(`/${uuid}/cases/bank-statement`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project bank statements:', error);
    throw error;
  }
};

/**
 * Get contract OCR history for a project
 * @param {string} uuid - Project UUID
 * @returns {Promise} List of contract OCR records linked to project
 */
export const getProjectContracts = async (uuid) => {
  try {
    const response = await projectApiClient.get(`/${uuid}/cases/contract`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project contracts:', error);
    throw error;
  }
};

/**
 * Get GLA variance analysis history for a project
 * @param {string} uuid - Project UUID
 * @param {number} skip - Number of records to skip (default: 0)
 * @param {number} limit - Maximum number of records to return (default: 50)
 * @returns {Promise} List of GLA variance analysis records linked to project
 */
export const getProjectGla = async (uuid, skip = 0, limit = 50) => {
  try {
    const response = await projectApiClient.get(`/${uuid}/cases/gla`, {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching project GLA analysis:', error);
    throw error;
  }
};

/**
 * Get variance analysis history for a project
 * @param {string} uuid - Project UUID
 * @param {number} skip - Number of records to skip (default: 0)
 * @param {number} limit - Maximum number of records to return (default: 50)
 * @returns {Promise} List of variance analysis records linked to project
 */
export const getProjectVariance = async (uuid, skip = 0, limit = 50) => {
  try {
    const response = await projectApiClient.get(`/${uuid}/cases/variance`, {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching project variance analysis:', error);
    throw error;
  }
};

/**
 * Get utility billing history for a project
 * @param {string} uuid - Project UUID
 * @param {number} skip - Number of records to skip (default: 0)
 * @param {number} limit - Maximum number of records to return (default: 50)
 * @returns {Promise} List of utility billing records linked to project
 */
export const getProjectUtilityBilling = async (uuid, skip = 0, limit = 50) => {
  try {
    const response = await projectApiClient.get(`/${uuid}/cases/utility-billing`, {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching project utility billing:', error);
    throw error;
  }
};

/**
 * Get excel comparison history for a project
 * @param {string} uuid - Project UUID
 * @param {number} skip - Number of records to skip (default: 0)
 * @param {number} limit - Maximum number of records to return (default: 50)
 * @returns {Promise} List of excel comparison records linked to project
 */
export const getProjectExcelComparison = async (uuid, skip = 0, limit = 50) => {
  try {
    const response = await projectApiClient.get(`/${uuid}/cases/excel-comparison`, {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching project excel comparison:', error);
    throw error;
  }
};
