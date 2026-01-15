import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  DocumentTextIcon,
  TableCellsIcon,
  LockClosedIcon,
  LockOpenIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

/**
 * Dialog component to display ZIP file contents and collect passwords for encrypted PDFs
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Callback when dialog is closed
 * @param {Object} props.zipAnalysis - Analysis result from analyzeZipContents API
 * @param {Function} props.onConfirm - Callback when user confirms with passwords
 * @param {boolean} props.isLoading - Whether analysis is in progress
 * @param {string} props.zipFileName - Name of the ZIP file being analyzed
 */
const ZipContentsDialog = ({
  isOpen,
  onClose,
  zipAnalysis,
  onConfirm,
  isLoading = false,
  zipFileName = ''
}) => {
  const { t } = useTranslation();
  const [pdfPasswords, setPdfPasswords] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setPdfPasswords({});
      setShowPasswords({});
      setHasAttemptedSubmit(false);
    }
  }, [isOpen]);

  // Initialize passwords state when zipAnalysis changes
  useEffect(() => {
    if (zipAnalysis?.files) {
      const encryptedPdfs = zipAnalysis.files.filter(f => f.is_encrypted && f.file_type === 'pdf');
      const initialPasswords = {};
      encryptedPdfs.forEach(f => {
        initialPasswords[f.filename] = pdfPasswords[f.filename] || '';
      });
      setPdfPasswords(prev => ({ ...initialPasswords, ...prev }));
    }
  }, [zipAnalysis]);

  const handlePasswordChange = (filename, password) => {
    setPdfPasswords(prev => ({ ...prev, [filename]: password }));
  };

  const toggleShowPassword = (filename) => {
    setShowPasswords(prev => ({ ...prev, [filename]: !prev[filename] }));
  };

  const handleConfirm = () => {
    setHasAttemptedSubmit(true);

    // Check if all encrypted PDFs have passwords
    const encryptedPdfs = zipAnalysis?.files?.filter(f => f.is_encrypted && f.file_type === 'pdf') || [];
    const missingPasswords = encryptedPdfs.filter(f => !pdfPasswords[f.filename]);

    if (missingPasswords.length > 0) {
      return; // Don't submit if passwords are missing
    }

    onConfirm(pdfPasswords);
  };

  const handleSkipPasswords = () => {
    // Confirm without passwords - PDFs without passwords will fail during parsing
    onConfirm({});
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  const files = zipAnalysis?.files || [];
  const pdfFiles = files.filter(f => f.file_type === 'pdf');
  const excelFiles = files.filter(f => f.file_type === 'excel');
  const encryptedPdfs = pdfFiles.filter(f => f.is_encrypted);
  const unencryptedPdfs = pdfFiles.filter(f => !f.is_encrypted);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FolderOpenIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('ZIP Contents')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                  {zipFileName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="mt-3 text-gray-600 dark:text-gray-400">
                  {t('Analyzing ZIP contents...')}
                </p>
              </div>
            ) : zipAnalysis?.error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ExclamationCircleIcon className="w-12 h-12 text-red-500" />
                <p className="mt-3 text-red-600 dark:text-red-400">
                  {zipAnalysis.error}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {zipAnalysis?.total_files || 0}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('Total Files')}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {zipAnalysis?.pdf_count || 0}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('PDF Files')}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {zipAnalysis?.excel_count || 0}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('Excel Files')}</p>
                  </div>
                </div>

                {/* Encrypted PDFs requiring password */}
                {encryptedPdfs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <LockClosedIcon className="w-5 h-5 text-amber-500" />
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {t('Password Protected PDFs')} ({encryptedPdfs.length})
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('Enter passwords for the following encrypted PDF files:')}
                    </p>
                    <div className="space-y-3">
                      {encryptedPdfs.map((file) => (
                        <div
                          key={file.filename}
                          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <DocumentTextIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {file.filename}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                            <LockClosedIcon className="w-4 h-4 text-amber-500" />
                          </div>
                          <div className="relative">
                            <input
                              type={showPasswords[file.filename] ? 'text' : 'password'}
                              value={pdfPasswords[file.filename] || ''}
                              onChange={(e) => handlePasswordChange(file.filename, e.target.value)}
                              placeholder={t('Enter password...')}
                              className={`w-full px-4 py-2 pr-10 rounded-lg border
                                ${hasAttemptedSubmit && !pdfPasswords[file.filename]
                                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                                }
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                placeholder-gray-400 dark:placeholder-gray-500
                              `}
                            />
                            <button
                              type="button"
                              onClick={() => toggleShowPassword(file.filename)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPasswords[file.filename] ? (
                                <EyeSlashIcon className="w-5 h-5" />
                              ) : (
                                <EyeIcon className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                          {hasAttemptedSubmit && !pdfPasswords[file.filename] && (
                            <p className="mt-1 text-sm text-red-500">
                              {t('Password is required')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unencrypted PDFs */}
                {unencryptedPdfs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <LockOpenIcon className="w-5 h-5 text-green-500" />
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {t('Unprotected PDFs')} ({unencryptedPdfs.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {unencryptedPdfs.map((file) => (
                        <div
                          key={file.filename}
                          className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                        >
                          <DocumentTextIcon className="w-5 h-5 text-red-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {file.filename}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Excel Files */}
                {excelFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TableCellsIcon className="w-5 h-5 text-green-500" />
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {t('Excel Files')} ({excelFiles.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {excelFiles.map((file) => (
                        <div
                          key={file.filename}
                          className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                        >
                          <TableCellsIcon className="w-5 h-5 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {file.filename}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No files found */}
                {files.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FolderOpenIcon className="w-12 h-12 text-gray-400" />
                    <p className="mt-3 text-gray-600 dark:text-gray-400">
                      {t('No supported files found in ZIP')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {encryptedPdfs.length > 0 && (
                <span className="flex items-center gap-1">
                  <LockClosedIcon className="w-4 h-4" />
                  {encryptedPdfs.length} {t('file(s) need password')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('Cancel')}
              </button>
              {encryptedPdfs.length > 0 && (
                <button
                  onClick={handleSkipPasswords}
                  className="px-4 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                >
                  {t('Skip Passwords')}
                </button>
              )}
              <button
                onClick={handleConfirm}
                disabled={isLoading || files.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                {t('Continue Parsing')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ZipContentsDialog;
