import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ExclamationTriangleIcon, HomeIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useSettings } from "@configs/SettingsProvider";

/**
 * FeatureGate component that checks if a feature is enabled.
 * If disabled, shows a message to the user instead of the feature content.
 *
 * @param {string} featureKey - The feature key to check (e.g., 'bankStatementOcr')
 * @param {React.ReactNode} children - The feature content to render if enabled
 */
export default function FeatureGate({ featureKey, children }) {
  const { t } = useTranslation();
  const { isFeatureEnabled, getFeatureDisabledMessage, loading } = useSettings();

  // Show loading skeleton while checking feature status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">{t("Loading...")}</p>
        </div>
      </div>
    );
  }

  // Check if feature is enabled
  const enabled = isFeatureEnabled(featureKey);

  if (!enabled) {
    const disabledMessage = getFeatureDisabledMessage(featureKey);

    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-6">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {t("Feature Unavailable")}
            </h2>

            {/* Message */}
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {disabledMessage}
            </p>

            {/* Back to Home Button */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <HomeIcon className="w-5 h-5" />
              {t("Back to Home")}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Feature is enabled, render children
  return <>{children}</>;
}
