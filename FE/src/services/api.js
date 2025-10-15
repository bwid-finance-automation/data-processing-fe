import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Session management
let sessionId = localStorage.getItem('session_id');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add session ID to all requests
api.interceptors.request.use((config) => {
  if (sessionId) {
    config.headers['X-Session-ID'] = sessionId;
  }
  return config;
});

// Session Management
export const createSession = async () => {
  const response = await api.post('/session/create');
  sessionId = response.data.session_id;
  localStorage.setItem('session_id', sessionId);
  return response.data;
};

export const cleanupSession = async () => {
  if (sessionId) {
    await api.delete('/session/cleanup');
    localStorage.removeItem('session_id');
    sessionId = null;
  }
};

// File Upload
export const uploadInputFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload/input', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const uploadMasterDataFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload/master-data', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// File Management
export const listInputFiles = async () => {
  const response = await api.get('/files/input');
  return response.data;
};

export const listMasterDataFiles = async () => {
  const response = await api.get('/files/master-data');
  return response.data;
};

export const listOutputFiles = async () => {
  const response = await api.get('/files/output');
  return response.data;
};

export const deleteFile = async (fileType, filename) => {
  const response = await api.delete(`/files/${fileType}/${filename}`);
  return response.data;
};

export const downloadFile = async (fileType, filename) => {
  const response = await api.get(`/files/download/${fileType}/${filename}`, {
    responseType: 'blob',
  });
  return response.data;
};

// Processing
export const processBilling = async (inputFiles = null) => {
  const response = await api.post('/process', { input_files: inputFiles });
  return response.data;
};

// Status
export const getSystemStatus = async () => {
  const response = await api.get('/status');
  return response.data;
};

export const getMasterDataStatus = async () => {
  const response = await api.get('/master-data/status');
  return response.data;
};

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
