import { apiClient, API_BASE_URL } from '../../configs/APIs';

const api = apiClient;

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const processPythonAnalysis = async (formData, onUploadProgress) => {
  const response = await api.post('/process', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob',
    onUploadProgress,
  });
  return response.data;
};

export const startAIAnalysis = async (formData, onUploadProgress) => {
  const response = await api.post('/start_analysis', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

export const streamLogs = (sessionId) => {
  return new EventSource(`${API_BASE_URL}/logs/${sessionId}`);
};

export const downloadResult = async (sessionId) => {
  const response = await api.get(`/download/${sessionId}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const listDebugFiles = async (sessionId) => {
  const response = await api.get(`/debug/list/${sessionId}`);
  return response.data;
};

export const downloadDebugFile = async (fileKey) => {
  const response = await api.get(`/debug/${fileKey}`, {
    responseType: 'blob',
  });
  return response.data;
};

export default api;
