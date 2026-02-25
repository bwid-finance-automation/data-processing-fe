import { aiUsageApiClient } from '../../configs/APIs';

/**
 * Get AI usage dashboard data with aggregated statistics
 * @param {Object} params - Query parameters
 * @param {number} params.project_id - Optional project ID filter
 * @param {number} params.days - Number of days for daily stats (default: 30)
 * @returns {Promise} Dashboard data with stats, by_provider, by_task_type, daily_usage, recent_logs
 */
export const getAIUsageDashboard = async (params = {}) => {
  try {
    const response = await aiUsageApiClient.get('/dashboard', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching AI usage dashboard:', error);
    throw error;
  }
};

/**
 * Get aggregated AI usage statistics
 * @param {Object} params - Query parameters
 * @param {number} params.project_id - Optional project ID filter
 * @param {number} params.case_id - Optional case ID filter
 * @param {string} params.start_date - Start date filter (ISO format)
 * @param {string} params.end_date - End date filter (ISO format)
 * @returns {Promise} Aggregated statistics
 */
export const getAIUsageStats = async (params = {}) => {
  try {
    const response = await aiUsageApiClient.get('/stats', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching AI usage stats:', error);
    throw error;
  }
};

/**
 * Get AI usage logs with filtering and pagination
 * @param {Object} params - Query parameters
 * @param {number} params.project_id - Optional project ID filter
 * @param {number} params.case_id - Optional case ID filter
 * @param {string} params.provider - Optional provider filter (gemini, openai, etc.)
 * @param {string} params.task_type - Optional task type filter (ocr, parsing, etc.)
 * @param {boolean} params.success - Optional success status filter
 * @param {string} params.start_date - Start date filter (ISO format)
 * @param {string} params.end_date - End date filter (ISO format)
 * @param {number} params.skip - Number of records to skip (default: 0)
 * @param {number} params.limit - Maximum number of records (default: 50)
 * @returns {Promise} Paginated list of usage logs
 */
export const getAIUsageLogs = async (params = {}) => {
  try {
    const response = await aiUsageApiClient.get('/logs', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching AI usage logs:', error);
    throw error;
  }
};

/**
 * Get a single AI usage log by ID
 * @param {number} logId - Log ID
 * @returns {Promise} Single usage log
 */
export const getAIUsageLog = async (logId) => {
  try {
    const response = await aiUsageApiClient.get(`/logs/${logId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching AI usage log:', error);
    throw error;
  }
};

/**
 * Get AI usage aggregated by provider
 * @param {Object} params - Query parameters
 * @param {number} params.project_id - Optional project ID filter
 * @param {string} params.start_date - Start date filter (ISO format)
 * @param {string} params.end_date - End date filter (ISO format)
 * @returns {Promise} Usage by provider
 */
export const getAIUsageByProvider = async (params = {}) => {
  try {
    const response = await aiUsageApiClient.get('/by-provider', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching AI usage by provider:', error);
    throw error;
  }
};

/**
 * Get AI usage aggregated by task type
 * @param {Object} params - Query parameters
 * @param {number} params.project_id - Optional project ID filter
 * @param {string} params.start_date - Start date filter (ISO format)
 * @param {string} params.end_date - End date filter (ISO format)
 * @returns {Promise} Usage by task type
 */
export const getAIUsageByTaskType = async (params = {}) => {
  try {
    const response = await aiUsageApiClient.get('/by-task-type', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching AI usage by task type:', error);
    throw error;
  }
};

/**
 * Get AI usage aggregated by user
 * @param {Object} params - Query parameters
 * @param {string} params.start_date - Start date filter (ISO format)
 * @param {string} params.end_date - End date filter (ISO format)
 * @returns {Promise} Usage by user
 */
export const getAIUsageByUser = async (params = {}) => {
  try {
    const response = await aiUsageApiClient.get('/by-user', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching AI usage by user:', error);
    throw error;
  }
};

/**
 * Get daily AI usage statistics
 * @param {Object} params - Query parameters
 * @param {number} params.project_id - Optional project ID filter
 * @param {number} params.days - Number of days (default: 30)
 * @returns {Promise} Daily usage statistics
 */
export const getAIUsageDaily = async (params = {}) => {
  try {
    const response = await aiUsageApiClient.get('/daily', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching daily AI usage:', error);
    throw error;
  }
};

/**
 * Format token count for display
 * @param {number} tokens - Token count
 * @returns {string} Formatted token count
 */
export const formatTokens = (tokens) => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toLocaleString();
};

/**
 * Format cost for display
 * @param {number} cost - Cost in USD
 * @returns {string} Formatted cost
 */
export const formatCost = (cost) => {
  if (cost < 0.0001) {
    return `$${cost.toFixed(6)}`;
  } else if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
};

/**
 * Map task_type to readable case name
 * @param {string} taskType - Task type from API
 * @returns {string} Readable case name
 */
export const formatCaseName = (taskType) => {
  const caseNames = {
    'ocr': 'Bank Statement / Contract OCR',
    'parsing': 'Bank Statement',
    'contract_ocr': 'Contract OCR',
    'classification': 'Cash Report',
    'analysis': 'Variance Analysis',
    'gla': 'GLA Variance',
    'chat': 'Chat',
    'other': 'Other',
  };
  return caseNames[taskType] || taskType;
};

/**
 * Format processing time for display
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time
 */
export const formatProcessingTime = (ms) => {
  if (ms >= 60000) {
    return `${(ms / 60000).toFixed(1)}m`;
  } else if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${ms.toFixed(0)}ms`;
};
