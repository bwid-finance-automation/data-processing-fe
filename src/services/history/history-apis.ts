import axios from 'axios';
import { historyApiClient, FINANCE_API_BASE_URL } from '@configs/APIs';

// Derive server root from the finance API base URL (e.g., "http://localhost:8000/api/finance" → "http://localhost:8000")
const SERVER_ROOT = FINANCE_API_BASE_URL.replace(/\/api\/finance$/, '');

// Types matching backend schemas
export interface ModuleSummary {
  module: string;
  total_sessions: number;
  total_files: number;
  last_processed_at: string | null;
}

export interface HistorySummaryResponse {
  modules: ModuleSummary[];
  total_sessions: number;
  total_files: number;
}

export interface BankStatementSessionItem {
  session_id: string;
  file_count: number;
  total_transactions: number;
  banks: string[];
  files: string[];
  processed_at: string | null;
  download_url: string | null;
}

export interface BankStatementHistoryResponse {
  sessions: BankStatementSessionItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface ContractSessionItem {
  file_name: string | null;
  contract_number: string | null;
  contract_title: string | null;
  tenant: string | null;
  processed_at: string | null;
}

export interface ContractHistoryResponse {
  contracts: ContractSessionItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface GLASessionItem {
  file_name: string | null;
  project_code: string;
  project_name: string;
  product_type: string;
  region: string;
  period_label: string | null;
  processed_at: string | null;
}

export interface GLAHistoryResponse {
  sessions: GLASessionItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface AnalysisSessionItem {
  session_id: string;
  analysis_type: string | null;
  status: string;
  files_count: number;
  processing_details: Record<string, any> | null;
  started_at: string | null;
  completed_at: string | null;
  download_url: string | null;
}

export interface AnalysisHistoryResponse {
  sessions: AnalysisSessionItem[];
  total: number;
  skip: number;
  limit: number;
}

// API calls
export const getHistorySummary = async (): Promise<HistorySummaryResponse> => {
  const response = await historyApiClient.get('/all');
  return response.data;
};

export const getBankStatementHistory = async (
  skip = 0,
  limit = 20
): Promise<BankStatementHistoryResponse> => {
  const response = await historyApiClient.get('/bank-statements', {
    params: { skip, limit },
  });
  return response.data;
};

export const getContractHistory = async (
  skip = 0,
  limit = 20
): Promise<ContractHistoryResponse> => {
  const response = await historyApiClient.get('/contracts', {
    params: { skip, limit },
  });
  return response.data;
};

export const getGLAHistory = async (
  skip = 0,
  limit = 20
): Promise<GLAHistoryResponse> => {
  const response = await historyApiClient.get('/gla', {
    params: { skip, limit },
  });
  return response.data;
};

export const getVarianceHistory = async (
  skip = 0,
  limit = 20
): Promise<AnalysisHistoryResponse> => {
  const response = await historyApiClient.get('/variance', {
    params: { skip, limit },
  });
  return response.data;
};

export const getUtilityBillingHistory = async (
  skip = 0,
  limit = 20
): Promise<AnalysisHistoryResponse> => {
  const response = await historyApiClient.get('/utility-billing', {
    params: { skip, limit },
  });
  return response.data;
};

export const getExcelComparisonHistory = async (
  skip = 0,
  limit = 20
): Promise<AnalysisHistoryResponse> => {
  const response = await historyApiClient.get('/excel-comparison', {
    params: { skip, limit },
  });
  return response.data;
};

/**
 * Download a file from a history download_url.
 * Triggers a browser download with the correct filename.
 */
export const downloadFromHistory = async (downloadUrl: string): Promise<void> => {
  const fullUrl = `${SERVER_ROOT}${downloadUrl}`;
  const response = await axios.get(fullUrl, {
    responseType: 'blob',
    withCredentials: true,
  });

  // Extract filename from Content-Disposition header
  const disposition = response.headers['content-disposition'] || '';
  const filenameMatch = disposition.match(/filename[^;=\n]*=(['"]?)([^'";\n]*)\1/);
  const filename = filenameMatch?.[2] || 'download.xlsx';

  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
