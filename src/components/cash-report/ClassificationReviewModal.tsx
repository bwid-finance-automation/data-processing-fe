import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronUpDownIcon,
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

function confidenceColor(level: string | undefined) {
  if (!level) return 'text-gray-400';
  const l = level.toLowerCase();
  if (l === 'high') return 'text-emerald-600 dark:text-emerald-400';
  if (l === 'medium') return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

/* ── Combobox dropdown for nature selection ── */
function NatureCombobox({
  value,
  onChange,
  isChanged,
}: {
  value: string;
  onChange: (v: string) => void;
  isChanged: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return NATURE_OPTIONS;
    const q = search.toLowerCase();
    return NATURE_OPTIONS.filter((n) => n.toLowerCase().includes(q));
  }, [search]);

  return (
    <div ref={ref} className="relative">
      <div
        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm transition-colors cursor-pointer ${
          isChanged
            ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-[#232323] dark:hover:border-gray-600'
        }`}
        onClick={() => {
          setOpen(!open);
          setSearch('');
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <span className={`flex-1 truncate ${value ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
          {value || 'Select nature...'}
        </span>
        <ChevronUpDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
      </div>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-[#232323]">
          <div className="border-b border-gray-100 p-2 dark:border-gray-700">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-gray-50 px-3 py-1.5 text-sm outline-none dark:bg-[#1b1b1b] dark:text-white"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">No match</div>
            )}
            {filtered.map((nature) => (
              <button
                key={nature}
                onClick={() => {
                  onChange(nature);
                  setOpen(false);
                  setSearch('');
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                  nature === value
                    ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {nature}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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
  const [natureFilter, setNatureFilter] = useState('all');

  const getEffectiveNature = (tx: any) => (drafts[tx.index] ?? tx.nature ?? '').trim();

  useEffect(() => {
    if (preview?.transactions) {
      const nextDrafts: Record<number, string> = {};
      for (const tx of preview.transactions) {
        nextDrafts[tx.index] = tx.nature || '';
      }
      setDrafts(nextDrafts);
      setStatusFilter('all');
      setNatureFilter('all');
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

  const statusFilteredTransactions = useMemo(() => {
    const txs = preview?.transactions || [];
    return txs.filter((tx: any) => {
      if (statusFilter === 'review' && !tx.needs_review) return false;
      if (statusFilter === 'ok' && tx.needs_review) return false;
      return true;
    });
  }, [preview, statusFilter]);

  const natureCounts = useMemo(() => {
    const counts = new Map<string, number>();
    statusFilteredTransactions.forEach((tx: any) => {
      const nature = getEffectiveNature(tx);
      if (!nature) return;
      counts.set(nature, (counts.get(nature) ?? 0) + 1);
    });
    return counts;
  }, [statusFilteredTransactions, drafts]);

  const availableNatureOptions = useMemo(() => {
    return ['all', ...Array.from(natureCounts.keys()).sort((a, b) => a.localeCompare(b))];
  }, [natureCounts]);

  const filteredTransactions = useMemo(() => {
    if (natureFilter === 'all') return statusFilteredTransactions;
    return statusFilteredTransactions.filter((tx: any) => getEffectiveNature(tx) === natureFilter);
  }, [statusFilteredTransactions, natureFilter, drafts]);

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
            {/* ── Header ── */}
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

              {/* ── Stats ── */}
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

              {/* ── Filters ── */}
              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
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

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    {t('Nature')}
                  </span>
                  <select
                    value={natureFilter}
                    onChange={(e) => setNatureFilter(e.target.value)}
                    className="min-w-[240px] rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-blue-400 dark:border-gray-700 dark:bg-[#232323] dark:text-gray-200"
                  >
                    {availableNatureOptions.map((nature) => (
                      <option key={nature} value={nature}>
                        {nature === 'all'
                          ? `${t('All natures')} (${statusFilteredTransactions.length})`
                          : `${nature} (${natureCounts.get(nature) ?? 0})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Table ── */}
            <div className="flex-1 overflow-auto">
              <table className="min-w-[1100px] w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-900 text-left text-xs uppercase tracking-[0.16em] text-white">
                  <tr>
                    <th className="w-14 px-4 py-3 text-center">{t('#')}</th>
                    <th className="w-20 px-3 py-3 text-center">{t('Status')}</th>
                    <th className="px-4 py-3">{t('Description')}</th>
                    <th className="w-32 px-4 py-3 text-right">{t('Debit')}</th>
                    <th className="w-32 px-4 py-3 text-right">{t('Credit')}</th>
                    <th className="w-64 px-4 py-3">{t('Nature')}</th>
                    <th className="w-24 px-4 py-3 text-center">{t('Conf.')}</th>
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
                        {/* Index */}
                        <td className="px-4 py-3 text-center font-medium text-gray-400 dark:text-gray-500">
                          {tx.index}
                        </td>

                        {/* Status badge */}
                        <td className="px-3 py-3 text-center">
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

                        {/* Description — wider, with review reason */}
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          <div className="break-words leading-relaxed">{tx.description || '-'}</div>
                          {tx.review_reason && (
                            <div className="mt-1 text-xs leading-snug text-amber-600 dark:text-amber-400">
                              {tx.review_reason}
                            </div>
                          )}
                        </td>

                        {/* Amounts — right-aligned for easier scanning */}
                        <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-300">
                          {formatAmount(tx.debit)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-300">
                          {formatAmount(tx.credit)}
                        </td>

                        {/* Nature — merged: combobox with original shown as subtitle when changed */}
                        <td className="px-4 py-3">
                          <NatureCombobox
                            value={drafts[tx.index] ?? ''}
                            onChange={(v) => handleNatureChange(tx.index, v)}
                            isChanged={isChanged}
                          />
                          {isChanged && (
                            <div className="mt-1 text-xs text-gray-400 line-through">
                              {tx.nature || '-'}
                            </div>
                          )}
                        </td>

                        {/* Confidence — color-coded */}
                        <td className="px-4 py-3 text-center">
                          <div className={`text-sm font-semibold ${confidenceColor(tx.confidence_level)}`}>
                            {formatConfidence(tx.confidence_score)}
                          </div>
                          <div className={`text-[11px] ${confidenceColor(tx.confidence_level)}`}>
                            {tx.confidence_level || '-'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Footer ── */}
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
