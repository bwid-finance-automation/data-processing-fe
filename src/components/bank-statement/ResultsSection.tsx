import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  FolderOpenIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { ScrollContainer } from '@components/common';

interface UploadedFile {
  id: string;
  original_filename: string;
  file_size: number;
}

interface ResultsSectionProps {
  results: any;
  processing: boolean;
  error: string | null;
  processingTime: number | null;
  fileMode: string;
  files: File[];
  uploadedFiles: UploadedFile[];
  loadingUploadedFiles: boolean;
  onDownload: () => void;
  onDownloadOriginalFile: (fileId: string, filename: string) => void;
  formatFileSize: (bytes: number) => string;
}

export default function ResultsSection({
  results,
  processing,
  error,
  processingTime,
  fileMode,
  files,
  uploadedFiles,
  loadingUploadedFiles,
  onDownload,
  onDownloadOriginalFile,
  formatFileSize,
}: ResultsSectionProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-[#f5efe6] mb-4 flex items-center gap-2">
          {results ? (
            <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          ) : (
            <DocumentTextIcon className="h-6 w-6 text-gray-400" />
          )}
          {t('Results')}
        </h2>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">{t('Error')}</h4>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {processing && (
          <div className="py-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <div>
                <p className="text-gray-700 dark:text-gray-300 font-medium">{t('Processing bank statements...')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {fileMode === 'pdf' ? t('Running OCR and extracting data...') : fileMode === 'zip' ? t('Extracting and processing files from ZIP...') : t('Auto-detecting banks and extracting data')}
                </p>
              </div>
            </div>

            {/* Time Warning */}
            <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <ClockIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">
                  {fileMode === 'pdf'
                    ? t('PDF processing with OCR may take several minutes depending on file size and number of pages...')
                    : t('This may take a few minutes depending on file size and number of transactions...')}
                </span>
              </div>
            </div>

            {/* File Processing List */}
            <ScrollContainer maxHeight="max-h-60" className="space-y-2">
              {files.map((file, index) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <DocumentTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {fileMode === 'pdf' ? t('OCR processing...') : fileMode === 'zip' ? t('Extracting...') : t('Parsing...')}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                      <motion.div
                        className="absolute h-full w-8 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"
                        initial={{ x: -32 }}
                        animate={{ x: 64 }}
                        transition={{
                          duration: 1.2,
                          ease: 'easeInOut',
                          repeat: Infinity,
                          delay: index * 0.2
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </ScrollContainer>

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
              {fileMode === 'pdf'
                ? t('PDF files may take 10-30 seconds each depending on complexity')
                : fileMode === 'zip'
                  ? t('ZIP files are extracted and processed automatically (may include OCR for PDFs)')
                  : t('Excel files typically process in a few seconds')
              }
            </p>
          </div>
        )}

        {/* Results Display */}
        {results && !processing && (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">{t('Transactions')}</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {results.summary?.total_transactions || 0}
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300 mb-1">{t('Accounts')}</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {results.summary?.total_accounts || results.summary?.total_balances || 0}
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">{t('Processing Time')}</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {processingTime ? `${processingTime.toFixed(1)}s` : '-'}
                </p>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={onDownload}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              {t('Download Results (Excel)')}
            </button>

            {/* Uploaded Files Section */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpenIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t('Original Files')} ({uploadedFiles.length})
                  </h4>
                </div>
                <ScrollContainer maxHeight="max-h-40" className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <DocumentTextIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {file.original_filename}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          ({formatFileSize(file.file_size)})
                        </span>
                      </div>
                      <button
                        onClick={() => onDownloadOriginalFile(file.id, file.original_filename)}
                        className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title={t('Download original file')}
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </ScrollContainer>
              </div>
            )}
            {loadingUploadedFiles && (
              <div className="mt-4 text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('Loading uploaded files...')}</p>
              </div>
            )}

            {/* File Info */}
            {results.session_id && (
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-2">
                {t('Session ID')}: {results.session_id}
              </p>
            )}
          </div>
        )}

        {/* Empty State */}
        {!results && !processing && !error && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-gray-500 dark:text-gray-500">
              {t('Upload and process files to see results')}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
