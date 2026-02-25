import { memo, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderIcon, ChevronDownIcon, LockClosedIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

/**
 * Color theme configurations for ProjectSelector
 */
const colorThemes = {
  blue: {
    bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    hover: 'hover:border-blue-400 dark:hover:border-blue-500',
    selected: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    spinner: 'border-blue-500',
    createText: 'text-blue-600 dark:text-blue-400',
    createHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
  },
  emerald: {
    bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    hover: 'hover:border-emerald-400 dark:hover:border-emerald-500',
    selected: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    spinner: 'border-emerald-500',
    createText: 'text-emerald-600 dark:text-emerald-400',
    createHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
  },
  indigo: {
    bg: 'from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    hover: 'hover:border-indigo-400 dark:hover:border-indigo-500',
    selected: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    spinner: 'border-indigo-500',
    createText: 'text-indigo-600 dark:text-indigo-400',
    createHover: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
  },
  purple: {
    bg: 'from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    hover: 'hover:border-purple-400 dark:hover:border-purple-500',
    selected: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    spinner: 'border-purple-500',
    createText: 'text-purple-600 dark:text-purple-400',
    createHover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
  },
  amber: {
    bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    hover: 'hover:border-amber-400 dark:hover:border-amber-500',
    selected: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    spinner: 'border-amber-500',
    createText: 'text-amber-600 dark:text-amber-400',
    createHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
  },
  cyan: {
    bg: 'from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    hover: 'hover:border-cyan-400 dark:hover:border-cyan-500',
    selected: 'bg-cyan-50 dark:bg-cyan-900/20',
    icon: 'text-cyan-600 dark:text-cyan-400',
    badge: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
    spinner: 'border-cyan-500',
    createText: 'text-cyan-600 dark:text-cyan-400',
    createHover: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/20',
  },
  orange: {
    bg: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    hover: 'hover:border-orange-400 dark:hover:border-orange-500',
    selected: 'bg-orange-50 dark:bg-orange-900/20',
    icon: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    spinner: 'border-orange-500',
    createText: 'text-orange-600 dark:text-orange-400',
    createHover: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
  },
};

/**
 * Reusable Project Selector component
 * Displays current project and dropdown for switching between projects
 */
const ProjectSelector = memo(forwardRef(function ProjectSelector({
  project,
  loadingProject,
  showDropdown,
  onToggleDropdown,
  dropdownRef,
  projectsList,
  loadingProjects,
  onSelectProject,
  onCreateNew,
  colorTheme = 'blue',
  className = '',
}, ref) {
  const { t } = useTranslation();
  const colors = colorThemes[colorTheme] || colorThemes.blue;

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r ${colors.bg} rounded-lg border ${colors.border} ${className}`}
      ref={ref}
    >
      <div className="flex items-center gap-3">
        <FolderIcon className={`h-5 w-5 ${colors.icon}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('Project')}:
        </span>
        <div className="relative" ref={dropdownRef}>
          {/* Trigger Button */}
          <button
            onClick={onToggleDropdown}
            disabled={loadingProject}
            className={`flex items-center gap-2 px-3 py-1.5 theme-surface border border-[color:var(--app-border)] rounded-lg ${colors.hover} transition-colors min-w-[200px]`}
          >
            {loadingProject ? (
              <span className="text-gray-400">{t('Loading...')}</span>
            ) : project ? (
              <>
                <span className="text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
                  {project.project_name}
                </span>
                {project.is_protected && (
                  <LockClosedIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                )}
              </>
            ) : (
              <span className="text-gray-500">{t('Standalone Mode')}</span>
            )}
            <ChevronDownIcon className={`h-4 w-4 text-gray-400 ml-auto transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-1 w-72 theme-surface border border-[color:var(--app-border)] rounded-lg shadow-xl z-50 max-h-80 overflow-auto"
              >
                {/* Create New Project Option */}
                {onCreateNew && (
                  <button
                    onClick={onCreateNew}
                    className={`w-full px-4 py-2 text-left ${colors.createText} ${colors.createHover} transition-colors border-b border-gray-200 dark:border-gray-700 flex items-center gap-2`}
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span className="font-medium">{t('Create New Project')}</span>
                  </button>
                )}

                {/* Standalone Mode Option */}
                <button
                  onClick={() => onSelectProject(null)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    !project ? colors.selected : ''
                  }`}
                >
                  <span className="text-gray-600 dark:text-gray-400">{t('Standalone Mode')}</span>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {t('Process without saving to project')}
                  </p>
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700" />

                {/* Projects List */}
                {loadingProjects ? (
                  <div className="px-4 py-3 text-center text-gray-500">
                    <div className={`inline-block w-4 h-4 border-2 ${colors.spinner} border-t-transparent rounded-full animate-spin mr-2`} />
                    {t('Loading...')}
                  </div>
                ) : projectsList.length === 0 ? (
                  <div className="px-4 py-3 text-center text-gray-500">
                    {t('No projects found')}
                  </div>
                ) : (
                  projectsList.map((p) => (
                    <button
                      key={p.uuid}
                      onClick={() => onSelectProject(p)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        project?.uuid === p.uuid ? colors.selected : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-gray-100 truncate">
                          {p.project_name}
                        </span>
                        {p.is_protected && (
                          <LockClosedIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      {p.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {p.description}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Project Badge */}
      {project && (
        <span className={`text-xs px-2 py-1 ${colors.badge} rounded`}>
          {t('Results will be saved to project')}
        </span>
      )}
    </div>
  );
}));

export default ProjectSelector;
