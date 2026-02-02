import { motion } from 'framer-motion';
import { ClockIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@components/common';

const CashReport = () => {
  const { t } = useTranslation();

  const breadcrumbItems = [
    { label: t('Home'), href: '/' },
    { label: t('Department'), href: '/department' },
    { label: t('Finance & Accounting Department'), href: '/project/2' },
    { label: t('Cash Report'), href: '/cash-report' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#0d0d0d] p-6">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb items={breadcrumbItems} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white dark:bg-[#222] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-12 text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full">
              <WrenchScrewdriverIcon className="w-16 h-16 text-emerald-500" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t('Cash Report Automation')}
          </h1>

          <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 mb-6">
            <ClockIcon className="w-5 h-5" />
            <span className="text-lg font-medium">{t('Coming Soon')}</span>
          </div>

          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
            {t('This feature is under development. Please check back later.')}
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            {t('In Development')}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CashReport;
