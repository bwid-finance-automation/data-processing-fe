import { memo } from 'react';
import { FolderPlusIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

/**
 * Color theme configurations for CreateProjectDialog
 */
const colorThemes = {
  blue: {
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    focusRing: 'focus:ring-blue-500',
    submitBg: 'bg-blue-600 hover:bg-blue-700',
  },
  emerald: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    focusRing: 'focus:ring-emerald-500',
    submitBg: 'bg-emerald-600 hover:bg-emerald-700',
  },
  indigo: {
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    focusRing: 'focus:ring-indigo-500',
    submitBg: 'bg-indigo-600 hover:bg-indigo-700',
  },
  purple: {
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    focusRing: 'focus:ring-purple-500',
    submitBg: 'bg-purple-600 hover:bg-purple-700',
  },
  amber: {
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    focusRing: 'focus:ring-amber-500',
    submitBg: 'bg-amber-600 hover:bg-amber-700',
  },
  cyan: {
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    focusRing: 'focus:ring-cyan-500',
    submitBg: 'bg-cyan-600 hover:bg-cyan-700',
  },
  orange: {
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    focusRing: 'focus:ring-orange-500',
    submitBg: 'bg-orange-600 hover:bg-orange-700',
  },
};

/**
 * Reusable Create Project Dialog component
 */
const CreateProjectDialog = memo(function CreateProjectDialog({
  open,
  onClose,
  onSubmit,
  form,
  onFormChange,
  showPassword,
  onToggleShowPassword,
  creating,
  error,
  colorTheme = 'blue',
}) {
  const { t } = useTranslation();
  const colors = colorThemes[colorTheme] || colorThemes.blue;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !creating && form.name?.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Modal.Header
        icon={FolderPlusIcon}
        iconBg={colors.iconBg}
        iconColor={colors.iconColor}
        title={t('Create New Project')}
        subtitle={t('Create a new project to organize your work')}
      />

      <Modal.Body>
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('Project Name')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder={t('Enter project name')}
            className={`w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors`}
            autoFocus
            disabled={creating}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('Description')} <span className="text-gray-400">({t('optional')})</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => onFormChange({ ...form, description: e.target.value })}
            placeholder={t('Enter project description')}
            rows={3}
            className={`w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent resize-none transition-colors`}
            disabled={creating}
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('Password')} <span className="text-gray-400">({t('optional')})</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => onFormChange({ ...form, password: e.target.value })}
              placeholder={t('Set password protection')}
              className={`w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors`}
              disabled={creating}
            />
            <button
              type="button"
              onClick={onToggleShowPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('Password protect this project to restrict access')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </Modal.Body>

      <Modal.Footer>
        <button
          onClick={onClose}
          disabled={creating}
          className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {t('Cancel')}
        </button>
        <button
          onClick={onSubmit}
          disabled={!form.name?.trim() || creating}
          className={`flex-1 px-4 py-2.5 ${colors.submitBg} text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          {creating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('Creating...')}
            </>
          ) : (
            <>
              <FolderPlusIcon className="h-4 w-4" />
              {t('Create Project')}
            </>
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
});

export default CreateProjectDialog;
