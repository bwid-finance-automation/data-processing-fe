import { memo, type ComponentType, type ReactNode } from 'react';

/**
 * Color variant configurations for StatCard
 */
const colorVariants = {
  blue: {
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  emerald: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  purple: {
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  indigo: {
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  yellow: {
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  amber: {
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  red: {
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  gray: {
    iconBg: 'bg-gray-100 dark:bg-gray-700/30',
    iconColor: 'text-gray-600 dark:text-gray-400',
  },
};

type StatColor = keyof typeof colorVariants;
type TrendDirection = 'up' | 'down';

type StatCardProps = {
  icon?: ComponentType<{ className?: string }>;
  label?: ReactNode;
  value?: ReactNode;
  color?: StatColor;
  description?: ReactNode;
  trend?: TrendDirection;
  trendValue?: ReactNode;
  className?: string;
};

/**
 * Reusable statistics card component
 * Used in dashboards and overview sections
 */
const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  color = 'blue',
  description,
  trend,
  trendValue,
  className = '',
}: StatCardProps) {
  const colors = colorVariants[color] || colorVariants.blue;

  return (
    <div
      className={`theme-surface rounded-xl shadow-lg p-5 border border-[color:var(--app-border)] ${className}`}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={`p-3 rounded-xl ${colors.iconBg} flex-shrink-0`}>
            <Icon className={`h-6 w-6 ${colors.iconColor}`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {description}
            </p>
          )}
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : trend === 'down' ? (
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              ) : null}
              <span className={`text-xs font-medium ${
                trend === 'up' ? 'text-green-600 dark:text-green-400' :
                trend === 'down' ? 'text-red-600 dark:text-red-400' :
                'text-gray-500'
              }`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default StatCard;
