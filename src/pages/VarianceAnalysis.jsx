import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import PythonAnalysis from "@components/variance/PythonAnalysis";
import AIAnalysis from "@components/variance/AIAnalysis";
import Breadcrumb from "@components/common/Breadcrumb";

export default function VarianceAnalysis() {
  const [activeTab, setActiveTab] = useState('python');
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
    <div className="min-h-screen bg-white dark:bg-[#181818]">
      <div className="container mx-auto px-6 py-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/project/2")}
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 mb-6 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-[#222] dark:hover:text-[#f5efe6] bg-white dark:bg-[#222] rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
        >
          <span className="text-lg font-bold">←</span>
          <span className="font-medium">{t("backButton")}</span>
        </motion.button>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-[#222] dark:text-[#f5efe6] mb-2 gradient-text">
            {t('varianceAnalysisTitle')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t('varianceAnalysisSubtitle')}
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-[#222] p-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex gap-2 mb-6">
          <motion.button
            onClick={() => setActiveTab('python')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`relative flex-1 py-4 px-6 rounded-lg font-semibold transition-all overflow-hidden ${
              activeTab === 'python'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
            }`}
          >
            {activeTab === 'python' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="text-lg font-bold">Python</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                activeTab === 'python'
                  ? 'bg-white/25 text-white'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              }`}>
                Analysis
              </span>
            </span>
          </motion.button>

          <motion.button
            onClick={() => setActiveTab('ai')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`relative flex-1 py-4 px-6 rounded-lg font-semibold transition-all overflow-hidden ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
            }`}
          >
            {activeTab === 'ai' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="text-lg font-bold">AI</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                activeTab === 'ai'
                  ? 'bg-white/25 text-white'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              }`}>
                Analysis
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
            {activeTab === 'python' ? <PythonAnalysis /> : <AIAnalysis />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-gray-600 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-700">
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
