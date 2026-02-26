import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import AIAnalysis from "@components/variance/AIAnalysis";
import Account511Analysis from "@components/variance/Account511Analysis";
import Breadcrumb from "@components/common/Breadcrumb";
import ModuleHistory from "@components/common/ModuleHistory";

export default function VarianceAnalysis() {
  const [activeTab, setActiveTab] = useState('ai');
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${t('varianceAnalysisTitle')} - BW Industrial`;
  }, [t]);

  const breadcrumbItems = [
    { label: t("home") || "Home", href: "/" },
    { label: t("departments") || "Departments", href: "/department" },
    { label: t("financeAccountingDept"), href: "/project/2" },
    { label: t('varianceAnalysisTitle') },
  ];

  return (
    <div className="min-h-screen theme-bg-app">
      <div className="w-full max-w-[85vw] mx-auto py-5">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={breadcrumbItems} className="mb-4" />

        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/project/2")}
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 mb-4 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 theme-surface rounded-lg border border-[color:var(--app-border)] hover:border-gray-300 dark:hover:border-gray-600 transition-all"
        >
          <span className="text-lg font-bold">←</span>
          <span className="font-medium">{t("backButton")}</span>
        </motion.button>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <h1 className="text-2xl font-bold text-[#222] dark:text-[#f5efe6] mb-1 gradient-text">
            {t('varianceAnalysisTitle')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t('varianceAnalysisSubtitle')}
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="theme-surface p-1.5 rounded-lg shadow-md border border-[color:var(--app-border)] flex gap-1.5 mb-5">
          <motion.button
            onClick={() => setActiveTab('ai')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`relative flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-all overflow-hidden ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
            }`}
          >
            {activeTab === 'ai' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 rounded-md"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <span className="font-bold">AI</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                activeTab === 'ai'
                  ? 'bg-white/25 text-white'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              }`}>
                Analysis
              </span>
            </span>
          </motion.button>

          <motion.button
            onClick={() => setActiveTab('account511')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`relative flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-all overflow-hidden ${
              activeTab === 'account511'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
            }`}
          >
            {activeTab === 'account511' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-md"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <span className="font-bold">Account 511</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                activeTab === 'account511'
                  ? 'bg-white/25 text-white'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              }`}>
                Revenue
              </span>
            </span>
          </motion.button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'ai' && <AIAnalysis />}
            {activeTab === 'account511' && <Account511Analysis />}
          </motion.div>
        </AnimatePresence>
        {/* History Section */}
        <ModuleHistory
          moduleKey="variance"
          className="mt-6"
        />
      </div>

      {/* Footer */}
      <footer className="mt-8 py-4 text-center text-gray-600 dark:text-gray-400 text-xs border-t border-[color:var(--app-border)]">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {t('Variance Analysis')}
        </motion.p>
      </footer>
    </div>
  );
}
