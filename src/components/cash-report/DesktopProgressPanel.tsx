import { MutableRefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import UploadProgressPanel from './UploadProgressPanel';
import AutomationStepsList from './AutomationStepsList';

interface StepDef {
  key: string;
  title: string;
  desc: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface SSEState {
  steps: any[];
  isComplete: boolean;
  error: string | null;
  isRunning: boolean;
  currentStep: string;
  completedSteps: string[];
  result: any;
}

interface DesktopProgressPanelProps {
  showProgress: boolean;
  uploading: boolean;
  uploadingMovement: boolean;
  downloading: boolean;
  uploadSSE: SSEState;
  movementSSE: SSEState;
  settlementSSE: SSEState;
  openNewSSE: SSEState;
  hasSettlementStarted: boolean;
  hasOpenNewStarted: boolean;
  settlementSteps: StepDef[];
  openNewSteps: StepDef[];
  settlementStepRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  openNewStepRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  onDownload: (step: string) => void;
}

export default function DesktopProgressPanel({
  showProgress,
  uploading,
  uploadingMovement,
  downloading,
  uploadSSE,
  movementSSE,
  settlementSSE,
  openNewSSE,
  hasSettlementStarted,
  hasOpenNewStarted,
  settlementSteps,
  openNewSteps,
  settlementStepRefs,
  openNewStepRefs,
  onDownload,
}: DesktopProgressPanelProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence mode="popLayout">
      {showProgress && (
        <motion.div
          initial={{ width: 0, opacity: 0, marginLeft: 0 }}
          animate={{ width: 380, opacity: 1, marginLeft: 24 }}
          exit={{ width: 0, opacity: 0, marginLeft: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative hidden lg:block overflow-hidden rounded-2xl bg-white dark:bg-[#222] border border-gray-200 dark:border-gray-800 shadow-xl"
        >
          <div className="absolute inset-0 w-[380px] overflow-y-auto">
            <div className="flex flex-col p-4 gap-4">
              {/* Section 1: Bank Statement Upload Progress */}
              <UploadProgressPanel
                isVisible={true}
                steps={uploadSSE.steps}
                isComplete={uploadSSE.isComplete}
                isError={!!uploadSSE.error}
                errorMessage={uploadSSE.error}
                isActive={uploading}
              />

              {/* Section 1b: Movement Data Upload Progress */}
              {(movementSSE.steps.length > 0 || uploadingMovement) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-gray-100 dark:border-gray-800 pt-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <DocumentChartBarIcon className={`w-5 h-5 ${uploadingMovement ? 'text-purple-500 animate-pulse' : 'text-emerald-500'}`} />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t('Movement Data')}</h3>
                  </div>
                  <UploadProgressPanel
                    isVisible={true}
                    steps={movementSSE.steps}
                    isComplete={movementSSE.isComplete}
                    isError={!!movementSSE.error}
                    errorMessage={movementSSE.error}
                    isActive={uploadingMovement}
                  />
                </motion.div>
              )}

              {/* Section 2: Settlement Progress */}
              {hasSettlementStarted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-gray-100 dark:border-gray-800 pt-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowsRightLeftIcon className={`w-5 h-5 ${settlementSSE.isRunning ? 'text-blue-500 animate-spin' : 'text-emerald-500'}`} />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t('Settlement Process')}</h3>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800 mb-4">
                    <AutomationStepsList
                      steps={settlementSteps}
                      currentStep={settlementSSE.currentStep}
                      completedSteps={settlementSSE.completedSteps}
                      result={settlementSSE.result}
                      error={settlementSSE.error}
                      colorTheme="blue"
                      stepRefs={settlementStepRefs}
                    />
                  </div>

                  {/* Settlement Error */}
                  {settlementSSE.error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 mb-3">
                      {settlementSSE.error}
                    </div>
                  )}

                  {/* Settlement Success Result */}
                  {settlementSSE.result && !settlementSSE.error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-50/80 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl p-4"
                    >
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="text-center p-2 bg-white dark:bg-white/5 rounded-lg">
                          <p className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold">{t('Created')}</p>
                          <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300">{settlementSSE.result.counter_entries_created ?? 0}</p>
                        </div>
                        <div className="text-center p-2 bg-white dark:bg-white/5 rounded-lg">
                          <p className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold">{t('Cleaned')}</p>
                          <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300">{settlementSSE.result.saving_rows_removed ?? 0}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onDownload('settlement')}
                        disabled={downloading}
                        className="w-full py-2 bg-emerald-600 text-white text-xs rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        {downloading ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <ArrowDownTrayIcon className="w-3 h-3" />}
                        {t('Download Result')}
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Section 3: Open-New Progress */}
              {hasOpenNewStarted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-gray-100 dark:border-gray-800 pt-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BanknotesIcon className={`w-5 h-5 ${openNewSSE.isRunning ? 'text-purple-500 animate-pulse' : 'text-emerald-500'}`} />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t('Open-New Process')}</h3>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-800 mb-4">
                    <AutomationStepsList
                      steps={openNewSteps}
                      currentStep={openNewSSE.currentStep}
                      completedSteps={openNewSSE.completedSteps}
                      result={openNewSSE.result}
                      error={openNewSSE.error}
                      colorTheme="purple"
                      stepRefs={openNewStepRefs}
                    />
                  </div>

                  {/* Open-New Error */}
                  {openNewSSE.error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 mb-3">
                      {openNewSSE.error}
                    </div>
                  )}

                  {/* Open-New Success Result */}
                  {openNewSSE.result && !openNewSSE.error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-purple-50/80 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-xl p-4"
                    >
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="text-center p-2 bg-white dark:bg-white/5 rounded-lg">
                          <p className="text-[10px] uppercase text-purple-600 dark:text-purple-400 font-bold">{t('Created')}</p>
                          <p className="text-xl font-bold text-purple-800 dark:text-purple-300">{openNewSSE.result.counter_entries_created ?? 0}</p>
                        </div>
                        <div className="text-center p-2 bg-white dark:bg-white/5 rounded-lg">
                          <p className="text-[10px] uppercase text-purple-600 dark:text-purple-400 font-bold">{t('Candidates')}</p>
                          <p className="text-xl font-bold text-purple-800 dark:text-purple-300">{openNewSSE.result.candidates_found ?? 0}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onDownload('open_new')}
                        disabled={downloading}
                        className="w-full py-2 bg-purple-600 text-white text-xs rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                      >
                        {downloading ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <ArrowDownTrayIcon className="w-3 h-3" />}
                        {t('Download Result')}
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
