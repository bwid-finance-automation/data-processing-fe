import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  LockClosedIcon,
  KeyIcon,
  ArchiveBoxIcon,
  FolderOpenIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface FileUploadSectionProps {
  fileMode: string;
  processing: boolean;
  files: File[];
  dragActive: boolean;
  acceptString: string;
  encryptedFiles: Record<string, boolean>;
  encryptedZipFiles: Record<string, boolean>;
  filePasswords: Record<string, string>;
  zipPasswords: Record<string, string>;
  zipPdfPasswords: Record<string, string>;
  checkingPdf: boolean;
  checkingZip: boolean;
  onModeChange: (mode: string) => void;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onOpenPasswordDialog: (fileName: string, fileType?: string) => void;
  onOpenZipContentsDialog: (fileName: string) => void;
  onProcess: () => void;
  onClear: () => void;
  formatFileSize: (bytes: number) => string;
}

export default function FileUploadSection({
  fileMode,
  processing,
  files,
  dragActive,
  acceptString,
  encryptedFiles,
  encryptedZipFiles,
  filePasswords,
  zipPasswords,
  zipPdfPasswords,
  checkingPdf,
  checkingZip,
  onModeChange,
  onDrag,
  onDrop,
  onFileInput,
  onRemoveFile,
  onOpenPasswordDialog,
  onOpenZipContentsDialog,
  onProcess,
  onClear,
  formatFileSize,
}: FileUploadSectionProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white dark:bg-[#222] rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[#f5efe6] flex items-center gap-2">
            <CloudArrowUpIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            {t('Upload Bank Statements')}
          </h2>
          <div className="flex flex-wrap items-center gap-1.5">
            {fileMode === 'excel' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                .xlsx, .xls
              </span>
            )}
            {fileMode === 'pdf' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                .pdf
              </span>
            )}
            {fileMode === 'zip' && (
              <>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                  .xlsx, .xls, .pdf
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                  <LockClosedIcon className="w-3 h-3" />
                  {t('Encrypted ZIP')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* File Mode Toggle */}
        <div className="mb-4">
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => onModeChange('excel')}
              disabled={processing}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                fileMode === 'excel'
                  ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {t('Excel Files')}
            </button>
            <button
              onClick={() => onModeChange('pdf')}
              disabled={processing}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                fileMode === 'pdf'
                  ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {t('PDF Files')}
            </button>
            <button
              onClick={() => onModeChange('zip')}
              disabled={processing}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1 ${
                fileMode === 'zip'
                  ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ArchiveBoxIcon className="h-4 w-4" />
              {t('ZIP Files')}
            </button>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
          }`}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
        >
          {fileMode === 'zip' ? (
            <ArchiveBoxIcon className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          ) : (
            <CloudArrowUpIcon className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          )}
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {t('Drag and drop')} {fileMode === 'excel' ? 'Excel' : fileMode === 'pdf' ? 'PDF' : 'ZIP'} {t('files here, or')}
          </p>
          <label className="inline-block">
            <input
              key={`file-input-${fileMode}`}
              type="file"
              multiple
              accept={acceptString}
              onChange={onFileInput}
              className="hidden"
              disabled={processing}
            />
            <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer inline-block transition-colors">
              {t('Browse Files')}
            </span>
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {t('Supported formats')}: {fileMode === 'excel' ? '.xlsx, .xls, .zip' : fileMode === 'pdf' ? '.pdf, .zip' : '.zip'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <SelectedFilesButton
            files={files}
            processing={processing}
            checkingPdf={checkingPdf}
            checkingZip={checkingZip}
            encryptedFiles={encryptedFiles}
            encryptedZipFiles={encryptedZipFiles}
            filePasswords={filePasswords}
            zipPasswords={zipPasswords}
            zipPdfPasswords={zipPdfPasswords}
            onRemoveFile={onRemoveFile}
            onOpenPasswordDialog={onOpenPasswordDialog}
            onOpenZipContentsDialog={onOpenZipContentsDialog}
            formatFileSize={formatFileSize}
          />
          <div className="flex gap-3 flex-1">
            <button
              onClick={onProcess}
              disabled={processing || files.length === 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? t('Processing...') : t('Process Files')}
            </button>
            <button
              onClick={onClear}
              disabled={processing}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t('Clear')}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------- */
/*  Selected Files Button + Dialog                     */
/* -------------------------------------------------- */

function SelectedFilesButton({
  files,
  processing,
  checkingPdf,
  checkingZip,
  encryptedFiles,
  encryptedZipFiles,
  filePasswords,
  zipPasswords,
  zipPdfPasswords,
  onRemoveFile,
  onOpenPasswordDialog,
  onOpenZipContentsDialog,
  formatFileSize,
}: {
  files: File[];
  processing: boolean;
  checkingPdf: boolean;
  checkingZip: boolean;
  encryptedFiles: Record<string, boolean>;
  encryptedZipFiles: Record<string, boolean>;
  filePasswords: Record<string, string>;
  zipPasswords: Record<string, string>;
  zipPdfPasswords: Record<string, string>;
  onRemoveFile: (index: number) => void;
  onOpenPasswordDialog: (fileName: string, fileType?: string) => void;
  onOpenZipContentsDialog: (fileName: string) => void;
  formatFileSize: (bytes: number) => string;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const needsAttention = files.some((file) => {
    const isZip = file.name.toLowerCase().endsWith('.zip');
    if (isZip) return encryptedZipFiles[file.name] && !zipPasswords[file.name];
    return encryptedFiles[file.name] && !filePasswords[file.name];
  });

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={files.length === 0}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          needsAttention
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        <DocumentArrowUpIcon className="h-4 w-4" />
        {t('Files')} ({files.length})
        {(checkingPdf || checkingZip) && (
          <span className="ml-1 h-3 w-3 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
        )}
        {needsAttention && (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-gray-800" />
        )}
      </button>

      {/* Dialog overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-[#222] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg mx-4 max-h-[70vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dialog header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <DocumentArrowUpIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  {t('Selected Files')} ({files.length})
                  {(checkingPdf || checkingZip) && (
                    <span className="text-xs text-blue-600 font-normal">{t('Checking encryption...')}</span>
                  )}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Dialog body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {files.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    {t('No files selected yet')}
                  </div>
                ) : (
                  files.map((file, index) => {
                    const isZipFile = file.name.toLowerCase().endsWith('.zip');
                    const isZipEncrypted = encryptedZipFiles[file.name];
                    const isPdfEncrypted = encryptedFiles[file.name];
                    const hasPassword = isZipFile ? !!zipPasswords[file.name] : !!filePasswords[file.name];
                    const needsPassword = isZipFile ? (isZipEncrypted && !hasPassword) : (isPdfEncrypted && !hasPassword);

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          needsPassword
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                            : (isZipEncrypted || isPdfEncrypted) && hasPassword
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isZipFile ? (
                            isZipEncrypted ? (
                              <LockClosedIcon className={`h-5 w-5 flex-shrink-0 ${
                                hasPassword ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                              }`} />
                            ) : (
                              <ArchiveBoxIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            )
                          ) : isPdfEncrypted ? (
                            <LockClosedIcon className={`h-5 w-5 flex-shrink-0 ${
                              hasPassword ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                            }`} />
                          ) : (
                            <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.size)}
                              {isZipFile && isZipEncrypted && (
                                <span className={`ml-2 ${hasPassword ? 'text-green-600' : 'text-amber-600'}`}>
                                  {hasPassword ? `• ${t('ZIP Password set')}` : `• ${t('Encrypted - needs password')}`}
                                </span>
                              )}
                              {isZipFile && Object.keys(zipPdfPasswords).length > 0 && (
                                <span className="ml-2 text-blue-600">
                                  • {Object.keys(zipPdfPasswords).length} {t('PDF password(s)')}
                                </span>
                              )}
                              {!isZipFile && isPdfEncrypted && (
                                <span className={`ml-2 ${hasPassword ? 'text-green-600' : 'text-amber-600'}`}>
                                  {hasPassword ? `• ${t('Password set')}` : `• ${t('Encrypted - needs password')}`}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {isZipFile && isZipEncrypted && (
                            <button
                              onClick={() => onOpenPasswordDialog(file.name, 'zip')}
                              disabled={processing}
                              className={`p-1 transition-colors disabled:opacity-50 ${
                                hasPassword
                                  ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                                  : 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300'
                              }`}
                              title={hasPassword ? t('Change ZIP password') : t('Enter ZIP password')}
                            >
                              <KeyIcon className="h-5 w-5" />
                            </button>
                          )}
                          {isZipFile && (
                            <button
                              onClick={() => onOpenZipContentsDialog(file.name)}
                              disabled={processing || (isZipEncrypted && !hasPassword)}
                              className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                              title={t('View ZIP contents & manage PDF passwords')}
                            >
                              <FolderOpenIcon className="h-5 w-5" />
                            </button>
                          )}
                          {!isZipFile && isPdfEncrypted && (
                            <button
                              onClick={() => onOpenPasswordDialog(file.name, 'pdf')}
                              disabled={processing}
                              className="p-1 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors disabled:opacity-50"
                              title={hasPassword ? t('Change password') : t('Enter password')}
                            >
                              <KeyIcon className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => onRemoveFile(index)}
                            disabled={processing}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
