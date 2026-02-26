import { MutableRefObject } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface StepDef {
  key: string;
  title: string;
  desc: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface AutomationStepsListProps {
  steps: StepDef[];
  currentStep: string;
  completedSteps: string[];
  result: unknown;
  error: string | null;
  /** 'blue' for settlement, 'purple' for open-new */
  colorTheme: 'blue' | 'purple';
  stepRefs?: MutableRefObject<Record<string, HTMLDivElement | null>>;
}

const themeMap = {
  blue: {
    activeBorder: 'border-blue-500 text-blue-600 dark:text-blue-400',
    activeBg: 'bg-white dark:bg-gray-900',
    activeText: 'text-blue-700 dark:text-blue-400',
    barBg: 'bg-blue-100 dark:bg-blue-900/30',
    barFill: 'bg-blue-500',
  },
  purple: {
    activeBorder: 'border-purple-500 text-purple-600 dark:text-purple-400',
    activeBg: 'bg-white dark:bg-gray-900',
    activeText: 'text-purple-700 dark:text-purple-400',
    barBg: 'bg-purple-100 dark:bg-purple-900/30',
    barFill: 'bg-purple-500',
  },
};

export default function AutomationStepsList({
  steps,
  currentStep,
  completedSteps,
  result,
  error,
  colorTheme,
  stepRefs,
}: AutomationStepsListProps) {
  const theme = themeMap[colorTheme];

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.key && !result && !error;
        const isCompleted = completedSteps.includes(step.key) || !!result;
        const isPending = !isCompleted && !isActive;
        const StepIcon = step.icon;

        return (
          <motion.div
            key={step.key}
            ref={(el) => {
              if (stepRefs) stepRefs.current[step.key] = el;
            }}
            className={`flex items-start gap-3 transition-opacity duration-500 ${isPending ? 'opacity-40' : 'opacity-100'}`}
          >
            {/* Icon */}
            <div className="relative pt-0.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500
                ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : isActive ? `${theme.activeBg} ${theme.activeBorder} scale-110`
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'}
              `}>
                {isCompleted ? <CheckCircleIcon className="w-3 h-3" /> : <StepIcon className="w-3 h-3" />}
              </div>
              {idx < steps.length - 1 && (
                <div className={`absolute top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 transition-colors duration-500
                  ${isCompleted ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-gray-200 dark:bg-gray-700'}`}
                />
              )}
            </div>

            {/* Text */}
            <div className="flex-1 pt-0.5">
              <h4 className={`text-xs font-bold ${isActive ? theme.activeText : 'text-gray-800 dark:text-gray-200'}`}>
                {step.title}
              </h4>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{step.desc}</p>
              {isActive && (
                <motion.div
                  className={`h-1 mt-1 rounded-full ${theme.barBg} overflow-hidden w-full`}
                >
                  <motion.div className={`${theme.barFill} h-full w-1/3 rounded-full`}
                    animate={{ x: ['-100%', '300%'] }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
