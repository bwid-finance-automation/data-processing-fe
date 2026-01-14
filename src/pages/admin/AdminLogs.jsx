import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function AdminLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  useEffect(() => {
    document.title = "System Logs - Admin";
    loadLogs();
  }, [levelFilter]);

  const loadLogs = async () => {
    try {
      // Mock data - replace with real API calls
      setLogs([
        { id: 1, level: "info", message: "User login successful", user: "admin.finance@bwidjsc.com", timestamp: "2024-01-15 10:30:15", source: "auth" },
        { id: 2, level: "warning", message: "Rate limit approaching for AI service", user: "system", timestamp: "2024-01-15 10:25:00", source: "ai-service" },
        { id: 3, level: "error", message: "Failed to process bank statement", user: "john.doe@bwidjsc.com", timestamp: "2024-01-15 10:20:45", source: "bank-parser" },
        { id: 4, level: "info", message: "Database backup completed successfully", user: "system", timestamp: "2024-01-15 10:00:00", source: "backup" },
        { id: 5, level: "info", message: "New user registered via Google OAuth", user: "jane.smith@bwidjsc.com", timestamp: "2024-01-15 09:45:30", source: "auth" },
        { id: 6, level: "warning", message: "High memory usage detected", user: "system", timestamp: "2024-01-15 09:30:00", source: "monitoring" },
        { id: 7, level: "error", message: "External API timeout", user: "system", timestamp: "2024-01-15 09:15:20", source: "external-api" },
        { id: 8, level: "info", message: "Scheduled cleanup completed", user: "system", timestamp: "2024-01-15 09:00:00", source: "scheduler" },
      ]);
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case "info":
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
      case "warning":
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case "success":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLevelBadge = (level) => {
    const styles = {
      info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${styles[level] || styles.info}`}>
        {level}
      </span>
    );
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.source.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

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
          {t("System Logs")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t("View system activity and error logs")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("Total Logs")}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{logs.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("Info")}</p>
          <p className="text-2xl font-bold text-blue-600">{logs.filter((l) => l.level === "info").length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("Warnings")}</p>
          <p className="text-2xl font-bold text-yellow-600">{logs.filter((l) => l.level === "warning").length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("Errors")}</p>
          <p className="text-2xl font-bold text-red-600">{logs.filter((l) => l.level === "error").length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("Search logs...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">{t("All Levels")}</option>
            <option value="info">{t("Info")}</option>
            <option value="warning">{t("Warning")}</option>
            <option value="error">{t("Error")}</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("Level")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("Message")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("Source")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("User")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("Timestamp")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getLevelIcon(log.level)}
                      {getLevelBadge(log.level)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 dark:text-white">{log.message}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                      {log.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t("No logs found")}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
