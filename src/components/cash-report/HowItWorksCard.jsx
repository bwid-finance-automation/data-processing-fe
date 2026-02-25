import {
  ArrowDownTrayIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CloudArrowUpIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const STEP_THEME = {
  done: {
    card: 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10',
    badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    label: 'text-emerald-700 dark:text-emerald-300',
    icon: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-900 dark:text-emerald-200',
  },
  active: {
    card: 'border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-900/10',
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    label: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-200',
  },
  pending: {
    card: 'border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-white/[0.03]',
    badge: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
    label: 'text-gray-500 dark:text-gray-400',
    icon: 'text-gray-500 dark:text-gray-400',
    title: 'text-gray-900 dark:text-gray-100',
  },
  optional: {
    card: 'border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-900/10',
    badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    label: 'text-purple-700 dark:text-purple-300',
    icon: 'text-purple-600 dark:text-purple-400',
    title: 'text-purple-900 dark:text-purple-200',
  },
};

export default function HowItWorksCard({
  hasSession,
  movementRows,
  hasSettlementResult,
  hasOpenNewResult,
  isUploadingData,
  settlementRunning,
  openNewRunning,
  hasDownloadedResult,
}) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const exportReady = hasSettlementResult || hasOpenNewResult;

  const steps = [
    {
      key: 'session',
      number: 1,
      icon: PlayIcon,
      title: t('Create Session'),
      description: t('cashReportStepSessionDesc'),
      done: hasSession,
      active: !hasSession,
      optional: false,
    },
    {
      key: 'upload',
      number: 2,
      icon: CloudArrowUpIcon,
      title: t('Upload Files'),
      description: t('cashReportStepUploadDesc'),
      done: movementRows > 0,
      active: hasSession && (isUploadingData || movementRows === 0),
      optional: false,
    },
    {
      key: 'settlement',
      number: 3,
      icon: ArrowsRightLeftIcon,
      title: t('Run Settlement'),
      description: t('cashReportStepSettlementDesc'),
      done: hasSettlementResult,
      active: hasSession && movementRows > 0 && (settlementRunning || !hasSettlementResult),
      optional: false,
    },
    {
      key: 'open-new',
      number: 4,
      icon: BanknotesIcon,
      title: t('Run Open New'),
      description: t('cashReportStepOpenNewDesc'),
      done: hasOpenNewResult,
      active:
        hasSession &&
        movementRows > 0 &&
        (openNewRunning || (hasSettlementResult && !hasOpenNewResult)),
      optional: true,
    },
    {
      key: 'export',
      number: 5,
      icon: ArrowDownTrayIcon,
      title: t('Export'),
      description: t('cashReportStepExportDesc'),
      done: hasDownloadedResult,
      active: exportReady && !hasDownloadedResult,
      optional: false,
    },
  ];

  return (
    <div className="mt-6 mb-6">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-xl shadow-sm">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-400/10 dark:bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative p-5 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('cashReportHowItWorksTitle')}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 max-w-3xl">
                {t('cashReportHowItWorksSubtitle')}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start">
              <button
                onClick={() => setCollapsed((prev) => !prev)}
                aria-label={collapsed ? t('Show How It Works') : t('Hide How It Works')}
                aria-expanded={!collapsed}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {collapsed ? t('Show How It Works') : t('Hide How It Works')}
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition-transform ${collapsed ? '' : 'rotate-180'}`}
                />
              </button>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                {t('cashReportSingleSessionHint')}
              </span>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="how-it-works-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <motion.div
                  initial={{ y: -6 }}
                  animate={{ y: 0 }}
                  exit={{ y: -6 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                    {steps.map((step) => {
                      const state = step.done
                        ? 'done'
                        : step.active
                          ? 'active'
                          : step.optional
                            ? 'optional'
                            : 'pending';
                      const theme = STEP_THEME[state];
                      const StepIcon = step.icon;
                      const statusLabel = state === 'done'
                        ? t('Completed')
                        : state === 'active'
                          ? t('cashReportStatusCurrent')
                          : state === 'optional'
                            ? t('cashReportStatusOptional')
                            : t('cashReportStatusPending');

                      return (
                        <div key={step.key} className={`rounded-xl border px-3.5 py-3 ${theme.card}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full text-[11px] font-bold px-1.5 ${theme.badge}`}>
                              {step.done ? <CheckCircleIcon className="w-4 h-4" /> : step.number}
                            </span>
                            <span className={`text-[10px] uppercase tracking-wide font-semibold ${theme.label}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="flex items-start gap-2">
                            <StepIcon className={`w-4 h-4 mt-0.5 shrink-0 ${theme.icon}`} />
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold ${theme.title}`}>{step.title}</p>
                              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {t('cashReportInputPathLabel')}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {t('cashReportInputPathStatements')}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {t('cashReportInputPathMovement')}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
