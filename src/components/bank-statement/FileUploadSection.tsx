import { motion } from 'framer-motion';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  LockClosedIcon,
  KeyIcon,
  ArchiveBoxIcon,
  FolderOpenIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { ScrollContainer } from '@components/common';

interface FileUploadSectionProps {
  fileMode: string;
  processing: boolean;
  loadingProject: boolean;
  files: File[];
  dragActive: boolean;
  acceptString: string;
  supportedBanks: string[];
  supportedBanksPDF: string[];
  struckBanks: Set<string>;
  struckBanksPDF: Set<string>;
  encryptedFiles: Record<string, boolean>;
  encryptedZipFiles: Record<string, boolean>;
  filePasswords: Record<string, string>;
  zipPasswords: Record<string, string>;
  zipPdfPasswords: Record<string, string>;
  checkingPdf: boolean;
  checkingZip: boolean;
  projectUuid: string | null;
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
  loadingProject,
  files,
  dragActive,
  acceptString,
  supportedBanks,
  supportedBanksPDF,
  struckBanks,
  struckBanksPDF,
  encryptedFiles,
  encryptedZipFiles,
  filePasswords,
  zipPasswords,
  zipPdfPasswords,
  checkingPdf,
  checkingZip,
  projectUuid,
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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-[#f5efe6] mb-4 flex items-center gap-2">
          <CloudArrowUpIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          {t('Upload Bank Statements')}
        </h2>

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
              {t('PDF Files (OCR)')}
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
            loadingProject
              ? 'border-gray-300 dark:border-gray-700 opacity-50 cursor-not-allowed'
              : dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
          }`}
          onDragEnter={loadingProject ? undefined : onDrag}
          onDragLeave={loadingProject ? undefined : onDrag}
          onDragOver={loadingProject ? undefined : onDrag}
          onDrop={loadingProject ? undefined : onDrop}
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
              key={`file-input-${projectUuid || 'standalone'}-${fileMode}`}
              type="file"
              multiple
              accept={acceptString}
              onChange={onFileInput}
              className="hidden"
              disabled={processing || loadingProject}
            />
            <span className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer inline-block transition-colors ${loadingProject ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {t('Browse Files')}
            </span>
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {t('Supported formats')}: {fileMode === 'excel' ? '.xlsx, .xls, .zip' : fileMode === 'pdf' ? '.pdf, .zip' : '.zip'}
          </p>
        </div>

        {/* Supported Banks - Excel mode */}
        {fileMode === 'excel' && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              {t('Supported Banks')} ({supportedBanks.length} {t('banks')})
            </h3>
            <div className="flex flex-wrap gap-2">
              {supportedBanks.map(bank => {
                const normalizedBank = bank?.toString() || '';
                const isStruck = struckBanks.has(normalizedBank.toUpperCase());
                return (
                  <span
                    key={normalizedBank}
                    className={`px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium border border-blue-200 dark:border-blue-700 ${isStruck
                      ? 'line-through text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                      : 'text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {normalizedBank}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Supported Banks - PDF mode */}
        {fileMode === 'pdf' && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              {t('Supported Banks')} ({supportedBanksPDF.length} {t('banks')})
            </h3>
            <div className="flex flex-wrap gap-2">
              {supportedBanksPDF.map(bank => {
                const normalizedBank = bank?.toString() || '';
                const isStruck = struckBanksPDF.has(normalizedBank.toUpperCase());
                return (
                  <span
                    key={normalizedBank}
                    className={`px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium border border-blue-200 dark:border-blue-700 ${isStruck
                      ? 'line-through text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                      : 'text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {normalizedBank}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ZIP Mode Info */}
        {fileMode === 'zip' && (
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
              <ArchiveBoxIcon className="h-4 w-4" />
              {t('ZIP Archive Processing')}
            </h3>
            <div className="flex flex-wrap gap-3 text-xs mb-3">
              <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-2.5 py-1.5 rounded-md border border-purple-200 dark:border-purple-700">
                <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-purple-700 dark:text-purple-300">.xlsx, .xls {t('files')}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-2.5 py-1.5 rounded-md border border-purple-200 dark:border-purple-700">
                <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-purple-700 dark:text-purple-300">.pdf {t('files')} (OCR)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-2.5 py-1.5 rounded-md border border-purple-200 dark:border-purple-700">
                <LockClosedIcon className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-purple-700 dark:text-purple-300">{t('Password-protected ZIP supported')}</span>
              </div>
            </div>

            {/* Supported Banks for Excel */}
            <div className="mb-3">
              <p className="text-xs font-medium text-purple-800 dark:text-purple-200 mb-1.5">
                Excel ({supportedBanks.length} {t('banks')}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {supportedBanks.map(bank => (
                  <span
                    key={bank}
                    className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded text-xs font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                  >
                    {bank}
                  </span>
                ))}
              </div>
            </div>

            {/* Supported Banks for PDF */}
            <div>
              <p className="text-xs font-medium text-purple-800 dark:text-purple-200 mb-1.5">
                PDF ({supportedBanksPDF.length} {t('banks')}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {supportedBanksPDF.map(bank => (
                  <span
                    key={bank}
                    className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded text-xs font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                  >
                    {bank}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('Selected Files')} ({files.length})
              {(checkingPdf || checkingZip) && <span className="ml-2 text-xs text-blue-600">{t('Checking encryption...')}</span>}
            </h3>
            <ScrollContainer maxHeight="max-h-60" className="space-y-2">
              {files.map((file, index) => {
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
              })}
            </ScrollContainer>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
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
    </motion.div>
  );
}
