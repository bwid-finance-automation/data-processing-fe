import { memo, useState, useRef, useCallback } from 'react';
import { CloudArrowUpIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

/**
 * Utility function to format file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Color theme configurations for FileUploadZone
 */
const colorThemes = {
  blue: {
    border: 'border-blue-400 dark:border-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    hover: 'hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    icon: 'bg-blue-500',
  },
  emerald: {
    border: 'border-emerald-400 dark:border-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    hover: 'hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    icon: 'bg-emerald-500',
  },
  green: {
    border: 'border-green-400 dark:border-green-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
    hover: 'hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20',
    icon: 'bg-green-500',
  },
  indigo: {
    border: 'border-indigo-400 dark:border-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    hover: 'hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
    icon: 'bg-indigo-500',
  },
  purple: {
    border: 'border-purple-400 dark:border-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    hover: 'hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20',
    icon: 'bg-purple-500',
  },
};

/**
 * Reusable file upload zone with drag-and-drop support
 */
const FileUploadZone = memo(function FileUploadZone({
  onFilesSelected,
  accept = '*',
  multiple = false,
  disabled = false,
  selectedFiles = [],
  label,
  hint,
  maxFiles,
  maxSize,
  colorTheme = 'blue',
  showFileList = true,
  onRemoveFile,
  className = '',
  id,
}) {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const colors = colorThemes[colorTheme] || colorThemes.blue;

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [disabled]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const limitedFiles = maxFiles ? files.slice(0, maxFiles) : files;
    onFilesSelected(multiple ? limitedFiles : limitedFiles.slice(0, 1));
  }, [disabled, onFilesSelected, maxFiles, multiple]);

  const handleChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    const limitedFiles = maxFiles ? files.slice(0, maxFiles) : files;
    onFilesSelected(multiple ? limitedFiles : limitedFiles.slice(0, 1));
    e.target.value = '';
  }, [onFilesSelected, maxFiles, multiple]);

  const hasFiles = selectedFiles.length > 0;
  const inputId = id || `file-upload-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={className}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
          id={inputId}
        />
        <label
          htmlFor={inputId}
          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            hasFiles
              ? `${colors.border} ${colors.bg}`
              : dragActive
              ? `${colors.border} ${colors.bg}`
              : `border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 ${colors.hover}`
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              hasFiles ? 'bg-green-500' : dragActive ? colors.icon : 'bg-gray-300 dark:bg-gray-700'
            }`}>
              {hasFiles ? (
                <CheckIcon className="w-8 h-8 text-white" />
              ) : (
                <CloudArrowUpIcon className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {hasFiles
                  ? (multiple ? `${selectedFiles.length} ${t('file(s) selected')}` : selectedFiles[0]?.name)
                  : (label || t('Click to choose files'))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {hasFiles
                  ? formatFileSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))
                  : (hint || t('or drag and drop'))}
              </p>
              {maxSize && !hasFiles && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('Max size')}: {formatFileSize(maxSize)}
                </p>
              )}
            </div>
          </div>
        </label>
      </div>

      {/* File List */}
      {showFileList && (
        <div className="mt-3 h-[120px] overflow-y-auto pr-1 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
          {hasFiles ? (
            <div className="space-y-0.5 p-1.5">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 group"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate min-w-0">
                    {file.name}
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{formatFileSize(file.size)}</span>
                  </p>
                  {onRemoveFile && (
                    <button
                      onClick={() => onRemoveFile(index)}
                      className="p-0.5 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
              <p className="text-xs">{t('Uploaded files will appear here')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default FileUploadZone;
