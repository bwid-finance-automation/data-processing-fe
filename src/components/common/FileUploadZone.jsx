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
  compact = false,
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
          className={`flex ${compact ? 'flex-row gap-3 px-4' : 'flex-col'} items-center justify-center w-full ${compact ? 'h-20' : 'h-48'} border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            hasFiles
              ? `${colors.border} ${colors.bg}`
              : dragActive
              ? `${colors.border} ${colors.bg}`
              : `border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 ${colors.hover}`
          }`}
        >
          <div className={`flex ${compact ? 'flex-row' : 'flex-col'} items-center ${compact ? 'gap-2.5' : 'gap-3'}`}>
            <div className={`${compact ? 'w-10 h-10' : 'w-16 h-16'} rounded-full flex items-center justify-center flex-shrink-0 ${
              hasFiles ? 'bg-green-500' : dragActive ? colors.icon : 'bg-gray-300 dark:bg-gray-700'
            }`}>
              {hasFiles ? (
                <CheckIcon className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} text-white`} />
              ) : (
                <CloudArrowUpIcon className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} text-white`} />
              )}
            </div>
            <div className={compact ? 'text-left' : 'text-center'}>
              <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 dark:text-gray-200`}>
                {hasFiles
                  ? (multiple ? `${selectedFiles.length} ${t('file(s) selected')}` : selectedFiles[0]?.name)
                  : (label || t('Click to choose files'))}
              </p>
              <p className={`${compact ? 'text-[11px]' : 'text-xs'} text-gray-500 dark:text-gray-400 mt-0.5`}>
                {hasFiles
                  ? formatFileSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))
                  : (hint || t('or drag and drop'))}
              </p>
              {maxSize && !hasFiles && (
                <p className={`${compact ? 'text-[11px]' : 'text-xs'} text-gray-400 dark:text-gray-500 mt-0.5`}>
                  {t('Max size')}: {formatFileSize(maxSize)}
                </p>
              )}
            </div>
          </div>
        </label>
      </div>

      {/* File List */}
      {showFileList && (
        <div className={`${compact ? 'mt-2 max-h-[80px]' : 'mt-3 h-[120px]'} overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30`}>
          {hasFiles ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className={`flex items-center ${compact ? 'gap-2 px-2.5 py-1.5' : 'gap-3 px-3 py-2.5'} hover:bg-white dark:hover:bg-gray-800 transition-colors group`}
                >
                  <div className={`flex-shrink-0 ${compact ? 'w-6 h-6 rounded-md' : 'w-8 h-8 rounded-lg'} ${colors.bg} flex items-center justify-center`}>
                    <CloudArrowUpIcon className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${
                      colorTheme === 'emerald' ? 'text-emerald-500' :
                      colorTheme === 'green' ? 'text-green-500' :
                      colorTheme === 'indigo' ? 'text-indigo-500' :
                      colorTheme === 'purple' ? 'text-purple-500' :
                      'text-blue-500'
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-800 dark:text-gray-200 truncate`}>
                      {file.name}
                    </p>
                    {!compact && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    )}
                  </div>
                  {onRemoveFile && (
                    <button
                      onClick={() => onRemoveFile(index)}
                      className={`flex-shrink-0 ${compact ? 'p-1' : 'p-1.5'} rounded-lg text-red-300 dark:text-red-400/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all`}
                    >
                      <XMarkIcon className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={`${compact ? 'py-3' : 'h-full'} flex items-center justify-center text-gray-300 dark:text-gray-600`}>
              <p className="text-xs">{t('Uploaded files will appear here')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default FileUploadZone;
