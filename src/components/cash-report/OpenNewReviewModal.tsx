import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import type {
  OpenNewReviewItem,
  OpenNewReviewResponse,
  OpenNewReviewUpdateItem,
} from '../../services/cash-report/cash-report-apis';

interface OpenNewReviewModalProps {
  open: boolean;
  review: OpenNewReviewResponse | null;
  loading: boolean;
  saving: boolean;
  downloading: boolean;
  onClose: () => void;
  onReload: () => void;
  onSave: (updates: OpenNewReviewUpdateItem[]) => void;
  onDownload: () => void;
}

interface DraftRow {
  new_account_number: string;
  opening_date: string;
  maturity_date: string;
  term_months: string;
  term_days: string;
  interest_rate: string;
}

const buildDrafts = (items: OpenNewReviewItem[] = []) =>
  items.reduce<Record<string, DraftRow>>((acc, item) => {
    const numericRate = Number(item.interest_rate);
    acc[item.account_number] = {
      new_account_number: '',
      opening_date: item.opening_date ? String(item.opening_date).slice(0, 10) : '',
      maturity_date: item.maturity_date ? String(item.maturity_date).slice(0, 10) : '',
      term_months: item.term_months != null ? String(item.term_months) : '',
      term_days: item.term_days != null ? String(item.term_days) : '',
      interest_rate:
        Number.isFinite(numericRate) && item.interest_rate != null
          ? String(numericRate <= 1 ? numericRate * 100 : numericRate).replace(/\.0+$/, '')
          : '',
    };
    return acc;
  }, {});

const hasAnyValue = (draft?: DraftRow) =>
  !!(
    draft?.new_account_number ||
    draft?.opening_date ||
    draft?.maturity_date ||
    draft?.term_months ||
    draft?.term_days ||
    draft?.interest_rate
  );

const formatAmount = (value?: number) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  return numeric.toLocaleString();
};

/** Add months+days to a date string, return YYYY-MM-DD */
const addTerm = (dateStr: string, months: number, days: number): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const INPUT_CLS =
  'w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none transition-colors focus:border-amber-400 placeholder:text-gray-300 dark:placeholder:text-gray-600 dark:border-gray-700 dark:bg-[#232323] dark:text-white';

