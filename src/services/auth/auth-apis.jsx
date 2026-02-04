import axios from 'axios';
import { applyAuthInterceptors } from '@utils/auth-manager';

// Auth API base URL (same base as other APIs)
const resolveBaseUrl = () => {
  const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').trim();
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && rawBaseUrl.startsWith('http://')) {
    return rawBaseUrl.replace(/^http:\/\//, 'https://');
  }
  return rawBaseUrl;
};

const AUTH_API_BASE_URL = `${resolveBaseUrl()}/auth`;

// Create auth API client
const authApiClient = axios.create({
  baseURL: AUTH_API_BASE_URL,
  timeout: 30000, // 30 seconds for auth requests
});

// Apply centralized auth interceptors, skipping refresh for auth-specific endpoints
applyAuthInterceptors(authApiClient, ['/login', '/google/callback', '/refresh', '/google/url', '/config']);

/**
 * Authentication API functions
 */
export const authApi = {
  /**
   * Login with username and password
   * @param {string} username - Username or email
   * @param {string} password - Password
   * @returns {Promise} - Response with access_token, refresh_token, and user
   */
  login: (username, password) => {
    return authApiClient.post('/login', {
      username,
      password,
    });
  },

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

  // ==================== Admin APIs ====================

  /**
   * List all users (Admin only)
   * @param {string} accessToken - Access token for authorization
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.pageSize - Items per page
   * @param {string} params.search - Search term
   * @param {string} params.role - Filter by role
   * @param {boolean} params.isActive - Filter by active status
   * @returns {Promise} - Response with users list and pagination
   */
  listUsers: (accessToken, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('page_size', params.pageSize);
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    if (params.isActive !== undefined) queryParams.append('is_active', params.isActive);

    return authApiClient.get(`/admin/users?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  /**
   * Get user by UUID (Admin only)
   * @param {string} accessToken - Access token
   * @param {string} userUuid - User UUID
   * @returns {Promise}
   */
  getUser: (accessToken, userUuid) => {
    return authApiClient.get(`/admin/users/${userUuid}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  /**
   * Update user role (Admin only)
   * @param {string} accessToken - Access token
   * @param {string} userUuid - User UUID
   * @param {string} role - New role ('user' or 'admin')
   * @returns {Promise}
   */
  updateUserRole: (accessToken, userUuid, role) => {
    return authApiClient.patch(
      `/admin/users/${userUuid}/role`,
      { role },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  },

  /**
   * Update user status (Admin only)
   * @param {string} accessToken - Access token
   * @param {string} userUuid - User UUID
   * @param {boolean} isActive - New active status
   * @returns {Promise}
   */
  updateUserStatus: (accessToken, userUuid, isActive) => {
    return authApiClient.patch(
      `/admin/users/${userUuid}/status`,
      { is_active: isActive },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  },

  /**
   * Revoke all sessions for a user (Admin only)
   * @param {string} accessToken - Access token
   * @param {string} userUuid - User UUID
   * @returns {Promise}
   */
  revokeUserSessions: (accessToken, userUuid) => {
    return authApiClient.delete(`/admin/users/${userUuid}/sessions`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
};

export default authApi;
