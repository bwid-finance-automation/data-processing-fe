import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChartBarIcon, ClockIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import HeroSection from "@components/home/HeroSection";
import FeaturesSection from "@components/home/FeaturesSection";
import { motion } from "framer-motion";

export default function Home() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("home")} - BW Industrial`;
  }, [t]);

  const content = {
    title: t("homeTitle"),
    subtitle: t("homeSubtitle"),
    intro: t("homeIntro"),
    exploreDepts: t("homeExploreDepts"),
    aboutTitle: t("homeAboutTitle"),
    aboutText: t("homeAboutText"),
    teamTitle: t("homeTeamTitle"),
    teamText: t("homeTeamText"),
    features: [
      {
        icon: ChartBarIcon,
        title: t("homeFeatureDataTitle"),
        description: t("homeFeatureDataDesc")
      },
      {
        icon: ClockIcon,
        title: t("homeFeatureRealtimeTitle"),
        description: t("homeFeatureRealtimeDesc")
      },
      {
        icon: ShieldCheckIcon,
        title: t("homeFeatureSecureTitle"),
        description: t("homeFeatureSecureDesc")
      }
    ]
  };

  return (
    <div className="min-h-screen theme-bg-app">
      <HeroSection content={content} />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="theme-surface p-8 rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
          >
            <h2 className="text-2xl font-bold theme-text-primary mb-4">
              {content.aboutTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {content.aboutText}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="theme-surface p-8 rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
          >
            <h2 className="text-2xl font-bold theme-text-primary mb-4">
              {content.teamTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {content.teamText}
            </p>
          </motion.div>
        </div>

        <FeaturesSection content={content} />
      </div>
    </div>
  );
}
