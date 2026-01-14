import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Cog6ToothIcon,
  CheckIcon,
  DocumentTextIcon,
  BanknotesIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  TableCellsIcon,
  BoltIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@configs/AuthProvider";
import { useSettings } from "@configs/SettingsProvider";
import { settingsApi } from "@services/settings/settings-apis";

export default function AdminCases() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { refreshFeatures } = useSettings();
  const [loading, setLoading] = useState(false);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [expandedFeature, setExpandedFeature] = useState(null);

  const [caseFeatures, setCaseFeatures] = useState({
    bankStatementOcr: {
      enabled: true,
      disabledMessage: "Bank Statement OCR is temporarily unavailable. Please contact Admin for assistance.",
    },
    contractOcr: {
      enabled: true,
      disabledMessage: "Contract OCR is temporarily unavailable. Please contact Admin for assistance.",
    },
    varianceAnalysis: {
      enabled: true,
      disabledMessage: "Variance Analysis is temporarily unavailable. Please contact Admin for assistance.",
    },
    glaAnalysis: {
      enabled: true,
      disabledMessage: "GLA Analysis is temporarily unavailable. Please contact Admin for assistance.",
    },
    excelComparison: {
      enabled: true,
      disabledMessage: "Excel Comparison is temporarily unavailable. Please contact Admin for assistance.",
    },
    utilityBilling: {
      enabled: true,
      disabledMessage: "Utility Billing is temporarily unavailable. Please contact Admin for assistance.",
    },
  });

  useEffect(() => {
    document.title = "Feature Management - Admin";
    loadFeatureToggles();
  }, []);

  const loadFeatureToggles = async () => {
    try {
      setLoadingFeatures(true);
      setError(null);
      const response = await settingsApi.getFeatureToggles();
      if (response.data) {
        setCaseFeatures(response.data);
      }
    } catch (err) {
      console.error("Failed to load feature toggles:", err);
      setError("Failed to load feature settings. Using default values.");
    } finally {
      setLoadingFeatures(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await settingsApi.updateFeatureToggles(accessToken, caseFeatures);
      await refreshFeatures();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = (featureKey) => {
    setCaseFeatures((prev) => ({
      ...prev,
      [featureKey]: {
        ...prev[featureKey],
        enabled: !prev[featureKey].enabled,
      },
    }));
  };

  const handleMessageChange = (featureKey, message) => {
    setCaseFeatures((prev) => ({
      ...prev,
      [featureKey]: {
        ...prev[featureKey],
        disabledMessage: message,
      },
    }));
  };

  const caseFeaturesList = [
    { key: "bankStatementOcr", label: "Bank Statement OCR", icon: BanknotesIcon },
    { key: "contractOcr", label: "Contract OCR", icon: DocumentTextIcon },
    { key: "varianceAnalysis", label: "Variance Analysis", icon: ChartBarIcon },
    { key: "glaAnalysis", label: "GLA Analysis", icon: TableCellsIcon },
    { key: "excelComparison", label: "Excel Comparison", icon: DocumentDuplicateIcon },
    { key: "utilityBilling", label: "Utility Billing", icon: BoltIcon },
  ];

  // Count enabled/disabled features
  const enabledCount = Object.values(caseFeatures).filter((f) => f.enabled).length;
  const disabledCount = Object.values(caseFeatures).filter((f) => !f.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Feature Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Enable or disable data processing features for all users
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading || loadingFeatures}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : saved ? (
            <CheckIcon className="w-5 h-5" />
          ) : (
            <Cog6ToothIcon className="w-5 h-5" />
          )}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Features</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{caseFeaturesList.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-600">{enabledCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Disabled</p>
          <p className="text-2xl font-bold text-red-600">{disabledCount}</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-600"
          >
            &times;
          </button>
        </motion.div>
      )}

      {/* Feature Cards */}
      {loadingFeatures ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border-2 border-gray-200 dark:border-gray-700 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {caseFeaturesList.map((feature, index) => {
            const featureData = caseFeatures[feature.key];
            const isExpanded = expandedFeature === feature.key;

            return (
              <motion.div
                key={feature.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border-2 transition-all ${
                  featureData.enabled
                    ? "border-green-200 dark:border-green-800"
                    : "border-red-200 dark:border-red-800"
                }`}
              >
                {/* Summary Card - Always Visible */}
                <button
                  onClick={() => setExpandedFeature(isExpanded ? null : feature.key)}
                  className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-lg ${
                          featureData.enabled
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-red-100 dark:bg-red-900/30"
                        }`}
                      >
                        <feature.icon
                          className={`w-5 h-5 ${
                            featureData.enabled
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {feature.label}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              featureData.enabled ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span
                            className={`text-xs font-medium ${
                              featureData.enabled
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {featureData.enabled ? "Active" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded Settings */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50"
                  >
                    {/* Toggle */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Feature Status
                      </span>
                      <button
                        onClick={() => handleFeatureToggle(feature.key)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          featureData.enabled ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            featureData.enabled ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Disabled Message */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <PencilSquareIcon className="w-4 h-4" />
                        Message when disabled
                      </label>
                      <textarea
                        value={featureData.disabledMessage}
                        onChange={(e) => handleMessageChange(feature.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                        rows={3}
                        placeholder="Enter message to show when feature is disabled..."
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        This message will be shown to users when they try to access this feature.
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
