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
  PlusIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  TableCellsIcon,
  BoltIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/common/Breadcrumb';
import {
  getProject,
  getProjectCases,
  getProjectBankStatements,
  getProjectContracts,
  getProjectGla,
  getProjectVariance,
  getProjectUtilityBilling,
  getProjectExcelComparison,
  verifyProjectPassword
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
  const [contracts, setContracts] = useState([]);
  const [glaAnalysis, setGlaAnalysis] = useState([]);
  const [varianceAnalysis, setVarianceAnalysis] = useState([]);
  const [utilityBilling, setUtilityBilling] = useState([]);
  const [excelComparison, setExcelComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Password protection state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [pendingProjectData, setPendingProjectData] = useState(null);

  // Fetch project data
  const fetchProjectData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch project info first to check if protected
      const projectData = await getProject(uuid);

      // Check if project is protected
      if (projectData.is_protected) {
        // Check if already verified in sessionStorage
        const verifiedProjects = JSON.parse(sessionStorage.getItem('verifiedProjects') || '{}');
        if (!verifiedProjects[uuid]) {
          // Need password verification
          setPendingProjectData(projectData);
          setShowPasswordDialog(true);
          setLoading(false);
          return;
        }
      }

      // Project is not protected or already verified, continue loading
      await loadProjectDetails(projectData);
    } catch (err) {
      console.error('Error fetching project data:', err);
      if (err.response?.status === 404) {
        setError(t('Project not found'));
      } else {
        setError(err.response?.data?.detail || t('Failed to load project'));
      }
      setLoading(false);
    }
  }, [uuid, t]);

  // Helper to safely fetch case data
  const fetchCaseData = async (fetchFn, setFn, caseName) => {
    try {
      const data = await fetchFn(uuid);
      const sessions = data?.sessions || data?.cases || data || [];
      setFn(Array.isArray(sessions) ? sessions : []);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error(`Error fetching ${caseName}:`, err);
      }
      setFn([]);
    }
  };

  // Load project details after verification
  const loadProjectDetails = async (projectData) => {
    try {
      const casesData = await getProjectCases(uuid);
      setProject(projectData);
      setCases(casesData);

      // Fetch all case types in parallel
      await Promise.all([
        fetchCaseData(getProjectBankStatements, setBankStatements, 'bank statements'),
        fetchCaseData(getProjectContracts, setContracts, 'contracts'),
        fetchCaseData(getProjectGla, setGlaAnalysis, 'GLA analysis'),
        fetchCaseData(getProjectVariance, setVarianceAnalysis, 'variance analysis'),
        fetchCaseData(getProjectUtilityBilling, setUtilityBilling, 'utility billing'),
        fetchCaseData(getProjectExcelComparison, setExcelComparison, 'excel comparison'),
      ]);
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError(err.response?.data?.detail || t('Failed to load project'));
    } finally {
      setLoading(false);
    }
  };

  // Handle password verification
  const handlePasswordSubmit = async () => {
    if (!password || !pendingProjectData) return;

    setVerifyingPassword(true);
    setPasswordError('');

    try {
      const result = await verifyProjectPassword(uuid, password);

      if (result.verified) {
        // Save to sessionStorage
        const verifiedProjects = JSON.parse(sessionStorage.getItem('verifiedProjects') || '{}');
        verifiedProjects[uuid] = true;
        sessionStorage.setItem('verifiedProjects', JSON.stringify(verifiedProjects));

        // Close dialog and load project details
        setShowPasswordDialog(false);
        setPassword('');
        setLoading(true);
        await loadProjectDetails(pendingProjectData);
        setPendingProjectData(null);
      } else {
        setPasswordError(t('Incorrect password'));
      }
    } catch (err) {
      console.error('Error verifying password:', err);
      setPasswordError(t('Failed to verify password'));
    } finally {
      setVerifyingPassword(false);
    }
  };

  // Handle password cancel
  const handlePasswordCancel = () => {
    setShowPasswordDialog(false);
    setPassword('');
    setPasswordError('');
    setPendingProjectData(null);
    navigate('/projects');
  };

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  useEffect(() => {
    if (project) {
      document.title = `${project.project_name} - BW Industrial`;
    }
  }, [project]);

  const breadcrumbItems = [
    { label: t('Home'), href: '/' },
    { label: t('Projects'), href: '/projects' },
    { label: project?.project_name || '...', icon: FolderIcon }
  ];

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    // Append 'Z' if not present to indicate UTC time
    let dateString = isoString;
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
      dateString += 'Z';
    }
    const date = new Date(dateString);
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

  const handleNavigateToContractOCR = () => {
    navigate(`/contract-ocr?project=${uuid}`);
  };

  const handleNavigateToGlaVariance = () => {
    navigate(`/gla-variance-analysis?project=${uuid}`);
  };

  const handleNavigateToVarianceAnalysis = () => {
    navigate(`/variance-analysis?project=${uuid}`);
  };

  const handleNavigateToUtilityBilling = () => {
    navigate(`/utility-billing?project=${uuid}`);
  };

  const handleNavigateToExcelComparison = () => {
    navigate(`/excel-comparison?project=${uuid}`);
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
                  {project?.project_name}
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
          <div className="mt-6 flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('Overview')}
            </button>
            <button
              onClick={() => setActiveTab('bank-statements')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'bank-statements'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('Bank Statements')} ({bankStatements.length})
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'contracts'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('Contracts')} ({contracts.length})
            </button>
            <button
              onClick={() => setActiveTab('gla')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'gla'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('GLA Variance')} ({glaAnalysis.length})
            </button>
            <button
              onClick={() => setActiveTab('variance')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'variance'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('Variance Analysis')} ({varianceAnalysis.length})
            </button>
            <button
              onClick={() => setActiveTab('utility-billing')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'utility-billing'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('Utility Billing')} ({utilityBilling.length})
            </button>
            <button
              onClick={() => setActiveTab('excel-comparison')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'excel-comparison'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('Excel Comparison')} ({excelComparison.length})
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
                  {/* Bank Statement Parser */}
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

                  {/* Contract OCR */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNavigateToContractOCR}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all group"
                  >
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800/30 transition-colors">
                      <DocumentDuplicateIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {t('Contract OCR')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('Extract data from contracts')}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400 ml-auto" />
                  </motion.button>

                  {/* GLA Variance Analysis */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNavigateToGlaVariance}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all group"
                  >
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800/30 transition-colors">
                      <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {t('GLA Variance')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('Analyze GLA period variance')}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400 ml-auto" />
                  </motion.button>

                  {/* Variance Analysis */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNavigateToVarianceAnalysis}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 transition-all group"
                  >
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-800/30 transition-colors">
                      <DocumentChartBarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {t('Variance Analysis')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('Python/AI variance analysis')}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400 ml-auto" />
                  </motion.button>

                  {/* Utility Billing */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNavigateToUtilityBilling}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800 hover:border-cyan-400 dark:hover:border-cyan-600 transition-all group"
                  >
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800/30 transition-colors">
                      <BoltIcon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {t('Utility Billing')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('Process utility bills')}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400 ml-auto" />
                  </motion.button>

                  {/* Excel Comparison */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNavigateToExcelComparison}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
                  >
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/30 transition-colors">
                      <TableCellsIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {t('Excel Comparison')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('Compare Excel files')}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400 ml-auto" />
                  </motion.button>
                </div>
              </div>

              {/* Bank Statement History */}
              <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <BanknotesIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    {t('Bank Statement History')}
                    <span className="text-sm font-normal text-gray-500">({bankStatements.length})</span>
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNavigateToBankParser}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                    {t('Parse New')}
                  </motion.button>
                </div>

                {bankStatements.length === 0 ? (
                  <div className="text-center py-8">
                    <BanknotesIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('No bank statements yet. Start by parsing bank statements.')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {bankStatements.slice(0, 10).map((entry, index) => (
                      <motion.div
                        key={entry.id || entry.session_id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              entry.file_type === 'pdf'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            }`}>
                              {entry.file_type === 'pdf' ? 'PDF' : 'Excel'}
                            </span>
                            {entry.bank_name && (
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                                {entry.bank_name}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(entry.created_at || entry.timestamp)}
                          </span>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <span>{entry.transaction_count || entry.total_transactions || 0} {t('transactions')}</span>
                          {entry.account_number && (
                            <span>{t('Account')}: {entry.account_number}</span>
                          )}
                          {entry.processing_time && (
                            <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                              ⏱ {entry.processing_time}s
                            </span>
                          )}
                        </div>

                        {/* Files */}
                        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          {/* Original file */}
                          {entry.original_filename && (
                            <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <DocumentTextIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('Original File')}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{entry.original_filename}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Combined result */}
                          {(entry.download_url || entry.session_id) && (
                            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <ArrowDownTrayIcon className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-green-700 dark:text-green-300">{t('Combined Result')}</p>
                                  <p className="text-xs text-green-600 dark:text-green-400">bank_statements_{entry.session_id || entry.id}.xlsx</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDownloadBankStatement(entry.session_id || entry.download_url?.split('/').pop())}
                                className="p-1.5 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                                title={t('Download Results')}
                              >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
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
                              <span>{statement.total_accounts || statement.total_balances || 0} {t('accounts')}</span>
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

          {/* Contracts Tab */}
          {activeTab === 'contracts' && (
            <motion.div
              key="contracts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('Contract OCR History')}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNavigateToContractOCR}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    {t('Process New')}
                  </motion.button>
                </div>

                {contracts.length === 0 ? (
                  <div className="text-center py-16">
                    <DocumentDuplicateIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('No contracts')}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      {t('Upload and process contracts to see them here')}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNavigateToContractOCR}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all"
                    >
                      <DocumentDuplicateIcon className="h-5 w-5" />
                      {t('Process Contracts')}
                    </motion.button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {contracts.map((contract, index) => (
                      <motion.div
                        key={contract.uuid || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {/* Header with badges */}
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                CONTRACT
                              </span>
                              {contract.contract_type && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300">
                                  {contract.contract_type}
                                </span>
                              )}
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(contract.processed_at)}
                              </span>
                            </div>

                            {/* Contract info */}
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {contract.contract_number || contract.file_name || `Contract ${index + 1}`}
                            </p>

                            {/* Tenant/Customer */}
                            {(contract.tenant || contract.customer_name) && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('Tenant')}: {contract.tenant || contract.customer_name}
                              </p>
                            )}

                            {/* Additional info */}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                              {contract.lease_start && (
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="h-4 w-4" />
                                  {contract.lease_start} - {contract.lease_end || '...'}
                                </span>
                              )}
                              {contract.monthly_rent && (
                                <span className="font-medium text-purple-600 dark:text-purple-400">
                                  {contract.monthly_rent.toLocaleString()} VND/month
                                </span>
                              )}
                            </div>

                            {/* File name */}
                            {contract.file_name && contract.contract_number && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                                {t('File')}: {contract.file_name}
                              </p>
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

          {/* GLA Variance Tab */}
          {activeTab === 'gla' && (
            <motion.div
              key="gla"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('GLA Variance Analysis History')}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNavigateToGlaVariance}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    {t('Analyze New')}
                  </motion.button>
                </div>

                {glaAnalysis.length === 0 ? (
                  <div className="text-center py-16">
                    <ChartBarIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('No GLA analysis')}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      {t('Run GLA variance analysis to see results here')}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNavigateToGlaVariance}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg font-semibold transition-all"
                    >
                      <ChartBarIcon className="h-5 w-5" />
                      {t('GLA Variance Analysis')}
                    </motion.button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {glaAnalysis.map((analysis, index) => (
                      <motion.div
                        key={analysis.uuid || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {/* Header with badges */}
                            <div className="flex items-center gap-3 mb-2">
                              {analysis.product_type && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                  {analysis.product_type}
                                </span>
                              )}
                              {analysis.region && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                  {analysis.region}
                                </span>
                              )}
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(analysis.processed_at)}
                              </span>
                            </div>

                            {/* Project info */}
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {analysis.project_name || analysis.file_name || `GLA Analysis ${index + 1}`}
                            </p>
                            {analysis.project_code && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('Code')}: {analysis.project_code}
                              </p>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {analysis.period_label && (
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="h-4 w-4" />
                                  {analysis.period_label}
                                </span>
                              )}
                              {analysis.total_gla_sqm && (
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  {analysis.total_gla_sqm.toLocaleString()} sqm
                                </span>
                              )}
                            </div>

                            {/* File name */}
                            {analysis.file_name && analysis.project_name && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                                {t('File')}: {analysis.file_name}
                              </p>
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

          {/* Variance Analysis Tab */}
          {activeTab === 'variance' && (
            <motion.div
              key="variance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('Variance Analysis History')}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNavigateToVarianceAnalysis}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    {t('Analyze New')}
                  </motion.button>
                </div>

                {varianceAnalysis.length === 0 ? (
                  <div className="text-center py-16">
                    <DocumentChartBarIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('No variance analysis')}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      {t('Run variance analysis to see results here')}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNavigateToVarianceAnalysis}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg font-semibold transition-all"
                    >
                      <DocumentChartBarIcon className="h-5 w-5" />
                      {t('Variance Analysis')}
                    </motion.button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {varianceAnalysis.map((analysis, index) => (
                      <motion.div
                        key={analysis.session_id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {/* Header with badges */}
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                analysis.analysis_type === 'AI_POWERED'
                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                  : analysis.analysis_type === 'REVENUE_VARIANCE'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              }`}>
                                {analysis.analysis_type === 'AI_POWERED' ? 'AI Analysis' :
                                 analysis.analysis_type === 'REVENUE_VARIANCE' ? 'Revenue' :
                                 analysis.analysis_type === 'PYTHON_VARIANCE' ? 'Python' : 'Python'}
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                analysis.status === 'COMPLETED'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : analysis.status === 'FAILED'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              }`}>
                                {analysis.status || 'COMPLETED'}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(analysis.created_at || analysis.started_at)}
                              </span>
                            </div>

                            {/* Session info */}
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {analysis.session_id || `Analysis ${index + 1}`}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <DocumentTextIcon className="h-4 w-4" />
                                {analysis.files_count || 0} {t('files')}
                              </span>
                              {analysis.completed_at && analysis.started_at && (
                                <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                                  ⏱ {Math.round((new Date(analysis.completed_at) - new Date(analysis.started_at)) / 1000)}s
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Utility Billing Tab */}
          {activeTab === 'utility-billing' && (
            <motion.div
              key="utility-billing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('Utility Billing History')}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNavigateToUtilityBilling}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    {t('Process New')}
                  </motion.button>
                </div>

                {utilityBilling.length === 0 ? (
                  <div className="text-center py-16">
                    <BoltIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('No utility billing')}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      {t('Process utility bills to see them here')}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNavigateToUtilityBilling}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white rounded-lg font-semibold transition-all"
                    >
                      <BoltIcon className="h-5 w-5" />
                      {t('Utility Billing')}
                    </motion.button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {utilityBilling.map((billing, index) => (
                      <motion.div
                        key={billing.session_id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {/* Header with badges */}
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-2 py-0.5 text-xs font-medium rounded bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
                                UTILITY
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                billing.status === 'COMPLETED'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : billing.status === 'FAILED'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              }`}>
                                {billing.status || 'COMPLETED'}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(billing.created_at || billing.started_at)}
                              </span>
                            </div>

                            {/* Session info */}
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {billing.session_id || `Billing Session ${index + 1}`}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <DocumentTextIcon className="h-4 w-4" />
                                {billing.files_count || 0} {t('files')}
                              </span>
                              {billing.completed_at && billing.started_at && (
                                <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                                  ⏱ {Math.round((new Date(billing.completed_at) - new Date(billing.started_at)) / 1000)}s
                                </span>
                              )}
                            </div>

                            {/* Processing details */}
                            {billing.processing_details && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                                {billing.processing_details}
                              </p>
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

          {/* Excel Comparison Tab */}
          {activeTab === 'excel-comparison' && (
            <motion.div
              key="excel-comparison"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('Excel Comparison History')}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNavigateToExcelComparison}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    {t('Compare New')}
                  </motion.button>
                </div>

                {excelComparison.length === 0 ? (
                  <div className="text-center py-16">
                    <TableCellsIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('No excel comparisons')}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      {t('Compare Excel files to see results here')}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNavigateToExcelComparison}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg font-semibold transition-all"
                    >
                      <TableCellsIcon className="h-5 w-5" />
                      {t('Excel Comparison')}
                    </motion.button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {excelComparison.map((comparison, index) => (
                      <motion.div
                        key={comparison.session_id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {/* Header with badges */}
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-2 py-0.5 text-xs font-medium rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                                COMPARISON
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                comparison.status === 'COMPLETED'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : comparison.status === 'FAILED'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              }`}>
                                {comparison.status || 'COMPLETED'}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(comparison.created_at || comparison.started_at)}
                              </span>
                            </div>

                            {/* Session info */}
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {comparison.session_id || `Comparison ${index + 1}`}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <TableCellsIcon className="h-4 w-4" />
                                {comparison.files_count || 2} {t('files compared')}
                              </span>
                              {comparison.completed_at && comparison.started_at && (
                                <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                                  ⏱ {Math.round((new Date(comparison.completed_at) - new Date(comparison.started_at)) / 1000)}s
                                </span>
                              )}
                            </div>

                            {/* Processing details */}
                            {comparison.processing_details && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                                {comparison.processing_details}
                              </p>
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

      {/* Password Dialog Modal */}
      {showPasswordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#222] rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <LockClosedIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('Project Password Required')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('This project is password protected')}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 truncate">
                {t('Project')}: <span className="font-medium">{pendingProjectData?.project_name}</span>
              </p>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !verifyingPassword && handlePasswordSubmit()}
                  placeholder={t('Enter project password')}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    passwordError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  autoFocus
                  disabled={verifyingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-sm text-red-500">{passwordError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePasswordCancel}
                disabled={verifyingPassword}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handlePasswordSubmit}
                disabled={!password || verifyingPassword}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifyingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('Verifying...')}
                  </>
                ) : (
                  t('Unlock')
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProjectWorkspace;
