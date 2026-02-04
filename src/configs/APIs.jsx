import axios from 'axios';
import { applyAuthInterceptors } from '@utils/auth-manager';

// Resolve base URL while preventing mixed-content issues in production
const resolveBaseUrl = () => {
  const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').trim();

  // If the site is served over HTTPS but the API URL is HTTP, upgrade to HTTPS to avoid mixed content
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && rawBaseUrl.startsWith('http://')) {
    return rawBaseUrl.replace(/^http:\/\//, 'https://');
  }

  return rawBaseUrl;
};

const BASE_URL = resolveBaseUrl();

//FA API
export const FINANCE_API_BASE_URL = `${BASE_URL}/finance`;

// FP&A API
export const FPA_API_BASE_URL = `${BASE_URL}/fpa`;

// Project API
export const PROJECT_API_BASE_URL = `${BASE_URL}/projects`;

// AI Usage API
export const AI_USAGE_API_BASE_URL = `${BASE_URL}/ai-usage`;

// Debug: Log API URLs in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:');
  console.log('  BASE_URL:', BASE_URL);
  console.log('  FINANCE_API_BASE_URL:', FINANCE_API_BASE_URL);
  console.log('  FPA_API_BASE_URL:', FPA_API_BASE_URL);
  console.log('  PROJECT_API_BASE_URL:', PROJECT_API_BASE_URL);
}

// Common axios configuration
const commonConfig = {
  timeout: 1800000, // 30 minutes for large file processing and AI OCR
};

// Create Finance API axios instance
export const apiClient = axios.create({
  baseURL: FINANCE_API_BASE_URL,
  ...commonConfig,
});

// Create FP&A API axios instance
export const fpaApiClient = axios.create({
  baseURL: FPA_API_BASE_URL,
  ...commonConfig,
});

// Create Project API axios instance
export const projectApiClient = axios.create({
  baseURL: PROJECT_API_BASE_URL,
  ...commonConfig,
});

// Create AI Usage API axios instance
export const aiUsageApiClient = axios.create({
  baseURL: AI_USAGE_API_BASE_URL,
  ...commonConfig,
});

// Legacy exports for backward compatibility (to be removed)
export const varianceApiClient = apiClient;
export const contractOcrApiClient = apiClient;
export const API_BASE_URL = FINANCE_API_BASE_URL; // For backward compatibility
export const API_ENDPOINTS = {
  VARIANCE: FINANCE_API_BASE_URL,
  CONTRACT_OCR: FINANCE_API_BASE_URL,
  FPA: FPA_API_BASE_URL,
};

// Auth API
export const AUTH_API_BASE_URL = `${BASE_URL}/auth`;

// Create Auth API axios instance
export const authApiClient = axios.create({
  baseURL: AUTH_API_BASE_URL,
  timeout: 30000, // 30 seconds for auth
});

// Apply centralized auth interceptors (token injection + 401 refresh + auto-logout)
applyAuthInterceptors(apiClient);
applyAuthInterceptors(fpaApiClient);
applyAuthInterceptors(projectApiClient);
applyAuthInterceptors(aiUsageApiClient);

export default {
  apiClient,
  fpaApiClient,
  projectApiClient,
  authApiClient,
  varianceApiClient, // Legacy export
  contractOcrApiClient, // Legacy export
  API_ENDPOINTS, // Legacy export
  API_BASE_URL,
  AUTH_API_BASE_URL,
};
