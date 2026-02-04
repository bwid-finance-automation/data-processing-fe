import axios from 'axios';
import { applyAuthInterceptors } from '@utils/auth-manager';

// Settings API base URL
const resolveBaseUrl = () => {
  const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').trim();
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && rawBaseUrl.startsWith('http://')) {
    return rawBaseUrl.replace(/^http:\/\//, 'https://');
  }
  return rawBaseUrl;
};

const SETTINGS_API_BASE_URL = `${resolveBaseUrl()}/settings`;

// Create settings API client
const settingsApiClient = axios.create({
  baseURL: SETTINGS_API_BASE_URL,
  timeout: 30000,
});

// Apply centralized auth interceptors (token injection + 401 refresh + auto-logout)
applyAuthInterceptors(settingsApiClient);

/**
 * System Settings API functions
 */
export const settingsApi = {
  /**
   * Get all feature toggles (public endpoint)
   * @returns {Promise} - Response with all feature toggles
   */
  getFeatureToggles: () => {
    return settingsApiClient.get('/features');
  },

  /**
   * Get a specific feature's status
   * @param {string} featureKey - The feature key (e.g., 'bankStatementOcr')
   * @returns {Promise} - Response with feature status
   */
  getFeatureStatus: (featureKey) => {
    return settingsApiClient.get(`/features/${featureKey}`);
  },

  /**
   * Update all feature toggles (Admin only)
   * @param {string} accessToken - Access token for authorization
   * @param {Object} features - Feature toggles to update
   * @returns {Promise} - Response with updated feature toggles
   */
  updateFeatureToggles: (accessToken, features) => {
    return settingsApiClient.put('/features', features, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  /**
   * Update a single feature (Admin only)
   * @param {string} accessToken - Access token for authorization
   * @param {string} featureKey - The feature key
   * @param {boolean} enabled - Whether the feature is enabled
   * @param {string} disabledMessage - Message to show when disabled
   * @returns {Promise}
   */
  updateFeature: (accessToken, featureKey, enabled, disabledMessage = null) => {
    const params = new URLSearchParams();
    params.append('enabled', enabled);
    if (disabledMessage) {
      params.append('disabled_message', disabledMessage);
    }

    return settingsApiClient.patch(`/features/${featureKey}?${params.toString()}`, null, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
};

export default settingsApi;
