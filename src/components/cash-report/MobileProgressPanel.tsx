import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import UploadProgressPanel from './UploadProgressPanel';
import type { OpenNewReviewSummary } from '../../services/cash-report/cash-report-apis';

interface SSEState {
  steps: unknown[];
  isComplete: boolean;
  error: string | null;
  isRunning: boolean;
  currentStep: string;
  completedSteps: string[];
  result: Record<string, unknown> | null;
}

interface MobileProgressPanelProps {
  visible: boolean;
  uploadingMovement: boolean;
  movementSSE: SSEState;
  settlementSSE: SSEState;
  openNewSSE: SSEState;
  hasSettlementStarted: boolean;
  hasOpenNewStarted: boolean;
  settlementError: string | null;
  openNewError: string | null;
  onClose: () => void;
  onDownload: (step: string) => void;
  openNewReviewSummary?: OpenNewReviewSummary | null;
  onOpenNewReview: () => void;
}

export default function MobileProgressPanel({
  visible,
  uploadingMovement,
  movementSSE,
  settlementSSE,
  openNewSSE,
  hasSettlementStarted,
  hasOpenNewStarted,
  settlementError,
  openNewError,
  onClose,
  onDownload,
  openNewReviewSummary,
  onOpenNewReview,
}: MobileProgressPanelProps) {
  const { t } = useTranslation();
  const isRunning = uploadingMovement || settlementSSE.isRunning || openNewSSE.isRunning;
  const openNewPending = Number(openNewReviewSummary?.pending_accounts || 0);
  const openNewCanExport = openNewReviewSummary?.can_export ?? true;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="lg:hidden w-full mt-4 overflow-hidden"
        >
          <div className="bg-white dark:bg-[#222] rounded-xl border border-gray-200 dark:border-gray-800">
            {/* Sticky header with collapse button */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#222] border-b border-gray-100 dark:border-gray-800 rounded-t-xl">
              <div className="flex items-center gap-2">
                {isRunning && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {isRunning ? t('Running...') : t('Progress Log')}
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label={t('Collapse progress panel')}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <UploadProgressPanel
                isVisible={true}
                steps={movementSSE.steps}
                isComplete={movementSSE.isComplete}
                isError={!!movementSSE.error}
                errorMessage={movementSSE.error}
                isActive={uploadingMovement}
              />

              {/* Mobile Settlement */}
              {hasSettlementStarted && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {t('Settlement')} {settlementSSE.currentStep ? `— ${settlementSSE.currentStep}` : ''}
                  </p>
                  {settlementError && (
                    <p className="text-xs text-red-500 mb-2">{settlementError}</p>
                  )}
                  {settlementSSE.result && (
                    <button
                      onClick={() => onDownload('settlement')}
                      aria-label={t('Download settlement result')}
                      className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      {t('Download Result')}
                    </button>
                  )}
                </div>
              )}

              {/* Mobile Open-New */}
              {hasOpenNewStarted && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {t('Open-New')} {openNewSSE.currentStep ? `— ${openNewSSE.currentStep}` : ''}
                  </p>
                  {openNewError && (
                    <p className="text-xs text-red-500 mb-2">{openNewError}</p>
                  )}
                  {openNewSSE.result && (
                    <div className="space-y-2">
                      <button
                        onClick={() => onDownload('open_new')}
                        aria-label={t('Download open-new result')}
                        className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        {t('Download Result')}
                      </button>
                      {openNewPending > 0 && (
                        <button
                          onClick={onOpenNewReview}
                          className="w-full py-1.5 text-amber-600 dark:text-amber-400 text-xs font-medium hover:underline flex items-center justify-center gap-1"
                        >
                          {t('Review Open New')} ({openNewPending})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
