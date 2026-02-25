import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Button from "@components/common/Button";
import { Badge } from "@components/common/Badge";
import { Skeleton, TableSkeleton, CardSkeleton, StatCardSkeleton, ListSkeleton } from "@components/common/Skeleton";
import { ProgressBar, CircularProgress, Spinner, DotLoader } from "@components/common/ProgressIndicator";
import { AnimatedCounter, StatCard } from "@components/common/AnimatedCounter";
import Breadcrumb from "@components/common/Breadcrumb";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";

export default function ComponentShowcase() {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(65);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = `${t("showcaseTitle")} - BW Industrial`;
  }, [t]);

  const breadcrumbItems = [
    { label: t("home"), href: "/" },
    { label: t("showcaseComponents"), href: "#" },
    { label: t("showcaseShowcase") },
  ];

  return (
    <div className="min-h-screen theme-bg-app py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold theme-text-primary mb-2 gradient-text">
            {t("showcaseTitle")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("showcaseSubtitle")}
          </p>
        </motion.div>

        <Breadcrumb items={breadcrumbItems} className="mb-8" />

        {/* Buttons Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold theme-text-primary mb-4">{t("showcaseButtons")}</h2>
          <div className="theme-surface p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4 mb-4">
              <Button variant="primary">{t("showcasePrimaryBtn")}</Button>
              <Button variant="secondary">{t("showcaseSecondaryBtn")}</Button>
              <Button variant="success" icon={CheckCircleIcon}>{t("showcaseSuccessBtn")}</Button>
              <Button variant="danger" icon={XCircleIcon} iconPosition="right">{t("showcaseDangerBtn")}</Button>
              <Button variant="ocean">{t("showcaseOceanBtn")}</Button>
              <Button variant="ghost">{t("showcaseGhostBtn")}</Button>
            </div>
            <div className="flex flex-wrap gap-4 mb-4">
              <Button variant="primary" size="sm">{t("showcaseSmall")}</Button>
              <Button variant="primary" size="md">{t("showcaseMedium")}</Button>
              <Button variant="primary" size="lg">{t("showcaseLarge")}</Button>
              <Button variant="primary" size="xl">{t("showcaseExtraLarge")}</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" disabled>{t("showcaseDisabled")}</Button>
              <Button variant="primary" loading onClick={() => setLoading(!loading)}>
                {loading ? t("showcaseLoading") : t("showcaseToggleLoading")}
              </Button>
              <Button variant="success" icon={SparklesIcon}>{t("showcaseWithIcon")}</Button>
            </div>
          </div>
        </motion.section>

        {/* Badges Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold theme-text-primary mb-4">{t("showcaseBadges")}</h2>
          <div className="theme-surface p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="success" icon={CheckCircleIcon}>{t("showcaseSuccessBtn")}</Badge>
              <Badge variant="error" icon={XCircleIcon}>{t("Error")}</Badge>
              <Badge variant="warning" icon={ExclamationTriangleIcon}>{t("showcaseWarning")}</Badge>
              <Badge variant="info" icon={InformationCircleIcon}>{t("showcaseInfo")}</Badge>
              <Badge variant="processing">{t("showcaseProcessing")}</Badge>
              <Badge variant="default">{t("showcaseDefault")}</Badge>
            </div>
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="success" pulse>{t("showcaseLive")}</Badge>
              <Badge variant="processing" pulse>{t("showcaseProcessing")}</Badge>
              <Badge variant="error" pulse>{t("showcaseAlert")}</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge variant="success" size="sm">{t("showcaseSmall")}</Badge>
              <Badge variant="info" size="md">{t("showcaseMedium")}</Badge>
              <Badge variant="warning" size="lg">{t("showcaseLarge")}</Badge>
            </div>
          </div>
        </motion.section>

        {/* Progress Indicators Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold theme-text-primary mb-4">{t("showcaseProgressIndicators")}</h2>
          <div className="theme-surface p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="space-y-6 mb-6">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">{t("showcaseProgressPrimary")}</label>
                <ProgressBar progress={progress} variant="primary" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">{t("showcaseProgressSuccess")}</label>
                <ProgressBar progress={85} variant="success" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">{t("showcaseProgressWarning")}</label>
                <ProgressBar progress={45} variant="warning" />
              </div>
              <div className="flex items-center gap-4">
                <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>-</Button>
                <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>+</Button>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">{t("showcaseCircularPrimary")}</label>
                <CircularProgress progress={progress} size={100} variant="primary" />
              </div>
              <div className="text-center">
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">{t("showcaseCircularSuccess")}</label>
                <CircularProgress progress={75} size={100} variant="success" />
              </div>
              <div className="text-center">
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">{t("showcaseCircularWarning")}</label>
                <CircularProgress progress={50} size={100} variant="warning" />
              </div>
              <div className="text-center">
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">{t("showcaseCircularDanger")}</label>
                <CircularProgress progress={25} size={100} variant="danger" />
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">{t("showcaseSpinner")}</label>
                <Spinner size="lg" />
              </div>
              <div className="text-center">
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">{t("showcaseDotLoader")}</label>
                <DotLoader />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Animated Counters Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold theme-text-primary mb-4">{t("showcaseAnimatedCounters")}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <StatCard
              title={t("showcaseTotalRevenue")}
              value={125000}
              prefix="$"
              icon={CurrencyDollarIcon}
              trend="up"
              trendValue="12%"
              variant="success"
            />
            <StatCard
              title={t("showcaseActiveUsers")}
              value={3420}
              icon={UserGroupIcon}
              trend="up"
              trendValue="8%"
              variant="primary"
            />
              <StatCard
                title={t("showcaseConversionRate")}
                value={3.45}
                suffix="%"
                decimals={2}
                icon={ArrowTrendingUpIcon}
                trend="down"
                trendValue="2%"
                variant="warning"
            />
              <StatCard
                title={t("showcaseTotalProjects")}
                value={48}
                icon={ChartBarIcon}
                trend="up"
                trendValue="5%"
                variant="ocean"
              />
          </div>
        </motion.section>

        {/* Skeleton Loaders Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold theme-text-primary mb-4">{t("showcaseSkeletonLoaders")}</h2>
          <div className="space-y-6">
            <div className="theme-surface p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold theme-text-primary mb-4">{t("showcaseBasicSkeletons")}</h3>
              <div className="space-y-3">
                <Skeleton variant="text" />
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="title" />
                <div className="flex gap-4">
                  <Skeleton variant="avatar" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" />
                    <Skeleton variant="text" className="w-2/3" />
                  </div>
                </div>
              </div>
            </div>

            <div className="theme-surface p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold theme-text-primary mb-4">{t("showcaseCardSkeleton")}</h3>
              <CardSkeleton />
            </div>

            <div className="theme-surface p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold theme-text-primary mb-4">{t("showcaseListSkeleton")}</h3>
              <ListSkeleton items={3} />
            </div>

            <div className="theme-surface p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold theme-text-primary mb-4">{t("showcaseTableSkeleton")}</h3>
              <TableSkeleton rows={4} columns={5} />
            </div>
          </div>
        </motion.section>

        {/* Animation Examples */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold theme-text-primary mb-4">{t("showcaseAnimationExamples")}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="theme-surface p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-3 animate-float" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("showcaseFloatAnim")}</p>
            </div>

            <div className="theme-surface p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
              <RocketLaunchIcon className="w-16 h-16 text-blue-500 mx-auto mb-3 animate-bounce-in" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("showcaseBounceIn")}</p>
            </div>

            <div className="theme-surface p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center hover-lift">
              <SparklesIcon className="w-16 h-16 text-blue-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("showcaseHoverLift")}</p>
            </div>

            <div className="theme-surface p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center hover-scale">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("showcaseHoverScale")}</p>
            </div>

            <div className="theme-surface p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center hover-glow">
              <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("showcaseHoverGlow")}</p>
            </div>

            <div className="theme-surface p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-shift rounded-lg mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("showcaseGradientShift")}</p>
            </div>
          </div>
        </motion.section>

        {/* Gradient Text */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="text-5xl font-bold gradient-text mb-4">
            {t("showcaseGradientText")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t("showcaseGradientTextDesc")}
          </p>
        </motion.section>
      </div>
    </div>
  );
}

