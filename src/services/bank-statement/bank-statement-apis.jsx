import { apiClient, FINANCE_API_BASE_URL } from '../../configs/APIs';

/**
 * Parse bank statements - Upload and process multiple bank statement Excel files
 * @param {File[]} files - Array of Excel files to process
 * @returns {Promise} Response with session_id, download_url, and summary
 */
export const parseBankStatements = async (files) => {
  const formData = new FormData();

  files.forEach(file => {
    formData.append('files', file);
  });

  try {
    const response = await apiClient.post(
      `${FINANCE_API_BASE_URL}/bank-statements/parse`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error parsing bank statements:', error);
    throw error;
  }
};

/**
 * Parse bank statements from PDF files using Gemini Flash OCR
 * @param {File[]} files - Array of PDF files to process
 * @param {Object} filePasswords - Object mapping file names to passwords (optional)
 * @returns {Promise} Response with session_id, download_url, and summary
 */
export const parseBankStatementsPDF = async (files, filePasswords = {}) => {
  const formData = new FormData();

  // Build passwords string in same order as files
  // Empty string for files without password
  const passwordsArray = files.map(file => filePasswords[file.name] || '');
  const passwordsString = passwordsArray.join(',');

  files.forEach(file => {
    formData.append('files', file);
  });

  // Only append passwords if at least one file has a password
  if (Object.keys(filePasswords).length > 0) {
    formData.append('passwords', passwordsString);
  }

  try {
    const response = await apiClient.post(
      `${FINANCE_API_BASE_URL}/bank-statements/parse-pdf`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error parsing bank statement PDFs:', error);
    throw error;
  }
};

/**
 * Get supported banks list
 * @returns {Promise} List of supported bank names
 */
export const getSupportedBanks = async () => {
  try {
    const response = await apiClient.get(
      `${FINANCE_API_BASE_URL}/bank-statements/supported-banks`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching supported banks:', error);
    throw error;
  }
};

/**
 * Download processed bank statement Excel file
 * @param {string} sessionId - Session ID from parse response
 * @returns {Promise} Blob for download
 */
export const downloadBankStatementResults = async (sessionId) => {
  try {
    const response = await apiClient.get(
      `${FINANCE_API_BASE_URL}/bank-statements/download/${sessionId}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error downloading bank statement results:', error);
    throw error;
  }
};

/**
 * Health check for bank statement parser service
 * @returns {Promise} Service health status
 */
export const checkBankStatementHealth = async () => {
  try {
    const response = await apiClient.get(
      `${FINANCE_API_BASE_URL}/bank-statements/health`
    );
    return response.data;
  } catch (error) {
    console.error('Error checking bank statement service health:', error);
    throw error;
  }
};
