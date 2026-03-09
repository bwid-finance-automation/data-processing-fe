import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface ClassificationReviewModalProps {
  preview: any;
  confirming?: boolean;
  onClose: () => void;
  onConfirm: (modifications: Array<{ index: number; nature: string }>) => Promise<void> | void;
}

const NATURE_OPTIONS = [
  'Receipt from tenants',
  'Refund land/deal deposit payment',
  'Refinancing',
  'Loan drawdown',
  'VAT refund',
  'Corporate Loan drawdown',
  'Loan receipts',
  'Contribution',
  'Other receipts',
  'Internal transfer in',
  'Internal contribution in',
  'Dividend receipt (inside group)',
  'Cash received from acquisition',
  'Operating expense',
  'Construction expense',
  'Deal payment',
  'Land acquisition',
  'Loan repayment',
  'Loan interest',
  'Internal transfer out',
  'Internal contribution out',
  'Dividend paid (inside group)',
  'Payment for acquisition',
];

function formatAmount(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric.toLocaleString();
  return String(value);
}

function formatConfidence(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  return `${Math.round(numeric * 100)}%`;
}

export default function ClassificationReviewModal({
  preview,
  confirming = false,
  onClose,
  onConfirm,
}: ClassificationReviewModalProps) {
  const { t } = useTranslation();
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'review' | 'ok'>('all');

  useEffect(() => {
    if (preview?.transactions) {
      const nextDrafts: Record<number, string> = {};
      for (const tx of preview.transactions) {
        nextDrafts[tx.index] = tx.nature || '';
      }
      setDrafts(nextDrafts);
    }
  }, [preview]);

  const modifications = useMemo(() => {
    const txs = preview?.transactions || [];
    return txs
      .filter((tx: any) => (drafts[tx.index] ?? '') !== (tx.nature || ''))
      .map((tx: any) => ({
        index: tx.index,
        nature: (drafts[tx.index] ?? '').trim(),
      }))
      .filter((tx: any) => tx.nature);
  }, [drafts, preview]);

  const filteredTransactions = useMemo(() => {
    const txs = preview?.transactions || [];
    if (statusFilter === 'review') {
      return txs.filter((tx: any) => tx.needs_review);
    }
    if (statusFilter === 'ok') {
      return txs.filter((tx: any) => !tx.needs_review);
    }
    return txs;
  }, [preview, statusFilter]);

  const handleNatureChange = (index: number, nature: string) => {
    setDrafts((prev) => ({ ...prev, [index]: nature }));
  };

  return (
    <AnimatePresence>
      {preview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#1b1b1b]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <PencilSquareIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('Review Classification Before Writing')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('This step calls upload-preview first. Nature changes made here will be learned only after you click Confirm.')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-5">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-[#232323]">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{t('Transactions')}</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{preview?.total_transactions ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-[#232323]">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{t('Need Review')}</div>
                  <div className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">{preview?.review_stats?.needs_review ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-[#232323]">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{t('Manual Changes')}</div>
                  <div className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">{modifications.length}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-[#232323]">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{t('High Confidence')}</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{preview?.review_stats?.high_confidence ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-[#232323]">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{t('Low Confidence')}</div>
                  <div className="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">{preview?.review_stats?.low_confidence ?? 0}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {[
                  { key: 'all', label: t('All'), count: preview?.total_transactions ?? 0 },
                  { key: 'review', label: t('Review'), count: preview?.review_stats?.needs_review ?? 0 },
                  { key: 'ok', label: t('OK'), count: (preview?.total_transactions ?? 0) - (preview?.review_stats?.needs_review ?? 0) },
                ].map((option) => {
                  const active = statusFilter === option.key;
                  return (
                    <button
                      key={option.key}
                      onClick={() => setStatusFilter(option.key as 'all' | 'review' | 'ok')}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#232323] dark:text-gray-300 dark:hover:bg-[#2b2b2b]'
                      }`}
                    >
                      <span>{option.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        active
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-800/40 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {option.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="min-w-[1450px] w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-900 text-left text-xs uppercase tracking-[0.16em] text-white">
                  <tr>
                    <th className="px-4 py-3">{t('#')}</th>
                    <th className="px-4 py-3">{t('Review')}</th>
                    <th className="px-4 py-3">{t('Description')}</th>
                    <th className="px-4 py-3">{t('Debit')}</th>
                    <th className="px-4 py-3">{t('Credit')}</th>
                    <th className="px-4 py-3">{t('Suggested Nature')}</th>
                    <th className="px-4 py-3">{t('Edit Nature')}</th>
                    <th className="px-4 py-3">{t('Confidence')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredTransactions.map((tx: any) => {
                    const isChanged = (drafts[tx.index] ?? '') !== (tx.nature || '');
                    return (
                      <tr
                        key={tx.index}
                        className={
                          tx.needs_review
                            ? 'bg-amber-50/70 dark:bg-amber-900/10'
                            : isChanged
                              ? 'bg-blue-50/60 dark:bg-blue-900/10'
                              : 'bg-white dark:bg-[#1b1b1b]'
                        }
                      >
                        <td className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{tx.index}</td>
                        <td className="px-4 py-3">
                          {tx.needs_review ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                              <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                              {t('Review')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              {t('OK')}
                            </span>
                          )}
                        </td>
                        <td className="max-w-[420px] px-4 py-3 text-gray-700 dark:text-gray-300">
                          <div className="break-words">{tx.description || '-'}</div>
                          <div className="mt-1 text-xs text-gray-400">
                            {tx.review_reason || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-300">{formatAmount(tx.debit)}</td>
                        <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-300">{formatAmount(tx.credit)}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{tx.nature || '-'}</td>
                        <td className="px-4 py-3">
                          <input
                            list="cash-report-nature-options"
                            value={drafts[tx.index] ?? ''}
                            onChange={(e) => handleNatureChange(tx.index, e.target.value)}
                            className={`w-full min-w-[220px] rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${
                              isChanged
                                ? 'border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/10'
                                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-[#232323]'
                            } text-gray-900 dark:text-white`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-700 dark:text-gray-200">{formatConfidence(tx.confidence_score)}</div>
                          <div className="text-xs text-gray-400">{tx.confidence_level || '-'}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <datalist id="cash-report-nature-options">
                {NATURE_OPTIONS.map((nature) => (
                  <option key={nature} value={nature} />
                ))}
              </datalist>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('{{shown}} row(s) shown, {{changed}} row(s) changed. Confirm to write preview results and learn from the corrections.', {
                  shown: filteredTransactions.length,
                  changed: modifications.length,
                })}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={() => void onConfirm(modifications)}
                  disabled={confirming}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {confirming ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
                  {confirming ? t('Confirming...') : t('Confirm & Write')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
