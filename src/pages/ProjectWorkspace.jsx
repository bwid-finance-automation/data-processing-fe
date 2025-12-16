import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  BanknotesIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/common/Breadcrumb';
import {
  getProject,
  getProjectCases,
  getProjectBankStatements
} from '../services/project/project-apis';
import { downloadBankStatementResults } from '../services/bank-statement/bank-statement-apis';

const ProjectWorkspace = () => {
  const { t } = useTranslation();
  const { uuid } = useParams();
  const navigate = useNavigate();

  // State
  const [project, setProject] = useState(null);
  const [cases, setCases] = useState([]);
  const [bankStatements, setBankStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch project data
  const fetchProjectData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectData, casesData, bankStatementsData] = await Promise.all([
        getProject(uuid),
        getProjectCases(uuid),
        getProjectBankStatements(uuid)
      ]);
      setProject(projectData);
      setCases(casesData);
      setBankStatements(bankStatementsData);
    } catch (err) {
      console.error('Error fetching project data:', err);
      if (err.response?.status === 404) {
        setError(t('Project not found'));
      } else {
        setError(err.response?.data?.detail || t('Failed to load project'));
      }
    } finally {
      setLoading(false);
    }
  }, [uuid, t]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  useEffect(() => {
    if (project) {
      document.title = `${project.name} - BW Industrial`;
    }
  }, [project]);

  const breadcrumbItems = [
    { label: t('Home'), href: '/' },
    { label: t('Projects'), href: '/projects' },
    { label: project?.name || '...', icon: FolderIcon }
  ];

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadBankStatement = async (sessionId) => {
    try {
      const blob = await downloadBankStatementResults(sessionId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bank_statements_${sessionId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading bank statement:', err);
    }
  };

  const handleNavigateToBankParser = () => {
    navigate(`/bank-statement-parser?project=${uuid}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f6f3] dark:bg-[#181818] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('Loading project...')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f6f3] dark:bg-[#181818] flex items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {error}
          </h2>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {t('Back to Projects')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f3] dark:bg-[#181818] transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#222] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb items={breadcrumbItems} />

          <motion.button
            onClick={() => navigate('/projects')}
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 mt-4 mb-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>{t('Back to Projects')}</span>
          </motion.button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FolderIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-[#f5efe6]">
                  {project?.name}
                </h1>
                {project?.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-500">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    {t('Created')}: {formatDate(project?.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('Overview')}
            </button>
            <button
              onClick={() => setActiveTab('bank-statements')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'bank-statements'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('Bank Statements')} ({bankStatements.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('Total Cases')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {cases.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <BanknotesIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('Bank Statements')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {bankStatements.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('Last Updated')}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {formatDate(project?.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {t('Quick Actions')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNavigateToBankParser}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all group"
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30 transition-colors">
                      <BanknotesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {t('Parse Bank Statements')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('Upload and process bank statements')}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400 ml-auto" />
                  </motion.button>
                </div>
              </div>

              {/* Recent Cases */}
              <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('Recent Cases')}
                  </h2>
                </div>

                {cases.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('No cases yet. Start by parsing bank statements.')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cases.slice(0, 5).map((caseItem, index) => (
                      <motion.div
                        key={caseItem.uuid}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <DocumentTextIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {caseItem.case_type}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(caseItem.created_at)}
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                          {caseItem.record_count || 0} {t('records')}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'bank-statements' && (
            <motion.div
              key="bank-statements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('Bank Statement History')}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNavigateToBankParser}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    {t('Parse New')}
                  </motion.button>
                </div>

                {bankStatements.length === 0 ? (
                  <div className="text-center py-16">
                    <BanknotesIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('No bank statements')}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      {t('Upload and parse bank statements to see them here')}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNavigateToBankParser}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all"
                    >
                      <BanknotesIcon className="h-5 w-5" />
                      {t('Parse Bank Statements')}
                    </motion.button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {bankStatements.map((statement, index) => (
                      <motion.div
                        key={statement.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                statement.file_type === 'excel'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                              }`}>
                                {statement.file_type?.toUpperCase() || 'EXCEL'}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(statement.created_at)}
                              </span>
                            </div>

                            {statement.banks_detected?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {statement.banks_detected.map(bank => (
                                  <span
                                    key={bank}
                                    className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
                                  >
                                    {bank}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>{statement.total_transactions || 0} {t('transactions')}</span>
                              <span>{statement.unique_accounts || 0} {t('accounts')}</span>
                            </div>

                            {statement.original_filenames?.length > 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                                {t('Files')}: {statement.original_filenames.join(', ')}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {statement.session_id && (
                              <button
                                onClick={() => handleDownloadBankStatement(statement.session_id)}
                                className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title={t('Download Results')}
                              >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProjectWorkspace;
