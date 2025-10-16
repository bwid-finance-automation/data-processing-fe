import { apiClient, API_BASE_URL } from '../../configs/APIs';

const api = apiClient;

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const processPythonAnalysis = async (formData, onUploadProgress) => {
  const response = await api.post('/api/finance/api/process', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob',
    onUploadProgress,
  });
  return response.data;
};

export const startAIAnalysis = async (formData, onUploadProgress) => {
  const response = await api.post('/api/finance/api/start-analysis', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

export const streamLogs = (sessionId) => {
  return new EventSource(`${API_BASE_URL}/api/finance/api/logs/${sessionId}`);
};

export const downloadResult = async (sessionId) => {
  const response = await api.get(`/api/finance/api/download/${sessionId}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const listDebugFiles = async (sessionId) => {
  const response = await api.get(`/api/finance/api/debug/list/${sessionId}`);
  return response.data;
};

export const downloadDebugFile = async (fileKey) => {
  const response = await api.get(`/api/finance/api/debug/${fileKey}`, {
    responseType: 'blob',
  });
  return response.data;
};

export default api;
