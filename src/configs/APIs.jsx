import axios from 'axios';

// API Base URL from environment variable
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Common axios configuration
const commonConfig = {
  timeout: 300000, // 5 minutes for large file processing
};

// Create unified axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  ...commonConfig,
});

// Legacy exports for backward compatibility (to be removed)
export const varianceApiClient = apiClient;
export const contractOcrApiClient = apiClient;
export const API_ENDPOINTS = {
  VARIANCE: API_BASE_URL,
  CONTRACT_OCR: API_BASE_URL,
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

// Apply interceptors to the unified client
apiClient.interceptors.request.use(requestInterceptor);
apiClient.interceptors.response.use(responseInterceptor, errorInterceptor);

export default {
  apiClient,
  varianceApiClient, // Legacy export
  contractOcrApiClient, // Legacy export
  API_ENDPOINTS, // Legacy export
  API_BASE_URL,
};
