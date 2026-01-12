import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ClockIcon,
  FolderIcon,
  TableCellsIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

import { getSessionDetails, downloadBankStatementFromHistory, downloadUploadedFile } from '../services/bank-statement/bank-statement-apis';

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const BankStatementSessionDetail = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!sessionId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await getSessionDetails(sessionId);
        setSession(data);
      } catch (err) {
        console.error('Error fetching session details:', err);
        setError(err.response?.data?.detail || t('Failed to load session details'));
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId, t]);

  const handleDownloadResult = async () => {
    if (!sessionId) return;
    setDownloading(true);
    try {
      const { blob, filename } = await downloadBankStatementFromHistory(sessionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const response = await downloadUploadedFile(fileId);
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {t('Go Back')}
          </button>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const { uploaded_files, extracted_from_zip, statements } = session;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('Bank Statement Session')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {sessionId}
            </p>
          </div>
        </div>
        <button
          onClick={handleDownloadResult}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          {downloading ? t('Downloading...') : t('Download Excel')}
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <ClockIcon className="h-4 w-4" />
            {t('Processed')}
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatDate(session.processed_at)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <FolderIcon className="h-4 w-4" />
            {t('Files')}
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {session.total_files} {t('uploaded')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <TableCellsIcon className="h-4 w-4" />
            {t('Transactions')}
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {session.total_transactions?.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <BanknotesIcon className="h-4 w-4" />
            {t('Banks')}
          </div>
          <div className="flex flex-wrap gap-1">
            {session.banks?.map((bank, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
              >
                {bank}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* File Type Badges */}
      <div className="flex flex-wrap gap-3 mb-6">
        {uploaded_files?.zip_count > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg">
            <ArchiveBoxIcon className="h-5 w-5" />
            <span className="font-medium">{uploaded_files.zip_count} ZIP</span>
            {(extracted_from_zip?.excel_count > 0 || extracted_from_zip?.pdf_count > 0) && (
              <span className="text-sm opacity-75">
                ({extracted_from_zip.excel_count} Excel, {extracted_from_zip.pdf_count} PDF {t('extracted')})
              </span>
            )}
          </div>
        )}
        {uploaded_files?.excel_count > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13.5l2.5 3-2.5 3h1.7l1.8-2.3 1.8 2.3h1.7l-2.5-3 2.5-3h-1.7l-1.8 2.3-1.8-2.3H8.5z"/>
            </svg>
            <span className="font-medium">{uploaded_files.excel_count} Excel</span>
          </div>
        )}
        {uploaded_files?.pdf_count > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.5 14.5c0 .83-.67 1.5-1.5 1.5H7v2H5.5v-5H8c.83 0 1.5.67 1.5 1.5zm4 1.5c0 .83-.67 1.5-1.5 1.5h-2v-5h2c.83 0 1.5.67 1.5 1.5zm6-.5h-1.5v1H19v1h-1.5v1H16v-5h3v1.5zm-8.5-1h-.5v2h.5c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5zM8 13.5h-.5v1H8c.28 0 .5-.22.5-.5s-.22-.5-.5-.5z"/>
            </svg>
            <span className="font-medium">{uploaded_files.pdf_count} PDF</span>
          </div>
        )}
      </div>

      {/* Uploaded Files Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-gray-500" />
            {t('Uploaded Files')}
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {/* ZIP Files */}
          {uploaded_files?.zip_files?.map((file) => (
            <div key={file.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                    <ArchiveBoxIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{file.file_name}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>{formatDate(file.uploaded_at)}</span>
                    </div>
                    {file.metadata && (
                      <div className="flex gap-2 mt-1">
                        {file.metadata.extracted_excel_count > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded">
                            {file.metadata.extracted_excel_count} Excel
                          </span>
                        )}
                        {file.metadata.extracted_pdf_count > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">
                            {file.metadata.extracted_pdf_count} PDF
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {file.download_url && (
                  <button
                    onClick={() => handleDownloadFile(file.id, file.file_name)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title={t('Download')}
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Excel Files */}
          {uploaded_files?.excel_files?.map((file) => (
            <div key={file.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded">
                    <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13.5l2.5 3-2.5 3h1.7l1.8-2.3 1.8 2.3h1.7l-2.5-3 2.5-3h-1.7l-1.8 2.3-1.8-2.3H8.5z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{file.file_name}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>{formatDate(file.uploaded_at)}</span>
                    </div>
                  </div>
                </div>
                {file.download_url && (
                  <button
                    onClick={() => handleDownloadFile(file.id, file.file_name)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title={t('Download')}
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* PDF Files */}
          {uploaded_files?.pdf_files?.map((file) => (
            <div key={file.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded">
                    <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.5 14.5c0 .83-.67 1.5-1.5 1.5H7v2H5.5v-5H8c.83 0 1.5.67 1.5 1.5zm4 1.5c0 .83-.67 1.5-1.5 1.5h-2v-5h2c.83 0 1.5.67 1.5 1.5zm6-.5h-1.5v1H19v1h-1.5v1H16v-5h3v1.5zm-8.5-1h-.5v2h.5c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5zM8 13.5h-.5v1H8c.28 0 .5-.22.5-.5s-.22-.5-.5-.5z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{file.file_name}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>{formatDate(file.uploaded_at)}</span>
                    </div>
                  </div>
                </div>
                {file.download_url && (
                  <button
                    onClick={() => handleDownloadFile(file.id, file.file_name)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title={t('Download')}
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extracted Files from ZIP */}
      {(extracted_from_zip?.excel_files?.length > 0 || extracted_from_zip?.pdf_files?.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ArchiveBoxIcon className="h-5 w-5 text-purple-500" />
              {t('Extracted from ZIP')}
            </h2>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {extracted_from_zip?.excel_files?.map((fileName, i) => (
                <span
                  key={`excel-${i}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13.5l2.5 3-2.5 3h1.7l1.8-2.3 1.8 2.3h1.7l-2.5-3 2.5-3h-1.7l-1.8 2.3-1.8-2.3H8.5z"/>
                  </svg>
                  {fileName}
                </span>
              ))}
              {extracted_from_zip?.pdf_files?.map((fileName, i) => (
                <span
                  key={`pdf-${i}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg text-sm"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.5 14.5c0 .83-.67 1.5-1.5 1.5H7v2H5.5v-5H8c.83 0 1.5.67 1.5 1.5zm4 1.5c0 .83-.67 1.5-1.5 1.5h-2v-5h2c.83 0 1.5.67 1.5 1.5zm6-.5h-1.5v1H19v1h-1.5v1H16v-5h3v1.5zm-8.5-1h-.5v2h.5c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5zM8 13.5h-.5v1H8c.28 0 .5-.22.5-.5s-.22-.5-.5-.5z"/>
                  </svg>
                  {fileName}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Parsed Statements Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <DocumentDuplicateIcon className="h-5 w-5 text-gray-500" />
            {t('Parsed Statements')} ({statements?.length || 0})
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {statements?.map((stmt, index) => (
            <motion.div
              key={stmt.uuid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                        {stmt.bank_name}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium text-sm">
                        {stmt.file_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>{stmt.transaction_count} {t('transactions')}</span>
                      {stmt.balance?.acc_no && (
                        <span className="font-mono text-xs">{t('Account')}: {stmt.balance.acc_no}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(stmt.processed_at)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BankStatementSessionDetail;
