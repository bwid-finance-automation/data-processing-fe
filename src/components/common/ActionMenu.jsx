import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EllipsisVerticalIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useClickOutside } from '../../hooks/useClickOutside';

const ActionMenu = ({ items = [], disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside(() => setIsOpen(false), isOpen);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
        title="More actions"
      >
        <EllipsisVerticalIcon className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-1 w-48 bg-white dark:bg-[#2a2a2a] shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 py-1 z-50 overflow-hidden"
          >
            {items.map((item, idx) => {
              if (item.type === 'divider') {
                return <div key={idx} className="my-1 border-t border-gray-100 dark:border-gray-700" />;
              }

              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    item.onClick?.();
                    setIsOpen(false);
                  }}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors disabled:opacity-50
                    ${item.variant === 'danger'
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : item.variant === 'warning'
                        ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
                  `}
                >
                  {item.loading
                    ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    : Icon && <Icon className="w-4 h-4" />
                  }
                  <span>{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActionMenu;
