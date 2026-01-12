import { apiClient, FINANCE_API_BASE_URL } from '../../configs/APIs';

/**
 * Parse bank statements - Upload and process multiple bank statement Excel files
 * @param {File[]} files - Array of Excel files to process
 * @param {Object} zipPasswords - Object mapping ZIP file names to passwords (optional)
 * @param {string} projectUuid - Optional project UUID to link statements to
 * @returns {Promise} Response with session_id, download_url, and summary
 */
export const parseBankStatements = async (files, zipPasswords = {}, projectUuid = null) => {
  const formData = new FormData();

  // Build ZIP passwords string in same order as ZIP files appear
  const zipFiles = files.filter(f => f.name.toLowerCase().endsWith('.zip'));
  const zipPasswordsArray = zipFiles.map(file => zipPasswords[file.name] || '');
  const zipPasswordsString = zipPasswordsArray.join(',');

  files.forEach(file => {
    formData.append('files', file);
  });

  // Only append zip_passwords if at least one ZIP has a password
  if (Object.keys(zipPasswords).length > 0 && zipFiles.length > 0) {
    formData.append('zip_passwords', zipPasswordsString);
  }

  if (projectUuid) {
    formData.append('project_uuid', projectUuid);
  }

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
 * @param {Object} filePasswords - Object mapping PDF file names to passwords (optional)
 * @param {Object} zipPasswords - Object mapping ZIP file names to passwords (optional)
 * @param {string} projectUuid - Optional project UUID to link statements to
 * @returns {Promise} Response with session_id, download_url, and summary
 */
export const parseBankStatementsPDF = async (files, filePasswords = {}, zipPasswords = {}, projectUuid = null) => {
  const formData = new FormData();

  // Build passwords string for PDF files in same order as they appear
  // Empty string for files without password
  const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
  const passwordsArray = pdfFiles.map(file => filePasswords[file.name] || '');
  const passwordsString = passwordsArray.join(',');

  // Build ZIP passwords string in same order as ZIP files appear
  const zipFiles = files.filter(f => f.name.toLowerCase().endsWith('.zip'));
  const zipPasswordsArray = zipFiles.map(file => zipPasswords[file.name] || '');
  const zipPasswordsString = zipPasswordsArray.join(',');

  files.forEach(file => {
    formData.append('files', file);
  });

  // Only append passwords if at least one PDF has a password
  if (Object.keys(filePasswords).length > 0 && pdfFiles.length > 0) {
    formData.append('passwords', passwordsString);
  }

  // Only append zip_passwords if at least one ZIP has a password
  if (Object.keys(zipPasswords).length > 0 && zipFiles.length > 0) {
    formData.append('zip_passwords', zipPasswordsString);
  }

  if (projectUuid) {
    formData.append('project_uuid', projectUuid);
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
 * Verify ZIP file password
 * @param {File} file - ZIP file to verify
 * @param {string} password - Password to verify
 * @returns {Promise<{valid: boolean, message: string}>} Verification result
 */
export const verifyZipPassword = async (file, password) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);

  try {
    const response = await apiClient.post(
      `${FINANCE_API_BASE_URL}/bank-statements/verify-zip-password`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error verifying ZIP password:', error);
    throw error;
  }
};

/**
 * Extract filename from Content-Disposition header
 * @param {string} contentDisposition - Content-Disposition header value
 * @returns {string|null} Filename or null
 */
const extractFilename = (contentDisposition) => {
  if (!contentDisposition) return null;
  const match = contentDisposition.match(/filename=(.+)/);
  return match ? match[1].replace(/"/g, '') : null;
};

/**
 * Download processed bank statement Excel file
 * @param {string} sessionId - Session ID from parse response
 * @returns {Promise<{blob: Blob, filename: string}>} Blob and filename for download
 */
export const downloadBankStatementResults = async (sessionId) => {
  try {
    const response = await apiClient.get(
      `${FINANCE_API_BASE_URL}/bank-statements/download/${sessionId}`,
      {
        responseType: 'blob',
      }
    );
    const filename = extractFilename(response.headers['content-disposition']) || `bank_statements_${sessionId}.xlsx`;
    return { blob: response.data, filename };
  } catch (error) {
    console.error('Error downloading bank statement results:', error);
    throw error;
  }
};

/**
 * Download bank statement Excel file from history (regenerated from database)
 * @param {string} sessionId - Session ID from parse history
 * @returns {Promise<{blob: Blob, filename: string}>} Blob and filename for download
 */
export const downloadBankStatementFromHistory = async (sessionId) => {
  try {
    const response = await apiClient.get(
      `${FINANCE_API_BASE_URL}/bank-statements/download-history/${sessionId}`,
      {
        responseType: 'blob',
      }
    );
    const filename = extractFilename(response.headers['content-disposition']) || `bank_statements_${sessionId}.xlsx`;
    return { blob: response.data, filename };
  } catch (error) {
    console.error('Error downloading bank statement from history:', error);
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

/**
 * Get list of uploaded files for a session
 * @param {string} sessionId - Session ID from parse response
 * @returns {Promise} List of uploaded files with metadata
 */
export const getUploadedFiles = async (sessionId) => {
  try {
    const response = await apiClient.get(
      `${FINANCE_API_BASE_URL}/bank-statements/uploaded-files/${sessionId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching uploaded files:', error);
    throw error;
  }
};

/**
 * Download original uploaded file by file ID
 * @param {number} fileId - File ID from uploaded files list
 * @returns {Promise} Response with blob data and headers
 */
export const downloadUploadedFile = async (fileId) => {
  try {
    const response = await apiClient.get(
      `${FINANCE_API_BASE_URL}/bank-statements/uploaded-file/${fileId}`,
      {
        responseType: 'blob',
      }
    );
    return response;
  } catch (error) {
    console.error('Error downloading uploaded file:', error);
    throw error;
  }
};

/**
 * Get storage statistics for bank statement uploads
 * @returns {Promise} Storage statistics (total files, size, etc.)
 */
export const getStorageStats = async () => {
  try {
    const response = await apiClient.get(
      `${FINANCE_API_BASE_URL}/bank-statements/storage/stats`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching storage stats:', error);
    throw error;
  }
};

/**
 * Trigger cleanup of old uploaded files
 * @param {number} retentionDays - Number of days to retain files (default: 30)
 * @returns {Promise} Cleanup statistics
 */
export const cleanupStorage = async (retentionDays = 30) => {
  try {
    const response = await apiClient.post(
      `${FINANCE_API_BASE_URL}/bank-statements/storage/cleanup`,
      null,
      {
        params: { retention_days: retentionDays }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error cleaning up storage:', error);
    throw error;
  }
};
