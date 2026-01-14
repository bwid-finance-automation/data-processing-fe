import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { settingsApi } from "@services/settings/settings-apis";

const SettingsContext = createContext(undefined);

// Default feature toggles (fallback if API fails)
const defaultFeatures = {
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
};

const SettingsProvider = ({ children }) => {
  const [features, setFeatures] = useState(defaultFeatures);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load feature toggles from API
  const loadFeatures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsApi.getFeatureToggles();
      if (response.data) {
        setFeatures(response.data);
      }
    } catch (err) {
      console.error("Failed to load feature settings:", err);
      setError("Failed to load feature settings");
      // Keep default features on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload features (useful after admin updates)
  const refreshFeatures = useCallback(async () => {
    await loadFeatures();
  }, [loadFeatures]);

  // Check if a specific feature is enabled
  const isFeatureEnabled = useCallback((featureKey) => {
    const feature = features[featureKey];
    return feature?.enabled ?? true;
  }, [features]);

  // Get disabled message for a feature
  const getFeatureDisabledMessage = useCallback((featureKey) => {
    const feature = features[featureKey];
    if (!feature?.enabled) {
      return feature?.disabledMessage || "This feature is temporarily unavailable. Please contact Admin for assistance.";
    }
    return null;
  }, [features]);

  // Load features on mount
  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  return (
    <SettingsContext.Provider
      value={{
        features,
        loading,
        error,
        isFeatureEnabled,
        getFeatureDisabledMessage,
        refreshFeatures,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
};

export default SettingsProvider;
