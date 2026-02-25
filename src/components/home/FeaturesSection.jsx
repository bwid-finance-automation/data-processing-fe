import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function FeaturesSection({ content }) {
  const { t } = useTranslation();

  return (
    <div className="mb-8">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-3xl font-bold text-center theme-text-primary mb-12"
      >
        {t("homeKeyFeatures")}
      </motion.h2>
      <div className="grid md:grid-cols-3 gap-8">
        {content.features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            whileHover={{ y: -2 }}
            className="relative theme-surface p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
          >
            <div>
              <feature.icon className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold theme-text-primary mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
