import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EllipsisVerticalIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const ActionMenu = ({ items = [], disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // Calculate dropdown position relative to viewport
  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => setIsOpen(false);
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // Recalculate position on open and on resize
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isOpen, updatePosition]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={btnRef}
        onClick={() => {
          if (disabled) return;
          if (!isOpen) updatePosition();
          setIsOpen(!isOpen);
        }}
        disabled={disabled}
        className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
        title="More actions"
      >
        <EllipsisVerticalIcon className="w-5 h-5" />
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'fixed', top: position.top, right: position.right }}
              className="w-48 bg-white dark:bg-[#2a2a2a] shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 py-1 z-[9999] overflow-hidden"
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
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default ActionMenu;
