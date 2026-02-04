import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CpuChipIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/common/Breadcrumb';
import {
  getAIUsageDashboard,
  getAIUsageLogs,
  formatTokens,
  formatCost,
  formatProcessingTime,
  formatCaseName,
} from '../services/ai-usage/ai-usage-apis';

const AIUsageDashboard = () => {
  const { t, i18n } = useTranslation();

  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Logs with pagination
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPagination, setLogsPagination] = useState({
    skip: 0,
    limit: 20,
    total: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    days: 30,
    provider: '',
    task_type: '',
    success: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Expanded log details
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAIUsageDashboard({ days: filters.days });
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs
  const fetchLogs = async (skip = 0) => {
    setLogsLoading(true);
    try {
      const params = {
        skip,
        limit: logsPagination.limit,
      };
      if (filters.provider) params.provider = filters.provider;
      if (filters.task_type) params.task_type = filters.task_type;
      if (filters.success !== '') params.success = filters.success === 'true';

      const data = await getAIUsageLogs(params);
      setLogs(data.items);
      setLogsPagination(prev => ({
        ...prev,
        skip,
        total: data.total,
      }));
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboard();
    fetchLogs();
  }, []);

  // Reload when filters change
  useEffect(() => {
    fetchDashboard();
    fetchLogs(0);
  }, [filters.days, filters.provider, filters.task_type, filters.success]);

  // Format date for display - use dynamic locale based on language
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Append 'Z' if not present to indicate UTC time
    let normalizedDate = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
      normalizedDate = dateString + 'Z';
    }
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    return new Date(normalizedDate).toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const breadcrumbItems = [
    { label: t('home'), href: '/' },
    { label: t('AI Usage Dashboard') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#181818] p-6">
      <div className="max-w-7xl mx-auto">
        <Breadcrumb items={breadcrumbItems} className="mb-4" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CpuChipIcon className="h-7 w-7 text-indigo-500" />
              {t('AI Usage Dashboard')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t('Monitor AI API usage, tokens, and costs')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
            >
              <FunnelIcon className="h-5 w-5" />
              {t('Filters')}
            </button>
            <button
              onClick={() => { fetchDashboard(); fetchLogs(0); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              {t('Refresh')}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-[#222] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('Time Range')}
                </label>
                <select
                  value={filters.days}
                  onChange={(e) => setFilters(prev => ({ ...prev, days: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value={7}>{t('Last 7 days')}</option>
                  <option value={30}>{t('Last 30 days')}</option>
                  <option value={90}>{t('Last 90 days')}</option>
                  <option value={365}>{t('Last year')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('Provider')}
                </label>
                <select
                  value={filters.provider}
                  onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">{t('All Providers')}</option>
                  <option value="gemini">Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('Case')}
                </label>
                <select
                  value={filters.task_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, task_type: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">{t('All Cases')}</option>
                  <option value="ocr">{t('Bank Statement / Contract OCR')}</option>
                  <option value="classification">{t('Cash Report')}</option>
                  <option value="analysis">{t('Variance Analysis')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('status')}
                </label>
                <select
                  value={filters.success}
                  onChange={(e) => setFilters(prev => ({ ...prev, success: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">{t('All Status')}</option>
                  <option value="true">{t('Success')}</option>
                  <option value="false">{t('Failed')}</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !dashboardData && (
          <div className="flex items-center justify-center h-64">
            <ArrowPathIcon className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        )}

        {/* Dashboard Content */}
        {dashboardData && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Tokens */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#222] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('Total Tokens')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {formatTokens(dashboardData.stats.total_tokens)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      In: {formatTokens(dashboardData.stats.total_input_tokens)} / Out: {formatTokens(dashboardData.stats.total_output_tokens)}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <CpuChipIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
              </motion.div>

              {/* Total Cost */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#222] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('Estimated Cost')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {formatCost(dashboardData.stats.total_cost_usd)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {t('Last')} {filters.days} {t('days')}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </motion.div>

              {/* Total Requests */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-[#222] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('Total Requests')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {dashboardData.stats.total_requests.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {dashboardData.stats.total_files_processed} {t('files processed')}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </motion.div>

              {/* Success Rate */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-[#222] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('Success Rate')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {dashboardData.stats.success_rate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {dashboardData.stats.successful_requests} {t('success')} / {dashboardData.stats.failed_requests} {t('failed')}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <CheckCircleIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Usage by Provider */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-[#222] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-indigo-500" />
                  {t('Usage by Provider')}
                </h3>
                {dashboardData.by_provider.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('No data available')}</p>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.by_provider.map((provider) => (
                      <div key={provider.provider} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            provider.provider === 'gemini' ? 'bg-blue-500' :
                            provider.provider === 'openai' ? 'bg-green-500' :
                            provider.provider === 'anthropic' ? 'bg-orange-500' : 'bg-gray-500'
                          }`} />
                          <span className="text-gray-700 dark:text-gray-300 capitalize">{provider.provider}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900 dark:text-white font-medium">{formatTokens(provider.total_tokens)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{provider.request_count} {t('requests')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Usage by Case */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-[#222] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-purple-500" />
                  {t('Usage by Case')}
                </h3>
                {dashboardData.by_task_type.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('No data available')}</p>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.by_task_type.map((taskType) => (
                      <div key={taskType.task_type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            taskType.task_type === 'ocr' ? 'bg-indigo-500' :
                            taskType.task_type === 'classification' ? 'bg-teal-500' :
                            taskType.task_type === 'analysis' ? 'bg-amber-500' : 'bg-gray-500'
                          }`} />
                          <span className="text-gray-700 dark:text-gray-300">{formatCaseName(taskType.task_type)}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900 dark:text-white font-medium">{formatTokens(taskType.total_tokens)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{taskType.request_count} {t('requests')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Usage by User */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-[#222] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-emerald-500" />
                  {t('Usage by User')}
                </h3>
                {!dashboardData.by_user || dashboardData.by_user.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('No data available')}</p>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.by_user.slice(0, 5).map((user, index) => (
                      <div key={user.user_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-gray-700 dark:text-gray-300 text-sm truncate" title={user.full_name || user.email}>
                              {user.full_name || user.email.split('@')[0]}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-gray-900 dark:text-white font-medium">{formatTokens(user.total_tokens)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.request_count} {t('requests')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Recent Logs Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-[#222] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                  {t('Recent Usage Logs')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#2a2a2a]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('Time')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('Provider')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('Case')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tokens</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('Duration')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('Cost')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('status')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {logsLoading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center">
                          <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          {t('No usage logs found')}
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <>
                          <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a]">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {formatDate(log.requested_at)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                log.provider === 'gemini' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                log.provider === 'openai' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                              }`}>
                                {log.provider}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {formatCaseName(log.task_type)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                              {formatTokens(log.total_tokens)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {formatProcessingTime(log.processing_time_ms)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {formatCost(log.estimated_cost_usd)}
                            </td>
                            <td className="px-4 py-3">
                              {log.success ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              ) : (
                                <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                {expandedLogId === log.id ? (
                                  <ChevronUpIcon className="h-5 w-5" />
                                ) : (
                                  <ChevronDownIcon className="h-5 w-5" />
                                )}
                              </button>
                            </td>
                          </tr>
                          {expandedLogId === log.id && (
                            <tr>
                              <td colSpan={8} className="px-4 py-4 bg-gray-50 dark:bg-[#1a1a1a]">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">{t('Model')}:</span>
                                    <p className="text-gray-900 dark:text-white">{log.model_name}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Session ID:</span>
                                    <p className="text-gray-900 dark:text-white font-mono text-xs">{log.session_id || '-'}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">{t('Files')}:</span>
                                    <p className="text-gray-900 dark:text-white">{log.file_count} {t('file(s)')}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">{t('Input/Output')}:</span>
                                    <p className="text-gray-900 dark:text-white">
                                      {formatTokens(log.input_tokens)} / {formatTokens(log.output_tokens)}
                                    </p>
                                  </div>
                                  {log.file_name && (
                                    <div className="col-span-2 md:col-span-4">
                                      <span className="text-gray-500 dark:text-gray-400">{t('Files')}:</span>
                                      <p className="text-gray-900 dark:text-white truncate">{log.file_name}</p>
                                    </div>
                                  )}
                                  {log.error_message && (
                                    <div className="col-span-2 md:col-span-4">
                                      <span className="text-red-500">{t('Error')}:</span>
                                      <p className="text-red-600 dark:text-red-400">{log.error_message}</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {logsPagination.total > logsPagination.limit && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('Showing')} {logsPagination.skip + 1} - {Math.min(logsPagination.skip + logsPagination.limit, logsPagination.total)} {t('of')} {logsPagination.total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchLogs(Math.max(0, logsPagination.skip - logsPagination.limit))}
                      disabled={logsPagination.skip === 0}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                    >
                      {t('Previous')}
                    </button>
                    <button
                      onClick={() => fetchLogs(logsPagination.skip + logsPagination.limit)}
                      disabled={logsPagination.skip + logsPagination.limit >= logsPagination.total}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                    >
                      {t('Next')}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIUsageDashboard;
