import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import {
  deleteLearnedRule,
  listLearnedRules,
  type LearnedRule,
  type LearnedRulesResponse,
} from '../../services/cash-report/cash-report-apis';

interface LearnedRulesModalProps {
  open: boolean;
  onClose: () => void;
}

const KIND_OPTIONS = [
  { value: 'all', label: 'All rules' },
  { value: 'reference', label: 'Reference' },
  { value: 'keyword', label: 'Keyword' },
];

function formatDirection(direction?: string) {
  if (!direction) return '-';
  return direction === 'receipt' ? 'Receipt' : direction === 'payment' ? 'Payment' : direction;
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function LearnedRulesModal({ open, onClose }: LearnedRulesModalProps) {
  const { t } = useTranslation();
  const [kind, setKind] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [data, setData] = useState<LearnedRulesResponse | null>(null);

  const loadRules = async (kindValue = kind) => {
    setLoading(true);
    setError('');
    try {
      const result = await listLearnedRules(kindValue);
      setData(result);
    } catch (err) {
      console.error('Error loading learned rules:', err);
      setError((err as any)?.response?.data?.detail || t('Failed to load learned rules'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void loadRules(kind);
    }
  }, [open]);

  const filteredRules = useMemo(() => {
    const rules = data?.rules || [];
    const needle = search.trim().toLowerCase();
    if (!needle) return rules;
    return rules.filter((rule: LearnedRule) => {
      return [
        rule.id,
        rule.kind,
        rule.direction,
        rule.nature,
        rule.keyword,
        rule.description,
        rule.amount_condition,
        rule.source_session_id,
        rule.learned_from,
      ].join(' ').toLowerCase().includes(needle);
    });
  }, [data, search]);

  const handleKindChange = async (value: string) => {
    setKind(value);
    await loadRules(value);
  };

  const handleDelete = async (rule: LearnedRule) => {
    if (!window.confirm(t('Delete learned rule {{id}}?', { id: rule.id }))) return;
    setDeletingId(rule.id);
    setError('');
    try {
      await deleteLearnedRule(rule.id);
      await loadRules(kind);
    } catch (err) {
      console.error('Error deleting learned rule:', err);
      setError((err as any)?.response?.data?.detail || t('Failed to delete learned rule'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm p-4 md:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#181818]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 px-6 py-5 dark:border-gray-800 dark:from-[#221b14] dark:via-[#181818] dark:to-[#211814]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    <SparklesIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {t('Learned Rules')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {t('Review what Cash Report has learned from confirm-upload corrections and remove bad rules without using SQLAdmin.')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-2xl border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 dark:border-gray-700 dark:bg-[#202020]/90">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">{t('Backend')}</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{data?.backend || '-'}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 dark:border-gray-700 dark:bg-[#202020]/90">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">{t('Total')}</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{data?.total ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 dark:border-gray-700 dark:bg-[#202020]/90">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">{t('Reference')}</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{data?.reference_rules ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 dark:border-gray-700 dark:bg-[#202020]/90">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">{t('Keyword')}</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{data?.keyword_rules ?? 0}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-800 lg:flex-row lg:items-center">
              <div className="grid flex-1 gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                <select
                  value={kind}
                  onChange={(e) => void handleKindChange(e.target.value)}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none ring-0 transition-colors focus:border-amber-400 dark:border-gray-700 dark:bg-[#202020] dark:text-gray-100"
                >
                  {KIND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.label)}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-[#202020]">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('Search by nature, keyword, description, amount, session...')}
                    className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100"
                  />
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => void loadRules(kind)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? t('Loading...') : t('Reload')}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden px-6 py-4">
              {error && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="h-full overflow-auto rounded-3xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-[1200px] w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-900 text-left text-xs uppercase tracking-[0.16em] text-white">
                    <tr>
                      <th className="px-4 py-3">{t('Kind')}</th>
                      <th className="px-4 py-3">{t('Nature')}</th>
                      <th className="px-4 py-3">{t('Direction')}</th>
                      <th className="px-4 py-3">{t('Keyword')}</th>
                      <th className="px-4 py-3">{t('Description')}</th>
                      <th className="px-4 py-3">{t('Amount')}</th>
                      <th className="px-4 py-3">{t('Support')}</th>
                      <th className="px-4 py-3">{t('Source Session')}</th>
                      <th className="px-4 py-3">{t('Updated')}</th>
                      <th className="px-4 py-3">{t('Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-[#181818]">
                    {!loading && filteredRules.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-4 py-14 text-center text-sm text-gray-500 dark:text-gray-400">
                          {t('No learned rules match the current filter.')}
                        </td>
                      </tr>
                    )}

                    {filteredRules.map((rule, index) => (
                      <tr
                        key={rule.id}
                        className={index % 2 === 0 ? 'bg-white dark:bg-[#181818]' : 'bg-amber-50/30 dark:bg-[#1f1a16]/35'}
                      >
                        <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{rule.kind || '-'}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{rule.nature || '-'}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDirection(rule.direction)}</td>
                        <td className="px-4 py-3">
                          <div className="max-w-[220px] truncate font-medium text-amber-700 dark:text-amber-300">
                            {rule.keyword || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-[420px] whitespace-normal break-words text-gray-600 dark:text-gray-300">
                            {rule.description || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {rule.amount_condition || rule.debit || rule.credit || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{rule.support_count ?? rule.times_confirmed ?? '-'}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{rule.source_session_id || '-'}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatUpdatedAt(rule.updated_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => void handleDelete(rule)}
                            disabled={deletingId === rule.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                          >
                            {deletingId === rule.id ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <TrashIcon className="h-4 w-4" />
                            )}
                            {deletingId === rule.id ? t('Deleting...') : t('Delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
