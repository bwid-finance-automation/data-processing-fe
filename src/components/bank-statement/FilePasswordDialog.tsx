import { motion } from 'framer-motion';
import {
  LockClosedIcon,
  ArchiveBoxIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface FilePasswordDialogState {
  open: boolean;
  fileName: string;
  password: string;
  fileType: string;
}

interface FilePasswordDialogProps {
  dialog: FilePasswordDialogState;
  onPasswordChange: (password: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  error: string;
  verifying: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function FilePasswordDialog({
  dialog,
  onPasswordChange,
  showPassword,
  onToggleShowPassword,
  error,
  verifying,
  onSubmit,
  onCancel,
}: FilePasswordDialogProps) {
  const { t } = useTranslation();

  if (!dialog.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#222] rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${
            dialog.fileType === 'zip'
              ? 'bg-purple-100 dark:bg-purple-900/30'
              : 'bg-amber-100 dark:bg-amber-900/30'
          }`}>
            {dialog.fileType === 'zip' ? (
              <ArchiveBoxIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            ) : (
              <LockClosedIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {dialog.fileType === 'zip' ? t('ZIP Password') : t('Password Required')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {dialog.fileType === 'zip'
                ? t('Enter password if this ZIP file is encrypted')
                : t('This PDF file is password-protected')}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 truncate">
            {t('File')}: <span className="font-medium">{dialog.fileName}</span>
          </p>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={dialog.password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !verifying && onSubmit()}
              placeholder={dialog.fileType === 'zip' ? t('Enter ZIP password') : t('Enter PDF password')}
              className={`w-full px-4 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              autoFocus
              disabled={verifying}
            />
            <button
              type="button"
              onClick={onToggleShowPassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              disabled={verifying}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <ExclamationCircleIcon className="h-4 w-4" />
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={verifying}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {t('Cancel')}
          </button>
          <button
            onClick={onSubmit}
            disabled={!dialog.password || verifying}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              dialog.fileType === 'zip'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {verifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('Verifying...')}
              </>
            ) : (
              t('Confirm')
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
