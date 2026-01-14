import axios from 'axios';

// Auth API base URL (same base as other APIs)
const resolveBaseUrl = () => {
  const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').trim();
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && rawBaseUrl.startsWith('http://')) {
    return rawBaseUrl.replace(/^http:\/\//, 'https://');
  }
  return rawBaseUrl;
};

const AUTH_API_BASE_URL = `${resolveBaseUrl()}/auth`;

// Create auth API client (without auth interceptor to avoid circular dependency)
const authApiClient = axios.create({
  baseURL: AUTH_API_BASE_URL,
  timeout: 30000, // 30 seconds for auth requests
});

/**
 * Authentication API functions
 */
export const authApi = {
  /**
   * Get Google OAuth authorization URL
   * @returns {Promise} - Response with authorization_url and state
   */
  getGoogleAuthUrl: () => {
    return authApiClient.get('/google/url');
  },

  /**
   * Exchange Google authorization code for tokens
   * @param {string} code - Authorization code from Google
   * @param {string} redirectUri - Optional redirect URI override
   * @returns {Promise} - Response with access_token, refresh_token, and user
   */
  googleCallback: (code, redirectUri = null) => {
    return authApiClient.post('/google/callback', {
      code,
      redirect_uri: redirectUri,
    });
  },

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Current refresh token
   * @returns {Promise} - Response with new tokens
   */
  refreshToken: (refreshToken) => {
    return authApiClient.post('/refresh', {
      refresh_token: refreshToken,
    });
  },

  /**
   * Logout user
   * @param {string} accessToken - Current access token for authorization
   * @param {Object} options - Logout options
   * @param {string} options.refreshToken - Specific token to revoke
   * @param {boolean} options.logoutAll - Logout from all devices
   * @returns {Promise}
   */
  logout: (accessToken, options = {}) => {
    return authApiClient.post(
      '/logout',
      {
        refresh_token: options.refreshToken,
        logout_all: options.logoutAll || false,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  },

  /**
   * Get current user profile
   * @param {string} accessToken - Access token for authorization
   * @returns {Promise} - Response with user profile
   */
  getMe: (accessToken) => {
    return authApiClient.get('/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  /**
   * Get user's active sessions
   * @param {string} accessToken - Access token for authorization
   * @returns {Promise} - Response with sessions list
   */
  getSessions: (accessToken) => {
    return authApiClient.get('/sessions', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  /**
   * Revoke a specific session
   * @param {string} accessToken - Access token for authorization
   * @param {string} sessionUuid - UUID of session to revoke
   * @returns {Promise}
   */
  revokeSession: (accessToken, sessionUuid) => {
    return authApiClient.delete(`/sessions/${sessionUuid}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  /**
   * Get auth configuration status
   * @returns {Promise} - Response with OAuth config status
   */
  getConfig: () => {
    return authApiClient.get('/config');
  },
};

export default authApi;
