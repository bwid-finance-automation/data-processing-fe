import { apiClient } from '../../configs/APIs';

export const processContracts = async (files, onProgress) => {
  const formData = new FormData();

  files.forEach(file => {
    formData.append('files', file);
  });

  try {
    const response = await apiClient.post(
      '/api/process-contracts-batch',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      }
    );

    // Simulate progress for individual file processing
    for (let i = 1; i <= files.length; i++) {
      onProgress(i, files.length);
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return response.data;
  } catch (error) {
    console.error('Error processing contracts:', error);
    throw new Error(error.response?.data?.detail || 'Failed to process contracts');
  }
};

export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export const getSupportedFormats = async () => {
  try {
    const response = await apiClient.get('/api/supported-formats');
    return response.data;
  } catch (error) {
    console.error('Failed to get supported formats:', error);
    throw error;
  }
};
