import { motion } from "framer-motion";

const badgeVariants = {
  success: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  error: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  warning: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  processing: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
  default: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600",
};

const sizeVariants = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};

export const Badge = ({
  children,
  variant = "default",
  size = "md",
  pulse = false,
  animated = true,
  className = "",
  icon: Icon,
}) => {
  const baseClass = "inline-flex items-center gap-1.5 font-medium rounded-full border";
  const variantClass = badgeVariants[variant] || badgeVariants.default;
  const sizeClass = sizeVariants[size] || sizeVariants.md;

  const content = (
    <>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${variant === "success" ? "bg-green-400" : variant === "error" ? "bg-red-400" : variant === "processing" ? "bg-sky-400" : "bg-gray-400"}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${variant === "success" ? "bg-green-500" : variant === "error" ? "bg-red-500" : variant === "processing" ? "bg-sky-500" : "bg-gray-500"}`}></span>
        </span>
      )}
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </>
  );

  if (animated) {
    return (
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      >
        {content}
      </motion.span>
    );
  }

  return (
    <span className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}>
      {content}
    </span>
  );
};

export default Badge;
