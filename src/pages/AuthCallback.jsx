import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@configs/AuthProvider";
import { getGoogleRedirectUri } from "@utils/google-oauth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleGoogleCallback } = useAuth();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("Processing...");
  const processedRef = useRef(false);

  useEffect(() => {
    document.title = "Authenticating... - BW Industrial";
  }, []);

  useEffect(() => {
    // Prevent React StrictMode from calling twice
    if (processedRef.current) return;
    processedRef.current = true;

    const processCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setError(`Google authentication failed: ${errorParam}`);
        setStatus("Authentication failed");
        return;
      }

      if (!code) {
        setError("No authorization code received from Google");
        setStatus("Authentication failed");
        return;
      }

      try {
        setStatus("Authenticating with Google...");
        await handleGoogleCallback(code, getGoogleRedirectUri());
        setStatus("Success! Redirecting...");

        // Small delay to show success message
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 500);
      } catch (err) {
        const errorMessage = err.response?.data?.detail || "Authentication failed. Please try again.";
        setError(errorMessage);
        setStatus("Authentication failed");
      }
    };

    processCallback();
  }, [searchParams, handleGoogleCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full text-center"
      >
        {error ? (
          <>
            {/* Error State */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Authentication Failed
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            {/* Loading State */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {status}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we complete your authentication.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
