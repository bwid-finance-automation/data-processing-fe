import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import PythonAnalysis from "@components/variance/PythonAnalysis";
import AIAnalysis from "@components/variance/AIAnalysis";

export default function VarianceAnalysis() {
  const [activeTab, setActiveTab] = useState('python');
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/project/2")}
          className="flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>{t("backButton")}</span>
        </button>

        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {t('varianceAnalysisTitle')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('varianceAnalysisSubtitle')}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('python')}
            className={`flex-1 py-3 px-6 rounded-t-xl font-medium transition-all ${
              activeTab === 'python'
                ? 'bg-white dark:bg-[#222] text-blue-600 dark:text-blue-400 shadow-lg transform scale-105'
                : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-gray-800/70'
            }`}
          >
            <span className="text-xl mr-2">🐍</span>
            {t('pythonTab')}
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 px-6 rounded-t-xl font-medium transition-all ${
              activeTab === 'ai'
                ? 'bg-white dark:bg-[#222] text-purple-600 dark:text-purple-400 shadow-lg transform scale-105'
                : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-gray-800/70'
            }`}
          >
            <span className="text-xl mr-2">🤖</span>
            {t('aiTab')}
          </button>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === 'python' ? <PythonAnalysis /> : <AIAnalysis />}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-gray-600 dark:text-gray-400 text-sm">
        <p>{t('varianceAnalysisFooter')}</p>
      </footer>
    </div>
  );
}
