import { apiClient, FINANCE_API_BASE_URL } from '../../configs/APIs';

const api = apiClient;

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const getAIConfig = async () => {
  const response = await api.get('/ai-config');
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
  const response = await api.post('/start-analysis', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

export const streamLogs = (sessionId) => {
  return new EventSource(`${FINANCE_API_BASE_URL}/logs/${sessionId}`);
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

export const analyzeAccount511 = async (formData, onUploadProgress) => {
  const response = await api.post('/account-511-analysis', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob',
    onUploadProgress,
  });
  return response.data;
};

export default api;
