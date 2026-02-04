import { apiClient, FINANCE_API_BASE_URL } from '../../configs/APIs';

/**
 * Initialize a new cash report session
 * @param {Object} config - Session configuration
 * @param {string} config.openingDate - Report period start date (YYYY-MM-DD)
 * @param {string} config.endingDate - Report period end date (YYYY-MM-DD)
 * @param {string} config.periodName - Period name (e.g., "W3-4Jan26")
 * @returns {Promise} Session info with session_id
 */
export const initAutomationSession = async (config) => {
  const formData = new FormData();
  formData.append('opening_date', config.openingDate);
  formData.append('ending_date', config.endingDate);
  if (config.periodName) {
    formData.append('period_name', config.periodName);
  }

  try {
    const response = await apiClient.post(
      `${FINANCE_API_BASE_URL}/cash-report/init-session`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error initializing session:', error);
    throw error;
  }
};

/**
 * Upload parsed bank statement files to a session
 * @param {string} sessionId - Session ID
 * @param {File[]} files - Parsed bank statement Excel files
 * @param {boolean} filterByDate - Filter transactions by session date range (default: true)
 * @returns {Promise} Upload result with transaction counts
 */
export const uploadBankStatements = async (sessionId, files, filterByDate = true) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  formData.append('filter_by_date', filterByDate);

  try {
    const response = await apiClient.post(
      `${FINANCE_API_BASE_URL}/cash-report/upload-statements/${sessionId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading bank statements:', error);
    throw error;
  }
};

/**
 * Run settlement (tất toán) automation on Movement data
 * @param {string} sessionId - Session ID
 * @returns {Promise} Settlement result with counter entries created
 */
export const runSettlementAutomation = async (sessionId) => {
  try {
    const response = await apiClient.post(
      `${FINANCE_API_BASE_URL}/cash-report/run-settlement/${sessionId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error running settlement:', error);
    throw error;
  }
};

/**
 * Get session status
 * @param {string} sessionId - Session ID
 * @returns {Promise} Session status with config and statistics
 */
export const getAutomationSessionStatus = async (sessionId) => {
  try {
    const response = await apiClient.get(
      `${FINANCE_API_BASE_URL}/cash-report/session/${sessionId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error getting session status:', error);
    throw error;
  }
};

/**
 * Download session result
 * @param {string} sessionId - Session ID
 * @returns {Promise<{blob: Blob, filename: string}>} Blob and filename for download
 */
export const downloadAutomationResult = async (sessionId) => {
  try {
    const response = await apiClient.get(
      `${FINANCE_API_BASE_URL}/cash-report/download/${sessionId}`,
      {
        responseType: 'blob',
      }
    );
    const contentDisposition = response.headers['content-disposition'];
    let filename = `Cash_Report_${sessionId.substring(0, 8)}.xlsx`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename=(.+)/);
      if (match) {
        filename = match[1].replace(/"/g, '');
      }
    }
    return { blob: response.data, filename };
  } catch (error) {
    console.error('Error downloading result:', error);
    throw error;
  }
};

/**
 * Reset session to clean state
 * @param {string} sessionId - Session ID
 * @returns {Promise} Reset result
 */
export const resetAutomationSession = async (sessionId) => {
  try {
    const response = await apiClient.post(
      `${FINANCE_API_BASE_URL}/cash-report/reset/${sessionId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error resetting session:', error);
    throw error;
  }
};

/**
 * Delete session
 * @param {string} sessionId - Session ID
 * @returns {Promise} Delete result
 */
export const deleteAutomationSession = async (sessionId) => {
  try {
    const response = await apiClient.delete(
      `${FINANCE_API_BASE_URL}/cash-report/session/${sessionId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};

/**
 * List all sessions
 * @returns {Promise} List of sessions
 */
export const listAutomationSessions = async () => {
  try {
    const response = await apiClient.get(
      `${FINANCE_API_BASE_URL}/cash-report/sessions`
    );
    return response.data;
  } catch (error) {
    console.error('Error listing sessions:', error);
    throw error;
  }
};

/**
 * Preview Movement data for a session
 * @param {string} sessionId - Session ID
 * @param {number} limit - Number of rows to preview (default: 20)
 * @returns {Promise} Preview data
 */
/**
 * Stream upload progress events via SSE
 * @param {string} sessionId - Session ID
 * @returns {EventSource} SSE connection
 */
export const streamUploadProgress = (sessionId) => {
  return new EventSource(
    `${FINANCE_API_BASE_URL}/cash-report/upload-progress/${sessionId}`
  );
};

export const previewMovementData = async (sessionId, limit = 20) => {
  try {
    const response = await apiClient.get(
      `${FINANCE_API_BASE_URL}/cash-report/preview/${sessionId}`,
      { params: { limit } }
    );
    return response.data;
  } catch (error) {
    console.error('Error previewing data:', error);
    throw error;
  }
};
