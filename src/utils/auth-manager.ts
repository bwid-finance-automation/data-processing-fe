/**
 * Centralized authentication manager.
 *
 * Handles token refresh with request queuing (prevents race conditions)
 * and dispatches a DOM event when the session expires so AuthProvider
 * can react and update React state.
 */
import axios from 'axios';

const resolveBaseUrl = () => {
  const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').trim();
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && rawBaseUrl.startsWith('http://')) {
    return rawBaseUrl.replace(/^http:\/\//, 'https://');
  }
  return rawBaseUrl;
};

// Dedicated axios instance for refresh only (no interceptors to avoid loops)
const refreshClient = axios.create({
  baseURL: `${resolveBaseUrl()}/auth`,
  timeout: 15000,
});

// ── Refresh queue ──────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

/**
 * Clear all auth data from localStorage and notify the app.
 * Components listening for `auth:session-expired` will handle UI updates.
 */
export const forceLogout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new CustomEvent('auth:session-expired'));
};

/**
 * Attempt to refresh the access token.
 * - Deduplicates concurrent calls (queue pattern).
 * - Calls `forceLogout()` when refresh fails.
 *
 * @returns {Promise<string>} The new access token.
 */
const refreshAccessToken = () => {
  if (isRefreshing) {
    // Another refresh is in flight – queue this caller
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    isRefreshing = false;
    forceLogout();
    return Promise.reject(new Error('No refresh token'));
  }

  return refreshClient
    .post('/refresh', { refresh_token: refreshToken })
    .then(({ data }) => {
      const { access_token, refresh_token } = data;
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      processQueue(null, access_token);
      return access_token;
    })
    .catch((err) => {
      processQueue(err);
      forceLogout();
      return Promise.reject(err);
    })
    .finally(() => {
      isRefreshing = false;
    });
};

// ── Shared interceptors ────────────────────────────────────────────

/**
 * Request interceptor – attaches the current access token.
 */
export const authRequestInterceptor = (config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

/**
 * Factory that returns an error interceptor for a given axios instance.
 * Handles 401 → refresh → retry, or force-logout on failure.
 *
 * @param {import('axios').AxiosInstance} client  The axios instance to retry on.
 * @param {string[]} [skipPaths]  URL substrings that should NOT trigger refresh
 *                                (e.g. login, refresh endpoints).
 */
export const createAuthErrorInterceptor = (client, skipPaths = []) => {
  return async (error) => {
    const originalRequest = error.config;
    const shouldSkip = skipPaths.some((p) => originalRequest.url?.includes(p));

    if (error.response?.status === 401 && !originalRequest._retry && !shouldSkip) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch {
        // refreshAccessToken already called forceLogout
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  };
};

/**
 * Convenience: apply both request + error interceptors to a client.
 */
export const applyAuthInterceptors = (client, skipPaths = []) => {
  client.interceptors.request.use(authRequestInterceptor);
  client.interceptors.response.use(
    (response) => response,
    createAuthErrorInterceptor(client, skipPaths),
  );
};
