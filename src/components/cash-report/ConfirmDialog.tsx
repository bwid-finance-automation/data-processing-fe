import { motion, AnimatePresence } from 'framer-motion';
import { TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  type: 'warning' | 'danger';
  onConfirm: (() => void) | null;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, type, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-[#222] rounded-2xl shadow-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${
                type === 'danger'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-amber-100 dark:bg-amber-900/30'
              }`}>
                {type === 'danger' ? (
                  <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                ) : (
                  <ArrowPathIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={onConfirm ?? undefined}
                className={`flex-1 py-2.5 px-4 rounded-lg text-white font-medium transition-colors ${
                  type === 'danger'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {type === 'danger' ? t('Delete') : t('Reset')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
