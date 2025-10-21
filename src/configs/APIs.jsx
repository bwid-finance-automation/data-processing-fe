import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').trim();

//FA API
export const FINANCE_API_BASE_URL = `${BASE_URL}/finance`;

// FP&A API 
export const FPA_API_BASE_URL = `${BASE_URL}/fpa`;

// Debug: Log API URLs in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:');
  console.log('  BASE_URL:', BASE_URL);
  console.log('  FINANCE_API_BASE_URL:', FINANCE_API_BASE_URL);
  console.log('  FPA_API_BASE_URL:', FPA_API_BASE_URL);
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

// Legacy exports for backward compatibility (to be removed)
export const varianceApiClient = apiClient;
export const contractOcrApiClient = apiClient;
export const API_BASE_URL = FINANCE_API_BASE_URL; // For backward compatibility
export const API_ENDPOINTS = {
  VARIANCE: FINANCE_API_BASE_URL,
  CONTRACT_OCR: FINANCE_API_BASE_URL,
  FPA: FPA_API_BASE_URL,
};

// Request interceptor (optional - for adding auth tokens, logging, etc.)
const requestInterceptor = (config) => {
  // Add any common headers or auth tokens here
  return config;
};

// Response interceptor (optional - for error handling)
const responseInterceptor = (response) => {
  return response;
};

const errorInterceptor = (error) => {
  // Handle common errors here
  console.error('API Error:', error);
  return Promise.reject(error);
};

// Apply interceptors to both clients
apiClient.interceptors.request.use(requestInterceptor);
apiClient.interceptors.response.use(responseInterceptor, errorInterceptor);

fpaApiClient.interceptors.request.use(requestInterceptor);
fpaApiClient.interceptors.response.use(responseInterceptor, errorInterceptor);

export default {
  apiClient,
  varianceApiClient, // Legacy export
  contractOcrApiClient, // Legacy export
  API_ENDPOINTS, // Legacy export
  API_BASE_URL,
};
