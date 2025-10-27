import { apiClient } from '@configs/APIs';

export const processContracts = async (files, onProgress) => {
  const formData = new FormData();

  files.forEach(file => {
    formData.append('files', file);
  });

  try {
    const response = await apiClient.post(
      '/contract-ocr/process-contracts-batch',
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

/**
 * Export contracts to Excel using backend service
 * Returns normalized format with one row per rate period
 */
export const exportContractsToExcel = async (files) => {
  const formData = new FormData();

  files.forEach(file => {
    formData.append('files', file);
  });

  try {
    const response = await apiClient.post(
      '/contract-ocr/export-to-excel',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob', // Important: tells axios to expect binary data
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Get filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'contract_extractions.xlsx';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error(error.response?.data?.detail || 'Failed to export to Excel');
  }
};

export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/contract-ocr/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export const getSupportedFormats = async () => {
  try {
    const response = await apiClient.get('/contract-ocr/supported-formats');
    return response.data;
  } catch (error) {
    console.error('Failed to get supported formats:', error);
    throw error;
  }
};

/**
 * Process a contract with unit breakdown Excel file
 * Creates individual contracts for each unit
 */
export const processContractWithUnits = async (contractFile, unitBreakdownFile, onProgress) => {
  const formData = new FormData();
  formData.append('contract_file', contractFile);
  formData.append('unit_breakdown_file', unitBreakdownFile);

  try {
    const response = await apiClient.post(
      '/contract-ocr/process-contract-with-units',
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
          if (onProgress) {
            onProgress(percentCompleted);
          }
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error processing contract with units:', error);
    throw new Error(error.response?.data?.detail || 'Failed to process contract with units');
  }
};

/**
 * Export contract with unit breakdown to Excel
 * Returns Excel file with one row per unit per rate period
 * Unit column will be properly filled from the breakdown Excel
 */
export const exportContractWithUnitsToExcel = async (contractFile, unitBreakdownFile) => {
  const formData = new FormData();
  formData.append('contract_file', contractFile);
  formData.append('unit_breakdown_file', unitBreakdownFile);

  try {
    const response = await apiClient.post(
      '/contract-ocr/export-contract-with-units-to-excel',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob', // Important: tells axios to expect binary data
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Get filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'contract_with_units.xlsx';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting contract with units to Excel:', error);
    throw new Error(error.response?.data?.detail || 'Failed to export contract with units to Excel');
  }
};
