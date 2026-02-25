import { Link } from "react-router-dom";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

export const Breadcrumb = ({ items = [], className = "" }) => {
  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="inline-flex items-center"
            >
              {index > 0 && (
                <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 mx-1" />
              )}

              {isLast ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {index === 0 && !item.icon ? (
                    <HomeIcon className="w-4 h-4" />
                  ) : (
                    item.icon && <item.icon className="w-4 h-4" />
                  )}
                  {item.label}
                </Link>
              )}
            </motion.li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
