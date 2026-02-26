import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { ScrollContainer } from '@components/common';

interface ResultsSectionProps {
  results: any;
  processing: boolean;
  error: string | null;
  processingTime: number | null;
  fileMode: string;
  files: File[];
  supportedBanks: string[];
  supportedBanksPDF: string[];
  struckBanks: Set<string>;
  struckBanksPDF: Set<string>;
  onDownload: () => void;
}

export default function ResultsSection({
  results,
  processing,
  error,
  processingTime,
  fileMode,
  files,
  supportedBanks,
  supportedBanksPDF,
  struckBanks,
  struckBanksPDF,
  onDownload,
}: ResultsSectionProps) {
  const { t } = useTranslation();
  const showSupportedBanks = fileMode === 'excel' || fileMode === 'pdf' || fileMode === 'zip';
  const isZipMode = fileMode === 'zip';
  const activeBanks = fileMode === 'pdf' ? supportedBanksPDF : supportedBanks;
  const activeStruckBanks = fileMode === 'pdf' ? struckBanksPDF : struckBanks;

  const renderBankItems = (banks: string[], struck: Set<string>, keyPrefix: string) => {
    if (banks.length === 0) {
      return (
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          No supported banks configured
        </span>
      );
    }

    return (
      <>
        {banks.map((bank, index) => {
          const normalizedBank = bank?.toString() || '';
          const isStruck = struck.has(normalizedBank.toUpperCase());
          return (
            <span
              key={`${keyPrefix}-${normalizedBank}`}
              className={`inline ${isStruck ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}
            >
              {normalizedBank}
              {index < banks.length - 1 && (
                <span className="mx-1 text-gray-400 dark:text-gray-500">·</span>
              )}
            </span>
          );
        })}
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-800 lg:h-[360px] flex flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">

        {/* Supported Banks */}
        {showSupportedBanks && (
          <div className="mb-3 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/20">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  <BuildingLibraryIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {t('Supported Banks')}
                </h3>
              </div>
              {!isZipMode && (
                <span className="inline-flex items-center rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {activeBanks.length} {t('banks')}
                </span>
              )}
            </div>

            {isZipMode ? (
              <div className="space-y-1 text-[13px] leading-4 text-gray-600 dark:text-gray-300">
                <div className="break-words">
                  <span className="font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    Excel:
                  </span>
                  <span className="ml-1">
                    {renderBankItems(supportedBanks, struckBanks, 'zip-excel')}
                  </span>
                </div>
                <div className="break-words">
                  <span className="font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    PDF:
                  </span>
                  <span className="ml-1">
                    {renderBankItems(supportedBanksPDF, struckBanksPDF, 'zip-pdf')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[13px] leading-4 text-gray-600 dark:text-gray-300 break-words">
                <span className="font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  {fileMode === 'pdf' ? 'PDF:' : 'Excel:'}
                </span>
                <span className="ml-1">
                  {renderBankItems(activeBanks, activeStruckBanks, 'single')}
                </span>
              </div>
            )}
          </div>
        )}

        <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5efe6] mb-2 flex items-center gap-2">
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
          <div className="py-2">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <div>
                <p className="text-gray-700 dark:text-gray-300 font-medium">{t('Processing bank statements...')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {fileMode === 'pdf' ? t('Running OCR and extracting data...') : fileMode === 'zip' ? t('Extracting and processing files from ZIP...') : t('Auto-detecting banks and extracting data')}
                </p>
              </div>
            </div>

            {/* Time Warning */}
            <div className="mb-3 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
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
            <ScrollContainer maxHeight="max-h-32" className="space-y-2">
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

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
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
          <div className="space-y-3">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="min-h-[88px] p-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex flex-col justify-between">
                <p className="text-sm text-blue-700 dark:text-blue-300">{t('Transactions')}</p>
                <p className="text-2xl font-bold leading-none text-blue-900 dark:text-blue-100">
                  {results.summary?.total_transactions || 0}
                </p>
              </div>
              <div className="min-h-[88px] p-3.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 flex flex-col justify-between">
                <p className="text-sm text-green-700 dark:text-green-300">{t('Accounts')}</p>
                <p className="text-2xl font-bold leading-none text-green-900 dark:text-green-100">
                  {results.summary?.total_accounts || results.summary?.total_balances || 0}
                </p>
              </div>
              <div className="min-h-[88px] p-3.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 flex flex-col justify-between">
                <p className="text-sm text-purple-700 dark:text-purple-300">{t('Processing Time')}</p>
                <p className="text-2xl font-bold leading-none text-purple-900 dark:text-purple-100">
                  {processingTime ? `${processingTime.toFixed(1)}s` : '-'}
                </p>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={onDownload}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-lg font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <ArrowDownTrayIcon className="h-6 w-6" />
              {t('Download Results (Excel)')}
            </button>

          </div>
        )}

        {/* Empty State */}
        {!results && !processing && !error && (
          <div className="text-center py-6">
            <DocumentTextIcon className="h-14 w-14 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-500">
              {t('Upload and process files to see results')}
            </p>
          </div>
        )}
        </div>
      </div>
    </motion.div>
  );
}
