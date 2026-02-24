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
        className="text-3xl font-bold text-center text-[#222] dark:text-[#f5efe6] mb-12"
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
            whileHover={{ y: -10, scale: 1.03 }}
            className="relative bg-[#f7f6f3] dark:bg-[#222] p-6 rounded-xl shadow-md hover:shadow-2xl transition-all border border-transparent hover:border-blue-300 dark:hover:border-blue-700 group overflow-hidden"
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <feature.icon className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold text-[#222] dark:text-[#f5efe6] mb-3">
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
