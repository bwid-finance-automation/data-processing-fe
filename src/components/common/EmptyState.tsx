import { memo, type ComponentType, type ReactNode } from 'react';

type EmptyStateSize = 'sm' | 'md' | 'lg';

type EmptyStateProps = {
  icon?: ComponentType<{ className?: string }>;
  title?: ReactNode;
  description?: ReactNode;
  action?: () => void;
  actionLabel?: ReactNode;
  actionIcon?: ComponentType<{ className?: string }>;
  secondaryAction?: () => void;
  secondaryActionLabel?: ReactNode;
  className?: string;
  size?: EmptyStateSize;
};

/**
 * Reusable empty state component
 * Used to display empty/loading states consistently across the app
 */
const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  actionIcon: ActionIcon,
  secondaryAction,
  secondaryActionLabel,
  className = '',
  size = 'md', // 'sm', 'md', 'lg'
}: EmptyStateProps) {
  const sizeConfig = {
    sm: {
      iconSize: 'h-8 w-8',
      iconWrapper: 'w-12 h-12',
      title: 'text-sm font-medium',
      description: 'text-xs',
      padding: 'py-4',
    },
    md: {
      iconSize: 'h-10 w-10',
      iconWrapper: 'w-16 h-16',
      title: 'text-base font-medium',
      description: 'text-sm',
      padding: 'py-8',
    },
    lg: {
      iconSize: 'h-12 w-12',
      iconWrapper: 'w-20 h-20',
      title: 'text-lg font-semibold',
      description: 'text-base',
      padding: 'py-12',
    },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={`text-center ${config.padding} ${className}`}>
      {Icon && (
        <div className={`${config.iconWrapper} mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
          <Icon className={`${config.iconSize} text-gray-400 dark:text-gray-500`} />
        </div>
      )}

      {title && (
        <p className={`${config.title} text-gray-700 dark:text-gray-300`}>
          {title}
        </p>
      )}

      {description && (
        <p className={`${config.description} text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto`}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
          {action && actionLabel && (
            <button
              onClick={action}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {ActionIcon && <ActionIcon className="h-4 w-4" />}
              {actionLabel}
            </button>
          )}

          {secondaryAction && secondaryActionLabel && (
            <button
              onClick={secondaryAction}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default EmptyState;
