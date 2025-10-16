import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function HeroSection({ content }) {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-gray-800 dark:to-gray-900 text-white py-20 px-6 transition-colors">
      <div className="max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold mb-4"
        >
          {content.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-blue-100 mb-6"
        >
          {content.subtitle}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg text-blue-50 max-w-3xl mx-auto mb-8"
        >
          {content.intro}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <button
            onClick={() => navigate("/department")}
            className="px-8 py-3 bg-white text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-all hover:scale-105 shadow-lg"
          >
            {content.exploreDepts}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
