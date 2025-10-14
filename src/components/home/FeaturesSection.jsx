import { motion } from "framer-motion";

export default function FeaturesSection({ content, language }) {
  return (
    <div className="mb-8">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-3xl font-bold text-center text-[#222] dark:text-[#f5efe6] mb-12"
      >
        {language === "vi" ? "Tính năng chính" : "Key Features"}
      </motion.h2>
      <div className="grid md:grid-cols-3 gap-8">
        {content.features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            className="bg-[#f7f6f3] dark:bg-[#222] p-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            <feature.icon className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-[#222] dark:text-[#f5efe6] mb-3">
              {feature.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