export default function OpenNewReviewModal({
  open,
  review,
  loading,
  saving,
  downloading,
  onClose,
  onReload,
  onSave,
  onDownload,
}: OpenNewReviewModalProps) {
  const { t } = useTranslation();
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});

  useEffect(() => {
    if (open) {
      setDrafts(buildDrafts(review?.items || []));
    }
  }, [open, review]);

  const summary = review?.summary;
  const items = review?.items || [];
  const canExport = !!summary?.can_export;
  const pendingCount = Number(summary?.pending_accounts || 0);

  const handleFieldChange = (accountNumber: string, field: keyof DraftRow, value: string) => {
    setDrafts((prev) => {
      const current = prev[accountNumber] || {
        new_account_number: '',
        opening_date: '',
        maturity_date: '',
        term_months: '',
        term_days: '',
        interest_rate: '',
      };
      const next = { ...current, [field]: value };

      // Auto-compute maturity when opening + term are filled
      if (
        (field === 'opening_date' || field === 'term_months' || field === 'term_days') &&
        next.opening_date &&
        (next.term_months || next.term_days)
      ) {
        const computed = addTerm(
          next.opening_date,
          Number(next.term_months) || 0,
          Number(next.term_days) || 0,
        );
        if (computed) next.maturity_date = computed;
      }

      return { ...prev, [accountNumber]: next };
    });
  };

  const handleSave = () => {
    const updates = items
      .map<OpenNewReviewUpdateItem | null>((item) => {
        const draft = drafts[item.account_number];
        if (!hasAnyValue(draft)) return null;
        return {
          account_number: item.account_number,
          new_account_number: draft.new_account_number || null,
          opening_date: draft.opening_date || null,
          maturity_date: draft.maturity_date || null,
          term_months: draft.term_months === '' ? null : Number(draft.term_months),
          term_days: draft.term_days === '' ? null : Number(draft.term_days),
          interest_rate: draft.interest_rate === '' ? null : Number(draft.interest_rate),
        };
      })
      .filter(Boolean) as OpenNewReviewUpdateItem[];

    onSave(updates);
  };

  const isMissing = (item: OpenNewReviewItem, field: string) =>
    (item.missing_fields || []).includes(field);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 24 }}
            transition={{ duration: 0.18 }}
            className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#1b1b1b]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header — compact */}
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-3.5 dark:border-gray-800">
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {t('Open-New Review')}
                </h3>
                {canExport ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <CheckCircleIcon className="h-3 w-3" />
                    {t('Ready')}
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    {pendingCount} {t('pending')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onReload}
                  disabled={loading || saving}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  title={t('Reload')}
                >
                  <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto px-5 py-4">
              {loading && !review ? (
                <div className="flex h-48 items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  {t('Loading...')}
                </div>
              ) : items.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
                  <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {summary?.tracked_accounts ? t('All accounts complete') : t('No review rows')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {summary?.tracked_accounts
                      ? t('You can export now.')
                      : t('Run open-new first.')}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const draft = drafts[item.account_number] || {
                      new_account_number: '',
                      opening_date: '',
                      maturity_date: '',
                      term_months: '',
                      term_days: '',
                      interest_rate: '',
                    };
                    const isSuffixAccount = item.account_number.includes('_');
                    const missing = [
                      ...(isSuffixAccount ? ['account_number'] : []),
                      ...(item.missing_fields || []),
                    ];
                    const contextParts = [
                      item.entity,
                      item.bank_branch || item.bank_name,
                      `${item.currency || 'VND'} ${formatAmount(item.principal_amount)}`,
                    ].filter(Boolean);

                    return (
                      <div
                        key={item.account_number}
                        className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]"
                      >
                        {/* Card header: account + context in 1 line */}
                        <div className="mb-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                              {item.account_number}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              r{item.row}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {missing.map((f) => (
                              <span
                                key={f}
                                className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Editable account number for suffix accounts */}
                        {isSuffixAccount && (
                          <div className="mb-2.5">
                            <label className="space-y-1">
                              <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {t('Saving Account No.')}
                              </span>
                              <input
                                type="text"
                                value={draft.new_account_number}
                                onChange={(e) => handleFieldChange(item.account_number, 'new_account_number', e.target.value)}
                                className={INPUT_CLS}
                              />
                            </label>
                          </div>
                        )}

                        <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                          {contextParts.join(' / ')}
                        </div>

                        {/* Only show inputs for missing fields */}
                        <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                          {isMissing(item, 'opening_date') && (
                            <label className="space-y-1">
                              <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {t('Opening')}
                              </span>
                              <input
                                type="date"
                                value={draft.opening_date}
                                onChange={(e) => handleFieldChange(item.account_number, 'opening_date', e.target.value)}
                                className={INPUT_CLS}
                              />
                            </label>
                          )}
                          {(isMissing(item, 'term') || isMissing(item, 'term_months') || isMissing(item, 'term_days')) && (
                            <label className="space-y-1">
                              <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {t('Term (months)')}
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="3"
                                value={draft.term_months}
                                onChange={(e) => handleFieldChange(item.account_number, 'term_months', e.target.value)}
                                className={INPUT_CLS}
                              />
                            </label>
                          )}
                          {isMissing(item, 'maturity_date') && (
                            <label className="space-y-1">
                              <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {t('Maturity')}
                              </span>
                              <input
                                type="date"
                                value={draft.maturity_date}
                                onChange={(e) => handleFieldChange(item.account_number, 'maturity_date', e.target.value)}
                                className={INPUT_CLS}
                              />
                            </label>
                          )}
                          {isMissing(item, 'interest_rate') && (
                            <label className="space-y-1">
                              <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {t('Rate %')}
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="4.75"
                                value={draft.interest_rate}
                                onChange={(e) => handleFieldChange(item.account_number, 'interest_rate', e.target.value)}
                                className={INPUT_CLS}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer — actions */}
            {items.length > 0 && (
              <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                <button
                  onClick={handleSave}
                  disabled={loading || saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />}
                  {saving ? t('Saving...') : t('Save')}
                </button>
                <button
                  onClick={onDownload}
                  disabled={loading || saving || downloading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {downloading ? (
                    <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                  )}
                  {t('Export')}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
