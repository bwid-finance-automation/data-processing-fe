import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@configs/AuthProvider";

/**
 * ProtectedRoute - Wraps routes that require authentication
 *
 * Usage:
 *   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 *   <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
 */
const ProtectedRoute = ({
  children,
  requiredRole = null,
  fallbackPath = "/login"
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const hasShownToast = useRef(false);

  // Show toast when redirecting to login
  useEffect(() => {
    if (!loading && !isAuthenticated && !hasShownToast.current) {
      hasShownToast.current = true;
      toast(t("Please login to use this feature").toUpperCase(), {
        duration: 4000,
        unstyled: true,
        className: "flex items-center justify-center px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg",
        style: { backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' },
      });
    }
  }, [loading, isAuthenticated, t]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to={fallbackPath}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Check role if required
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access this page.
            Required role: <span className="font-semibold">{requiredRole}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if user is active
  if (!user?.is_active) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Account Deactivated
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your account has been deactivated. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
