import { apiClient } from '@configs/APIs';

// Use the finance API client which already points to /api/finance
const billingApi = apiClient;

// Session Management
export const createSession = async (projectUuid = null) => {
  try {
    const formData = new FormData();
    if (projectUuid) {
      formData.append('project_uuid', projectUuid);
    }

    const response = await billingApi.post('/billing/session/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create session');
  }
};

export const cleanupSession = async (sessionId) => {
  try {
    const response = await billingApi.delete('/billing/session/cleanup', {
      headers: {
        'X-Session-ID': sessionId,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error cleaning up session:', error);
    throw error;
  }
};

// File Upload
export const uploadInputFile = async (sessionId, file, onProgress) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await billingApi.post('/billing/upload/input', formData, {
      headers: {
        'X-Session-ID': sessionId,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percentCompleted);
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading input file:', error);
    throw new Error(error.response?.data?.detail || 'Failed to upload input file');
  }
};

export const uploadMasterDataFile = async (sessionId, file, onProgress) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await billingApi.post('/billing/upload/master-data', formData, {
      headers: {
        'X-Session-ID': sessionId,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percentCompleted);
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading master data file:', error);
    throw new Error(error.response?.data?.detail || 'Failed to upload master data file');
  }
};

// File Management
export const listInputFiles = async (sessionId) => {
  try {
    const response = await billingApi.get('/billing/files/input', {
      headers: {
        'X-Session-ID': sessionId,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error listing input files:', error);
    throw error;
  }
};

export const listMasterDataFiles = async (sessionId) => {
  try {
    const response = await billingApi.get('/billing/files/master-data', {
      headers: {
        'X-Session-ID': sessionId,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error listing master data files:', error);
    throw error;
  }
};

export const listOutputFiles = async (sessionId) => {
  try {
    const response = await billingApi.get('/billing/files/output', {
      headers: {
        'X-Session-ID': sessionId,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error listing output files:', error);
    throw error;
  }
};

export const deleteFile = async (sessionId, fileType, filename) => {
  try {
    const response = await billingApi.delete(`/billing/files/${fileType}/${filename}`, {
      headers: {
        'X-Session-ID': sessionId,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export const downloadFile = async (sessionId, fileType, filename) => {
  try {
    const response = await billingApi.get(`/billing/files/download/${fileType}/${filename}`, {
      headers: {
        'X-Session-ID': sessionId,
      },
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();

    return true;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

// Processing
export const processBilling = async (sessionId, inputFiles = null) => {
  try {
    const response = await billingApi.post(
      '/billing/process',
      inputFiles ? { input_files: inputFiles } : {},
      {
        headers: {
          'X-Session-ID': sessionId,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error processing billing:', error);
    throw new Error(error.response?.data?.detail || 'Failed to process billing');
  }
};

// System Status
export const getSystemStatus = async (sessionId) => {
  try {
    const response = await billingApi.get('/billing/status', {
      headers: {
        'X-Session-ID': sessionId,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting system status:', error);
    throw error;
  }
};

export const getMasterDataStatus = async (sessionId) => {
  try {
    const response = await billingApi.get('/billing/master-data/status', {
      headers: {
        'X-Session-ID': sessionId,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting master data status:', error);
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await billingApi.get('/billing/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export default billingApi;
