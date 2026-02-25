import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function StatsCounter({ content }) {
  const [counters, setCounters] = useState({ projects: 0, clients: 0, years: 0 });

  // Animated counter effect
  useEffect(() => {
    const targets = { projects: 500, clients: 50, years: 10 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;

      setCounters({
        projects: Math.floor(targets.projects * progress),
        clients: Math.floor(targets.clients * progress),
        years: Math.floor(targets.years * progress),
      });

      if (step >= steps) {
        setCounters(targets);
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="theme-surface-muted dark:bg-[#1f1f1f] py-16"
    >
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center theme-text-primary mb-12">
          {content.statsTitle}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center theme-surface p-8 rounded-2xl shadow-md border border-[color:var(--app-border)]"
          >
            <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {counters.projects}+
            </div>
            <div className="text-gray-600 dark:text-gray-300 font-medium">
              {content.projectsLabel}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center theme-surface p-8 rounded-2xl shadow-md border border-[color:var(--app-border)]"
          >
            <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {counters.clients}+
            </div>
            <div className="text-gray-600 dark:text-gray-300 font-medium">
              {content.clientsLabel}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center theme-surface p-8 rounded-2xl shadow-md border border-[color:var(--app-border)]"
          >
            <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {counters.years}+
            </div>
            <div className="text-gray-600 dark:text-gray-300 font-medium">
              {content.yearsLabel}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
