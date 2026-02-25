import { useTranslation } from 'react-i18next';

export default function ProcessingStatus({ progress }) {
  const { t } = useTranslation();
  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="bg-[#f7f6f3] dark:bg-[#222] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-[#222] dark:text-[#f5efe6]">
        <svg className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {t('processingContracts') || 'Processing Contracts'}
      </h2>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>

        {/* Progress Text */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {t('processingFilesCount') || `Processing ${progress.current} of ${progress.total} file${progress.total !== 1 ? 's' : ''}`}
          </span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {Math.round(percentage)}%
          </span>
        </div>

        {/* Status Message */}
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('processingMessage') || 'Please wait while we extract information from your contracts using AI...'}</span>
        </div>
      </div>
    </div>
  );
}
