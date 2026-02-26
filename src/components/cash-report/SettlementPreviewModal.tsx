import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface SettlementPreviewModalProps {
  preview: any;
  onClose: () => void;
}

export default function SettlementPreviewModal({ preview, onClose }: SettlementPreviewModalProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {preview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <EyeIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {t('Settlement Preview (Dry Run)')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('No changes will be written until you click Run Settlement')}
                  </p>
                </div>
              </div>
              <button onClick={onClose} aria-label={t('Close preview')} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Stats row */}
            <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30 flex-shrink-0 flex flex-wrap gap-4">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">{t('Scanned')}</p>
                <p className="text-lg font-bold text-indigo-800 dark:text-indigo-300">{preview.total_transactions_scanned ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">{t('Candidates')}</p>
                <p className="text-lg font-bold text-indigo-800 dark:text-indigo-300">{preview.settlement_candidates ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">{t('Would Create')}</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{preview.counter_entries_would_create ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">{t('Interest Splits')}</p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{preview.interest_splits_would_create ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-red-500 dark:text-red-400">{t('No Account')}</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{(preview.skipped_no_account || []).length}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-gray-500">{t('Duplicates')}</p>
                <p className="text-lg font-bold text-gray-600 dark:text-gray-400">{(preview.skipped_duplicate || []).length}</p>
              </div>
            </div>

            {/* Candidates table */}
            <div className="flex-1 overflow-auto">
              {(preview.candidates || []).length === 0 ? (
                <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                  {t('No candidates found')}
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('Status')}</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('Date')}</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('Bank')}</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide max-w-[200px]">{t('Description')}</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('Debit')}</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('Counter Account')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {(preview.candidates || []).map((c: any, i: number) => (
                      <tr key={i} className={`transition-colors ${
                        c.status === 'matched' ? 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                        : c.status === 'no_account' ? 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20'
                        : 'bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                      }`}>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            c.status === 'matched' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : c.status === 'no_account' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}>
                            {c.status === 'matched' ? t('Match') : c.status === 'no_account' ? t('No Acct') : t('Dup')}
                          </span>
                          {c.has_interest_split && (
                            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">+{t('INT')}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{c.date || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{c.bank || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 max-w-[200px]">
                          <span className="truncate block" title={c.description}>{c.description || '—'}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-700 dark:text-gray-300 font-mono whitespace-nowrap">
                          {c.debit != null ? c.debit.toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 font-mono">{c.counter_account || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30">
              <span className="text-xs text-gray-500">
                {t('{{count}} row(s)', { count: (preview.candidates || []).length })}
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {t('Close')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
