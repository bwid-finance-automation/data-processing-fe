import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const billingApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Session Management
export const createSession = async () => {
  try {
    const response = await billingApi.post('/api/v1/billing/session/create');
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create session');
  }
};

export const cleanupSession = async (sessionId) => {
  try {
    const response = await billingApi.delete('/api/v1/billing/session/cleanup', {
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

    const response = await billingApi.post('/api/v1/billing/upload/input', formData, {
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

    const response = await billingApi.post('/api/v1/billing/upload/master-data', formData, {
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
    const response = await billingApi.get('/api/v1/billing/files/input', {
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
    const response = await billingApi.get('/api/v1/billing/files/master-data', {
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
    const response = await billingApi.get('/api/v1/billing/files/output', {
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
    const response = await billingApi.delete(`/api/finance/api/v1/billing/files/${fileType}/${filename}`, {
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
    const response = await billingApi.get(`/api/finance/api/v1/billing/files/download/${fileType}/${filename}`, {
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
      '/api/v1/billing/process',
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
    const response = await billingApi.get('/api/v1/billing/status', {
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
    const response = await billingApi.get('/api/v1/billing/master-data/status', {
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
    const response = await billingApi.get('/api/v1/billing/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export default billingApi;
