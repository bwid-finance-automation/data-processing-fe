import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "@services/auth/auth-apis";
import { getGoogleRedirectUri, withGoogleRedirectUri } from "@utils/google-oauth";

const AuthContext = createContext(undefined);

const getStoredAuth = () => {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const userStr = localStorage.getItem("user");

  if (accessToken && refreshToken && userStr) {
    try {
      return {
        accessToken,
        refreshToken,
        user: JSON.parse(userStr),
        isAuthenticated: true,
      };
    } catch {
      return null;
    }
  }
  return null;
};

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => getStoredAuth() || {
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
  });
  const [initializing, setInitializing] = useState(true); // Only for initial session check
  const [loading, setLoading] = useState(false); // For login/logout operations
  const [error, setError] = useState(null);

  // Store tokens in localStorage
  const storeAuth = useCallback((tokens) => {
    localStorage.setItem("accessToken", tokens.access_token);
    localStorage.setItem("refreshToken", tokens.refresh_token);
    localStorage.setItem("user", JSON.stringify(tokens.user));

    setAuth({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user: tokens.user,
      isAuthenticated: true,
    });
    setError(null);
  }, []);

  // Clear stored auth
  const clearAuth = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setAuth({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
    setError(null);
  }, []);

  // Login with username/password
  const handleLogin = useCallback(async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authApi.login(username, password);
      storeAuth(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeAuth]);

  // Get Google OAuth URL
  const getGoogleAuthUrl = useCallback(async () => {
    try {
      const response = await authApi.getGoogleAuthUrl();
      return withGoogleRedirectUri(response.data.authorization_url, getGoogleRedirectUri());
    } catch (err) {
      setError("Failed to get Google login URL");
      throw err;
    }
  }, []);

  // Handle Google callback
  const handleGoogleCallback = useCallback(async (code, redirectUri = getGoogleRedirectUri()) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authApi.googleCallback(code, redirectUri);
      storeAuth(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeAuth]);

  // Refresh tokens
  const refreshTokens = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      clearAuth();
      return false;
    }

    try {
      const response = await authApi.refreshToken(refreshToken);
      storeAuth(response.data);
      return true;
    } catch (err) {
      clearAuth();
      return false;
    }
  }, [storeAuth, clearAuth]);

  // Logout
  const logout = useCallback(async (logoutAll = false) => {
    try {
      if (auth.accessToken) {
        await authApi.logout(auth.accessToken, {
          refreshToken: auth.refreshToken,
          logoutAll,
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearAuth();
    }
  }, [auth.accessToken, auth.refreshToken, clearAuth]);

  // Listen for session-expired events from axios interceptors (auto-logout)
  useEffect(() => {
    const handleSessionExpired = () => {
      setAuth({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      });
      setError(null);
      // Redirect to login if not already there
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  // Verify session on mount
  useEffect(() => {
    const verifySession = async () => {
      const stored = getStoredAuth();
      if (stored) {
        try {
          const response = await authApi.getMe(stored.accessToken);
          setAuth({
            ...stored,
            user: response.data,
            isAuthenticated: true,
          });
          localStorage.setItem("user", JSON.stringify(response.data));
        } catch (err) {
          if (err.response?.status === 401) {
            // Try refresh
            const refreshed = await refreshTokens();
            if (!refreshed) {
              clearAuth();
            }
          } else {
            // Other error - keep existing auth state
            console.error("Session verification error:", err);
          }
        }
      }
      setInitializing(false);
    };

    verifySession();
  }, [refreshTokens, clearAuth]);

  // Show loading state only during initial session verification
  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        loading,
        error,
        handleLogin,
        getGoogleAuthUrl,
        handleGoogleCallback,
        refreshTokens,
        logout,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default AuthProvider;
