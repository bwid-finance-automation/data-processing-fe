import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { authApi } from "@services/auth/auth-apis";
import { getGoogleRedirectUri, withGoogleRedirectUri } from "@utils/google-oauth";

type AuthUser = {
  uuid?: string;
  email?: string;
  full_name?: string;
  given_name?: string;
  picture_url?: string;
  role?: string;
  is_active?: boolean;
  [key: string]: unknown;
} | null;

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser;
  isAuthenticated: boolean;
};

type AuthTokens = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

type AuthContextValue = AuthState & {
  loading: boolean;
  error: string | null;
  handleLogin: (username: string, password: string) => Promise<AuthTokens>;
  getGoogleAuthUrl: () => Promise<string>;
  handleGoogleCallback: (code: string, redirectUri?: string) => Promise<AuthTokens>;
  refreshTokens: () => Promise<boolean>;
  logout: (logoutAll?: boolean) => Promise<void>;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getStoredAuth = (): AuthState | null => {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const userStr = localStorage.getItem("user");

  if (accessToken && refreshToken && userStr) {
    try {
      return {
        accessToken,
        refreshToken,
        user: JSON.parse(userStr) as AuthUser,
        isAuthenticated: true,
      };
    } catch {
      return null;
    }
  }
  return null;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [auth, setAuth] = useState<AuthState>(() => getStoredAuth() || {
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
  });
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storeAuth = useCallback((tokens: AuthTokens) => {
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

  const handleLogin = useCallback(async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authApi.login(username, password);
      const tokens = response.data as AuthTokens;
      storeAuth(tokens);
      return tokens;
    } catch (err) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeAuth]);

  const getGoogleAuthUrl = useCallback(async () => {
    try {
      const response = await authApi.getGoogleAuthUrl();
      return withGoogleRedirectUri(response.data.authorization_url, getGoogleRedirectUri());
    } catch (err) {
      setError("Failed to get Google login URL");
      throw err;
    }
  }, []);

  const handleGoogleCallback = useCallback(async (code: string, redirectUri = getGoogleRedirectUri()) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authApi.googleCallback(code, redirectUri);
      const tokens = response.data as AuthTokens;
      storeAuth(tokens);
      return tokens;
    } catch (err) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeAuth]);

  const refreshTokens = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      clearAuth();
      return false;
    }

    try {
      const response = await authApi.refreshToken(refreshToken);
      const tokens = response.data as AuthTokens;
      storeAuth(tokens);
      return true;
    } catch {
      clearAuth();
      return false;
    }
  }, [storeAuth, clearAuth]);

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

  useEffect(() => {
    const handleSessionExpired = () => {
      setAuth({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      });
      setError(null);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      const stored = getStoredAuth();
      if (stored) {
        try {
          const response = await authApi.getMe(stored.accessToken);
          const userData = response.data as AuthUser;
          setAuth({
            ...stored,
            user: userData,
            isAuthenticated: true,
          });
          localStorage.setItem("user", JSON.stringify(userData));
        } catch (err) {
          if ((err as { response?: { status?: number } })?.response?.status === 401) {
            const refreshed = await refreshTokens();
            if (!refreshed) {
              clearAuth();
            }
          } else {
            console.error("Session verification error:", err);
          }
        }
      }
      setInitializing(false);
    };

    verifySession();
  }, [refreshTokens, clearAuth]);

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
