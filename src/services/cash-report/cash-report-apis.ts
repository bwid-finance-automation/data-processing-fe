import { apiClient, FINANCE_API_BASE_URL } from '../../configs/APIs';

/**
 * Initialize a new cash report session
 * @param {Object} config - Session configuration
 * @param {string} config.openingDate - Report period start date (YYYY-MM-DD)
 * @param {string} config.endingDate - Report period end date (YYYY-MM-DD)
 * @param {string} config.periodName - Period name (e.g., "W3-4Jan26")
 * @param {File|null} config.templateFile - Optional user-uploaded .xlsx template.
 *   When provided, the system uses this file as the base and immediately runs:
 *   (1) update Summary dates/FX/period, (2) copy Cash Balance → Prior Period,
 *   (3) clear Movement sheet.
 * @returns {Promise} Session info with session_id and movement_prepared flag
 */
export const initAutomationSession = async (config) => {
  const formData = new FormData();
  formData.append('opening_date', config.openingDate);
  formData.append('ending_date', config.endingDate);
  if (config.periodName) {
    formData.append('period_name', config.periodName);
  }
  if (config.templateFile) {
    formData.append('template_file', config.templateFile);
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
  formData.append('filter_by_date', String(filterByDate));

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
 * Upload Movement Netsuite & Manual file to a session
 * Pre-classified transactions (no AI needed). Filters out "Automation" rows.
 * @param {string} sessionId - Session ID
 * @param {File} file - Movement NS/Manual Excel file
 * @param {boolean} filterByDate - Filter transactions by session date range (default: true)
 * @returns {Promise} Upload result with transaction counts
 */
export const uploadMovementFile = async (sessionId, file, filterByDate = true) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filter_by_date', String(filterByDate));

  try {
    const response = await apiClient.post(
      `${FINANCE_API_BASE_URL}/cash-report/upload-movement/${sessionId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading Movement file:', error);
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
 * @param {string} [step] - Optional step name: "settlement" or "open_new".
 *   If omitted, downloads the latest version.
 * @returns {Promise<{blob: Blob, filename: string}>} Blob and filename for download
 */
export const downloadAutomationResult = async (sessionId, step) => {
  try {
    const params = step ? { step } : {};
    const response = await apiClient.get(
      `${FINANCE_API_BASE_URL}/cash-report/download/${sessionId}`,
      {
        responseType: 'blob',
        params,
      }
    );
    const contentDisposition = response.headers['content-disposition'];
    const suffix = step ? `_${step}` : '';
    let filename = `Cash_Report_${sessionId.substring(0, 8)}${suffix}.xlsx`;
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

/**
 * Stream settlement progress events via SSE
 * @param {string} sessionId - Session ID
 * @returns {EventSource} SSE connection
 */
export const streamSettlementProgress = (sessionId) => {
  return new EventSource(
    `${FINANCE_API_BASE_URL}/cash-report/settlement-progress/${sessionId}`
  );
};

/**
 * Run open-new (mở mới) automation on Movement data
 * Detects transactions that transfer money FROM current account TO saving account
 * and creates counter entries with Nature = "Internal transfer in"
 * @param {string} sessionId - Session ID
 * @param {File[]} lookupFiles - Optional lookup files (VTB Saving style Excel) for account matching
 * @returns {Promise} Open-new result with counter entries created
 */
export const runOpenNewAutomation = async (sessionId, lookupFiles = []) => {
  try {
    const formData = new FormData();
    if (lookupFiles && lookupFiles.length > 0) {
      lookupFiles.forEach((file) => {
        formData.append('lookup_files', file);
      });
    }

    const response = await apiClient.post(
      `${FINANCE_API_BASE_URL}/cash-report/run-open-new/${sessionId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error running open-new automation:', error);
    throw error;
  }
};

/**
 * Stream open-new automation progress events via SSE
 * @param {string} sessionId - Session ID
 * @returns {EventSource} SSE connection
 */
export const streamOpenNewProgress = (sessionId) => {
  return new EventSource(
    `${FINANCE_API_BASE_URL}/cash-report/open-new-progress/${sessionId}`
  );
};

/**
 * Dry-run settlement: detect + lookup without writing to Excel.
 * Returns candidate preview data (what would happen if you run settlement).
 * @param {string} sessionId - Session ID
 * @returns {Promise} Preview data with candidates list
 */
export const previewSettlement = async (sessionId) => {
  try {
    const response = await apiClient.get(
      `${FINANCE_API_BASE_URL}/cash-report/preview-settlement/${sessionId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error previewing settlement:', error);
    throw error;
  }
};

/**
 * Dry-run open-new: detect + lookup without writing to Excel.
 * Returns candidate preview data (what would happen if you run open-new).
 * @param {string} sessionId - Session ID
 * @param {File[]} lookupFiles - Optional lookup files for account matching
 * @returns {Promise} Preview data with candidates list
 */
export const previewOpenNew = async (sessionId, lookupFiles = []) => {
  try {
    const formData = new FormData();
    if (lookupFiles && lookupFiles.length > 0) {
      lookupFiles.forEach((file) => {
        formData.append('lookup_files', file);
      });
    }
    const response = await apiClient.post(
      `${FINANCE_API_BASE_URL}/cash-report/preview-open-new/${sessionId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error previewing open-new:', error);
    throw error;
  }
};

/**
 * Upload files and get classification preview (does NOT write to Excel)
 * Call confirmClassifications() after user reviews the results
 * @param {string} sessionId - Session ID
 * @param {File[]} files - Parsed bank statement Excel files
 * @param {boolean} filterByDate - Filter by session date range
 * @returns {Promise} Preview with classified transactions and stats
 */
export const uploadAndPreview = async (sessionId, files, filterByDate = true) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  formData.append('filter_by_date', String(filterByDate));

  try {
    const response = await apiClient.post(
      `${FINANCE_API_BASE_URL}/cash-report/upload-preview/${sessionId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading preview:', error);
    throw error;
  }
};

/**
 * Confirm and write pending classifications to Excel
 * @param {string} sessionId - Session ID
 * @param {Array<{index: number, nature: string}>} modifications - Optional overrides
 * @returns {Promise} Write result
 */
export const confirmClassifications = async (sessionId, modifications = null) => {
  const formData = new FormData();
  if (modifications && modifications.length > 0) {
    formData.append('modifications', JSON.stringify(modifications));
  }

  try {
    const response = await apiClient.post(
      `${FINANCE_API_BASE_URL}/cash-report/confirm-upload/${sessionId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error confirming classifications:', error);
    throw error;
  }
};

/**
 * Run test automation (settlement + open-new) using pre-classified test template.
 * No AI calls needed. Creates a temporary test session.
 * @param {File[]} lookupFiles - Optional lookup files for open-new account matching
 * @returns {Promise} Combined settlement + open-new results with test_session_id for download
 */
export const runTestAutomation = async (lookupFiles = []) => {
  try {
    const formData = new FormData();
    if (lookupFiles && lookupFiles.length > 0) {
      lookupFiles.forEach((file) => {
        formData.append('lookup_files', file);
      });
    }

    const response = await apiClient.post(
      `${FINANCE_API_BASE_URL}/cash-report/run-test`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error running test automation:', error);
    throw error;
  }
};

/**
 * Download test automation result file
 * @param {string} testSessionId - Test session ID from runTestAutomation result
 * @returns {Promise<{blob: Blob, filename: string}>} Blob and filename
 */
export const downloadTestResult = async (testSessionId) => {
  try {
    const response = await apiClient.get(
      `${FINANCE_API_BASE_URL}/cash-report/download-test/${testSessionId}`,
      { responseType: 'blob' }
    );
    const contentDisposition = response.headers['content-disposition'];
    let filename = `Cash_Report_Test_${testSessionId}.xlsx`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename=(.+)/);
      if (match) {
        filename = match[1].replace(/"/g, '');
      }
    }
    return { blob: response.data, filename };
  } catch (error) {
    console.error('Error downloading test result:', error);
    throw error;
  }
};

/**
 * Stream test automation progress events via SSE
 * @returns {EventSource} SSE connection
 */
export const streamTestProgress = () => {
  return new EventSource(
    `${FINANCE_API_BASE_URL}/cash-report/test-progress`
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

