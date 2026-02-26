import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClockIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  TableCellsIcon,
  ChartBarIcon,
  BoltIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Breadcrumb } from '@components/common';
import {
  getHistorySummary,
  getBankStatementHistory,
  getContractHistory,
  getGLAHistory,
  getVarianceHistory,
  getUtilityBillingHistory,
  getExcelComparisonHistory,
  type HistorySummaryResponse,
  type BankStatementSessionItem,
  type ContractSessionItem,
  type GLASessionItem,
  type AnalysisSessionItem,
} from '../services/history/history-apis';

type ModuleKey = 'bank-statements' | 'contracts' | 'gla' | 'variance' | 'utility-billing' | 'excel-comparison';

interface ModuleConfig {
  key: ModuleKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  path: string;
}

const History = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<HistorySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<ModuleKey | null>(null);
  const [moduleData, setModuleData] = useState<Record<string, any[]>>({});
  const [loadingModule, setLoadingModule] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${t('History')} - BW Industrial`;
  }, [t]);

  const modules: ModuleConfig[] = [
    { key: 'bank-statements', label: t('Bank Statements'), icon: DocumentTextIcon, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/40', path: '/bank-statement-parser' },
    { key: 'contracts', label: t('Contract OCR'), icon: DocumentDuplicateIcon, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/40', path: '/contract-ocr' },
    { key: 'gla', label: t('GLA Variance'), icon: ChartBarIcon, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/40', path: '/gla-variance' },
    { key: 'variance', label: t('Variance Analysis'), icon: TableCellsIcon, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/40', path: '/variance-analysis' },
    { key: 'utility-billing', label: t('Utility Billing'), icon: BoltIcon, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/40', path: '/utility-billing' },
    { key: 'excel-comparison', label: t('Excel Comparison'), icon: DocumentDuplicateIcon, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/40', path: '/excel-comparison' },
  ];

  const breadcrumbItems = [
    { label: t('Home'), href: '/' },
    { label: t('History') },
  ];

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHistorySummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Error fetching history summary:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const fetchModuleHistory = async (moduleKey: ModuleKey) => {
    if (moduleData[moduleKey]) return; // Already loaded

    setLoadingModule(moduleKey);
    try {
      let data: any;
      switch (moduleKey) {
        case 'bank-statements':
          data = await getBankStatementHistory(0, 50);
          setModuleData(prev => ({ ...prev, [moduleKey]: data.sessions }));
          break;
        case 'contracts':
          data = await getContractHistory(0, 50);
          setModuleData(prev => ({ ...prev, [moduleKey]: data.contracts }));
          break;
        case 'gla':
          data = await getGLAHistory(0, 50);
          setModuleData(prev => ({ ...prev, [moduleKey]: data.sessions }));
          break;
        case 'variance':
          data = await getVarianceHistory(0, 50);
          setModuleData(prev => ({ ...prev, [moduleKey]: data.sessions }));
          break;
        case 'utility-billing':
          data = await getUtilityBillingHistory(0, 50);
          setModuleData(prev => ({ ...prev, [moduleKey]: data.sessions }));
          break;
        case 'excel-comparison':
          data = await getExcelComparisonHistory(0, 50);
          setModuleData(prev => ({ ...prev, [moduleKey]: data.sessions }));
          break;
      }
    } catch (err) {
      console.error(`Error fetching ${moduleKey} history:`, err);
    } finally {
      setLoadingModule(null);
    }
  };

  const handleToggleModule = async (moduleKey: ModuleKey) => {
    if (expandedModule === moduleKey) {
      setExpandedModule(null);
    } else {
      setExpandedModule(moduleKey);
      await fetchModuleHistory(moduleKey);
    }
  };

  const getModuleSummary = (moduleKey: string) => {
    return summary?.modules?.find(m => m.module === moduleKey);
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '-';
    let dateString = isoString;
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
      dateString += 'Z';
    }
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (isoString: string | null) => {
    if (!isoString) return '';
    let dateString = isoString;
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
      dateString += 'Z';
    }
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('Just now');
    if (diffMins < 60) return `${diffMins}m ${t('ago')}`;
    if (diffHours < 24) return `${diffHours}h ${t('ago')}`;
    if (diffDays < 7) return `${diffDays}d ${t('ago')}`;
    return formatDate(isoString);
  };

  const renderBankStatementItems = (items: BankStatementSessionItem[]) => (
    <div className="space-y-2">
      {items.map((session) => (
        <div key={session.session_id} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                {session.banks.map(bank => (
                  <span key={bank} className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    {bank}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {session.file_count} {t('files')} &middot; {session.total_transactions.toLocaleString()} {t('txns')}
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            {formatRelativeTime(session.processed_at)}
          </span>
        </div>
      ))}
    </div>
  );

  const renderContractItems = (items: ContractSessionItem[]) => (
    <div className="space-y-2">
      {items.map((contract, idx) => (
        <div key={idx} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {contract.contract_title || contract.file_name || '-'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {[contract.contract_number, contract.tenant].filter(Boolean).join(' · ') || '-'}
            </p>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-3">
            {formatRelativeTime(contract.processed_at)}
          </span>
        </div>
      ))}
    </div>
  );

  const renderGLAItems = (items: GLASessionItem[]) => (
    <div className="space-y-2">
      {items.map((session, idx) => (
        <div key={idx} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {session.project_name} ({session.project_code})
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {[session.product_type, session.region, session.period_label].filter(Boolean).join(' · ')}
            </p>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-3">
            {formatRelativeTime(session.processed_at)}
          </span>
        </div>
      ))}
    </div>
  );

  const renderAnalysisItems = (items: AnalysisSessionItem[]) => (
    <div className="space-y-2">
      {items.map((session) => (
        <div key={session.session_id} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {session.files_count} {t('files')}
              </p>
              <span className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded ${
                session.status === 'completed'
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                  : session.status === 'failed'
                    ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
              }`}>
                {session.status}
              </span>
            </div>
            {session.analysis_type && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{session.analysis_type}</p>
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-3">
            {formatRelativeTime(session.completed_at || session.started_at)}
          </span>
        </div>
      ))}
    </div>
  );

  const renderModuleItems = (moduleKey: ModuleKey, items: any[]) => {
    if (!items || items.length === 0) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          {t('No history yet')}
        </p>
      );
    }
    switch (moduleKey) {
      case 'bank-statements':
        return renderBankStatementItems(items);
      case 'contracts':
        return renderContractItems(items);
      case 'gla':
        return renderGLAItems(items);
      case 'variance':
      case 'utility-billing':
      case 'excel-comparison':
        return renderAnalysisItems(items);
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3] dark:bg-[#181818] transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#222] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb items={breadcrumbItems} />
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-[#f5efe6]">
                  {t('History')}
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  {t('Your file processing history across all modules')}
                </p>
              </div>
            </div>
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {t('Refresh')}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && !summary && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-indigo-400 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">{t('Loading history...')}</p>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-[#222] rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('Total Sessions')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{summary.total_sessions}</p>
            </div>
            <div className="bg-white dark:bg-[#222] rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('Total Files')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{summary.total_files}</p>
            </div>
            <div className="bg-white dark:bg-[#222] rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm col-span-2 sm:col-span-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('Modules Used')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {summary.modules.filter(m => m.total_sessions > 0).length}
              </p>
            </div>
          </div>
        )}

        {/* Module List */}
        {summary && (
          <div className="space-y-3">
            {modules.map((mod) => {
              const modSummary = getModuleSummary(mod.key);
              const isExpanded = expandedModule === mod.key;
              const items = moduleData[mod.key];
              const isLoading = loadingModule === mod.key;

              return (
                <motion.div
                  key={mod.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-[#222] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"
                >
                  {/* Module Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => handleToggleModule(mod.key)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-2.5 rounded-xl ${mod.bgColor}`}>
                        <mod.icon className={`h-5 w-5 ${mod.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {mod.label}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {modSummary?.total_sessions || 0} {t('sessions')} &middot; {modSummary?.total_files || 0} {t('files')}
                          {modSummary?.last_processed_at && (
                            <> &middot; {t('Last')}: {formatRelativeTime(modSummary.last_processed_at)}</>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(mod.path);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {t('Open')}
                        <ChevronRightIcon className="h-3 w-3 inline ml-1" />
                      </button>
                      {isExpanded ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
                          <div className="pt-3 max-h-[400px] overflow-y-auto">
                            {isLoading ? (
                              <div className="text-center py-6">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 dark:border-indigo-400 mb-2"></div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('Loading...')}</p>
                              </div>
                            ) : (
                              renderModuleItems(mod.key, items)
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {summary && summary.total_sessions === 0 && (
          <div className="text-center py-16 mt-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <ClockIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('No processing history yet')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t('Start by using one of the tools to process your files')}
            </p>
            <button
              onClick={() => navigate('/bank-statement-parser')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              {t('Get Started')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
