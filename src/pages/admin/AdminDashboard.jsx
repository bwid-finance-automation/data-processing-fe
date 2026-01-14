import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  UsersIcon,
  FolderIcon,
  ChartBarIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@configs/AuthProvider";
import { authApi } from "@services/auth/auth-apis";
import { getProjects } from "@services/project/project-apis";
import { getAIUsageDashboard, formatTokens, formatCost } from "@services/ai-usage/ai-usage-apis";

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { accessToken } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    totalCases: 0,
    aiRequests: 0,
    aiTokens: 0,
    aiCost: 0,
    systemHealth: "good",
  });
  const [aiUsageData, setAiUsageData] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Admin Dashboard - BW Industrial";
    if (accessToken) {
      loadDashboardData();
    }
  }, [accessToken]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    let normalizedDate = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
      normalizedDate = dateString + 'Z';
    }
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    const now = new Date();
    const date = new Date(normalizedDate);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('Just now');
    if (diffMins < 60) return `${diffMins} ${t('minutes ago')}`;
    if (diffHours < 24) return `${diffHours} ${t('hours ago')}`;
    if (diffDays < 7) return `${diffDays} ${t('days ago')}`;
    return date.toLocaleDateString(locale);
  };

  const loadDashboardData = async () => {
    try {
      // Load all data in parallel with individual error handling
      const usersPromise = authApi.listUsers(accessToken, { page: 1, pageSize: 1 })
        .then(res => res?.data?.total || 0)
        .catch((err) => {
          console.warn("Failed to load users:", err.message);
          return 0;
        });

      const projectsPromise = getProjects(0, 100)
        .then(res => ({
          projects: res?.projects || [],
          total: res?.total || 0,
        }))
        .catch((err) => {
          console.warn("Failed to load projects:", err.message);
          return { projects: [], total: 0 };
        });

      const aiUsagePromise = getAIUsageDashboard({ days: 30 })
        .catch((err) => {
          console.warn("Failed to load AI usage:", err.message);
          return null;
        });

      const [totalUsers, projectsData, aiUsageResponse] = await Promise.all([
        usersPromise,
        projectsPromise,
        aiUsagePromise,
      ]);

      // Calculate total cases from projects
      let totalCases = 0;
      projectsData.projects.forEach(project => {
        if (project.cases && Array.isArray(project.cases)) {
          totalCases += project.cases.length;
        }
      });

      setStats(prev => ({
        ...prev,
        totalUsers: totalUsers,
        activeUsers: totalUsers,
        totalProjects: projectsData.total,
        totalCases: totalCases,
        aiRequests: aiUsageResponse?.stats?.total_requests || 0,
        aiTokens: aiUsageResponse?.stats?.total_tokens || 0,
        aiCost: aiUsageResponse?.stats?.total_cost_usd || 0,
        systemHealth: "good",
      }));

      if (aiUsageResponse) {
        setAiUsageData(aiUsageResponse);
        // Use recent logs from AI usage as recent activity
        if (aiUsageResponse.recent_logs && aiUsageResponse.recent_logs.length > 0) {
          setRecentLogs(aiUsageResponse.recent_logs.slice(0, 5));
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: t("Total Users"),
      value: stats.totalUsers.toLocaleString(),
      icon: UsersIcon,
      color: "bg-blue-500",
      link: "/admin/users",
    },
    {
      name: t("Projects"),
      value: stats.totalProjects.toLocaleString(),
      icon: FolderIcon,
      color: "bg-green-500",
      link: "/admin/cases",
    },
    {
      name: t("AI Requests"),
      value: stats.aiRequests.toLocaleString(),
      subtitle: t("Last 30 days"),
      icon: CpuChipIcon,
      color: "bg-purple-500",
      link: "/admin/ai-usage",
    },
    {
      name: t("AI Tokens"),
      value: formatTokens(stats.aiTokens),
      subtitle: formatCost(stats.aiCost),
      icon: ChartBarIcon,
      color: "bg-indigo-500",
      link: "/admin/ai-usage",
    },
  ];

  const quickActions = [
    { name: t("Manage Users"), href: "/admin/users", icon: UsersIcon, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    { name: t("View Cases"), href: "/admin/cases", icon: FolderIcon, color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
    { name: t("AI Usage Report"), href: "/admin/ai-usage", icon: ChartBarIcon, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
    { name: t("System Settings"), href: "/admin/settings", icon: DocumentTextIcon, color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("Admin Dashboard")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t("Overview of system status and quick actions")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={stat.link}
              className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{stat.subtitle}</p>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("Quick Actions")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg ${action.color} hover:opacity-80 transition-opacity`}
              >
                <action.icon className="w-6 h-6" />
                <span className="text-sm font-medium text-center">{action.name}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent AI Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("Recent AI Activity")}
            </h2>
            <Link to="/admin/ai-usage" className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
              {t("View all")}
            </Link>
          </div>
          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                {t("No recent AI activity")}
              </p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <CpuChipIcon className={`w-5 h-5 ${log.success ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.task_type === 'ocr' ? t('Bank Statement OCR') :
                       log.task_type === 'contract_ocr' ? t('Contract OCR') :
                       log.task_type === 'analysis' ? t('Variance Analysis') :
                       log.task_type === 'gla' ? t('GLA Analysis') :
                       log.task_type}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {log.provider} • {formatTokens(log.total_tokens)} tokens • {formatCost(log.estimated_cost_usd)}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {formatDate(log.requested_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("System Health")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">API Server</p>
              <p className="text-sm text-green-600 dark:text-green-500">{t("Operational")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">Database</p>
              <p className="text-sm text-green-600 dark:text-green-500">{t("Operational")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">AI Services</p>
              <p className="text-sm text-green-600 dark:text-green-500">{t("Operational")}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
