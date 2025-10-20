import { useEffect, useState, useRef } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";

export const AnimatedCounter = ({
  value,
  duration = 2,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}) => {
  const nodeRef = useRef(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-100px" });
  const [hasAnimated, setHasAnimated] = useState(false);

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const display = useTransform(spring, (current) =>
    (Math.floor(current * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals)
  );

  useEffect(() => {
    if (isInView && !hasAnimated) {
      spring.set(value);
      setHasAnimated(true);
    }
  }, [isInView, value, spring, hasAnimated]);

  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    return display.on("change", (latest) => {
      setDisplayValue(latest);
    });
  }, [display]);

  return (
    <span ref={nodeRef} className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  prefix = "",
  suffix = "",
  decimals = 0,
  variant = "default",
}) => {
  const variantColors = {
    default: "from-blue-500 to-blue-600",
    success: "from-green-500 to-green-600",
    warning: "from-yellow-500 to-yellow-600",
    danger: "from-red-500 to-red-600",
    purple: "from-purple-500 to-purple-600",
    ocean: "from-sky-500 to-sky-600",
  };

  const gradientClass = variantColors[variant] || variantColors.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#222] overflow-hidden group hover:shadow-lg transition-shadow"
    >
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
          {Icon && (
            <div className={`p-2 rounded-lg bg-gradient-to-br ${gradientClass} text-white`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-3xl font-bold text-gray-900 dark:text-gray-100"
          >
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
          </motion.div>

          {trend && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className={`text-sm font-medium flex items-center gap-1 ${
                trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              <svg
                className={`w-4 h-4 ${trend === "down" ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {trendValue}
            </motion.span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedCounter;
