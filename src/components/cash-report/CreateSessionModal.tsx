import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { initAutomationSession } from '../../services/cash-report/cash-report-apis';

interface CreateSessionModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}

// Auto-generate period name from date range
const generatePeriodName = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return '';
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startDay = start.getDate();
  const month = start.toLocaleString('en-US', { month: 'short' });
  const year = end.getFullYear().toString().slice(-2);
  const weekRange = startDay <= 15 ? 'W1-2' : 'W3-4';
  return `${weekRange}${month}${year}`;
};

export default function CreateSessionModal({ open, onClose, onCreated }: CreateSessionModalProps) {
  const { t } = useTranslation();
  const [openingDate, setOpeningDate] = useState('');
  const [endingDate, setEndingDate] = useState('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [initializing, setInitializing] = useState(false);

  const handleInitSession = async () => {
    if (!openingDate || !endingDate) {
      toast.error(t('Please select opening and ending dates'));
      return;
    }

    const opening = new Date(openingDate);
    const ending = new Date(endingDate);

    if (opening > ending) {
      toast.error(t('Opening date must be before ending date'));
      return;
    }

    const diffDays = Math.ceil((ending.getTime() - opening.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 31) {
      toast.error(t('Date range cannot exceed 31 days'));
      return;
    }

    if (templateFile && !templateFile.name.endsWith('.xlsx')) {
      toast.error(t('Template file must be an .xlsx file'));
      return;
    }

    setInitializing(true);
    const autoPeriodName = generatePeriodName(openingDate, endingDate);

    try {
      const result = await initAutomationSession({
        openingDate,
        endingDate,
        periodName: autoPeriodName,
        templateFile: templateFile || null,
      });

      onClose();
      setTemplateFile(null);
      setOpeningDate('');
      setEndingDate('');

      if (result.is_existing) {
        toast.info(t('Using existing session'));
      } else if (result.movement_prepared) {
        toast.success(t('Session created — Summary updated, Cash Balance copied, Movement cleared'));
      } else {
        toast.success(t('Session created successfully'));
      }
      await onCreated();
    } catch (err: any) {
      console.error('Error initializing session:', err);
      toast.error(err.response?.data?.detail || t('Failed to create session'));
    } finally {
      setInitializing(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !initializing && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-[#222] rounded-2xl shadow-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                <CalendarIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('Create New Session')}
              </h3>
            </div>

            <div className="space-y-4">
              {/* Quick Period Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('Quick Period')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const now = new Date();
                    const todayDay = now.getDate();
                    const todayMonth = now.getMonth();
                    const todayYear = now.getFullYear();
                    const currentHalf = todayDay <= 15 ? 0 : 1;

                    const allPeriods: { label: string; start: string; end: string; isCurrent: boolean }[] = [];
                    for (let offset = -2; offset <= 2; offset++) {
                      const d = new Date(todayYear, todayMonth + offset, 1);
                      const y = d.getFullYear();
                      const m = d.getMonth();
                      const mm = String(m + 1).padStart(2, '0');
                      const monthShort = d.toLocaleString('en-US', { month: 'short' });
                      const yr = String(y).slice(-2);
                      const lastDay = new Date(y, m + 1, 0).getDate();
                      allPeriods.push({
                        label: `W1-2${monthShort}${yr}`,
                        start: `${y}-${mm}-01`,
                        end: `${y}-${mm}-15`,
                        isCurrent: offset === 0 && currentHalf === 0,
                      });
                      allPeriods.push({
                        label: `W3-4${monthShort}${yr}`,
                        start: `${y}-${mm}-16`,
                        end: `${y}-${mm}-${lastDay}`,
                        isCurrent: offset === 0 && currentHalf === 1,
                      });
                    }

                    const curIdx = allPeriods.findIndex((p) => p.isCurrent);
                    const sliceStart = Math.max(0, curIdx - 2);
                    const periods = allPeriods.slice(sliceStart, sliceStart + 4);

                    return periods.map((p) => {
                      const isSelected = openingDate === p.start && endingDate === p.end;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => { setOpeningDate(p.start); setEndingDate(p.end); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                              : p.isCurrent
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-800'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Opening Date')} *
                  </label>
                  <input
                    type="date"
                    value={openingDate}
                    onChange={(e) => setOpeningDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('Ending Date')} *
                  </label>
                  <input
                    type="date"
                    value={endingDate}
                    onChange={(e) => setEndingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Period name preview */}
              {openingDate && endingDate && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-emerald-700 dark:text-emerald-400">
                    {t('Period')}: <span className="font-bold">{generatePeriodName(openingDate, endingDate)}</span>
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('Template File')}
                  <span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">
                    ({t('optional — upload previous period\'s completed file')})
                  </span>
                </label>
                <div
                  className={`relative w-full border-2 border-dashed rounded-lg px-4 py-3 text-center cursor-pointer transition-colors ${
                    templateFile
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500'
                  }`}
                  onClick={() => document.getElementById('template-file-input')?.click()}
                >
                  <input
                    id="template-file-input"
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                  />
                  {templateFile ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-emerald-700 dark:text-emerald-400 truncate">
                        {templateFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTemplateFile(null);
                          const templateInput = document.getElementById('template-file-input') as HTMLInputElement | null;
                          if (templateInput) {
                            templateInput.value = '';
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      {t('Click to upload .xlsx template')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={initializing}
                className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleInitSession}
                disabled={initializing || !openingDate || !endingDate}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {initializing ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    {t('Creating...')}
                  </>
                ) : (
                  t('Create')
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
