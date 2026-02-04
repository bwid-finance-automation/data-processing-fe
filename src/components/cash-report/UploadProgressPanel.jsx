import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  FunnelIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const STEP_ICON_MAP = {
  reading:     { Icon: DocumentTextIcon, color: 'text-slate-400 dark:text-gray-500' },
  filtering:   { Icon: FunnelIcon,       color: 'text-slate-400 dark:text-gray-500' },
  classifying: { Icon: SparklesIcon,     color: 'text-purple-500 dark:text-purple-400' },
  writing:     { Icon: CodeBracketIcon,  color: 'text-slate-400 dark:text-gray-500' },
  done:        { Icon: CheckCircleIcon,  color: 'text-emerald-500 dark:text-emerald-400' },
  error:       { Icon: ExclamationCircleIcon, color: 'text-red-500 dark:text-red-400' },
};

const UploadProgressPanel = ({ isVisible, steps, isComplete, isError, errorMessage, isActive }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const scrollRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  const isIdle = !isActive && !isComplete && !isError;
  const isProcessing = isActive && !isComplete && !isError;

  // Start timer only when actively processing
  useEffect(() => {
    if (isActive && !isComplete && !isError && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedTime((Date.now() - startTimeRef.current) / 1000);
      }, 100);
    }

    if (isComplete || isError) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isComplete, isError]);

  // Reset timer when process resets
  useEffect(() => {
    if (!isActive && !isComplete && !isError) {
      startTimeRef.current = null;
      setElapsedTime(0);
      setIsExpanded(true);
    }
  }, [isActive, isComplete, isError]);

  // Auto-scroll to bottom when new steps arrive
  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps, isExpanded]);


  if (!isVisible) return null;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#222] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-5">
      {/* Idle state */}
      {isIdle && (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-gray-600 py-12">
          <CloudArrowUpIcon className="w-10 h-10 mb-3 text-slate-300 dark:text-gray-600" />
          <span className="text-sm font-medium text-slate-400 dark:text-gray-500">
            {t('Waiting for upload')}
          </span>
          <span className="text-xs text-slate-300 dark:text-gray-600 mt-1">
            {t('Progress will appear here')}
          </span>
        </div>
      )}

      {/* Active / Completed state */}
      {!isIdle && (
        <div className="flex-1 flex flex-col min-h-0">

          {/* Accordion Header — o1 "Thinking" style */}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            layout
            className="flex items-center gap-2.5 text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 transition-colors text-base font-medium group select-none py-2 px-1"
          >
            {isProcessing ? (
              <motion.div
                className="w-4 h-4 border-[1.5px] border-slate-400 dark:border-gray-500 rounded-full border-t-transparent flex-shrink-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : isError ? (
              <ExclamationCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
            ) : (
              <SparklesIcon className="w-4 h-4 text-slate-500 dark:text-gray-400 flex-shrink-0" />
            )}

            <span className={isError ? 'text-red-600 dark:text-red-400' : ''}>
              {isProcessing
                ? t('Processing...')
                : isError
                  ? t('Failed')
                  : t('Processed for {{seconds}} seconds', { seconds: elapsedTime.toFixed(0) })}
            </span>

            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-slate-400 dark:text-gray-500 group-hover:text-slate-600 dark:group-hover:text-gray-300 ml-0.5"
            >
              <ChevronDownIcon className="w-4 h-4" />
            </motion.span>
          </motion.button>

          {/* Thought Process — collapsible bullet list */}
          <div className={`flex-1 min-h-0 ml-[7px] ${isExpanded ? '' : 'hidden'}`}>
            <div
              ref={scrollRef}
              className="h-full overflow-y-auto pr-2 py-1"
                >
                  <ul className="space-y-0.5">
                    {steps.map((step, index) => {
                      const iconConfig = STEP_ICON_MAP[step.type === 'complete' ? 'done' : step.step] || STEP_ICON_MAP.reading;
                      const StepIcon = iconConfig.Icon;
                      const iconColor = iconConfig.color;
                      const isLast = index === steps.length - 1;

                      return (
                        <motion.li
                          key={`${step.step}-${step.type}-${index}`}
                          initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                          className="flex items-stretch gap-0"
                        >
                          {/* Icon on the vertical line */}
                          <div className="flex flex-col items-center flex-shrink-0 w-5">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 8 }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                              className="w-[2px] bg-slate-200 dark:bg-gray-700/50"
                            />
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 15 }}
                              className="bg-white dark:bg-[#222] flex-shrink-0 -mx-px"
                            >
                              <StepIcon className={`w-4 h-4 ${iconColor}`} />
                            </motion.div>
                            {(!isLast || isProcessing) && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: '100%' }}
                                transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
                                className="w-[2px] flex-1 bg-slate-200 dark:bg-gray-700/50"
                              />
                            )}
                          </div>

                          {/* Text */}
                          <motion.div
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
                            className="pl-3 pb-3 pt-0.5 min-w-0"
                          >
                            <span className="text-sm leading-relaxed text-slate-600 dark:text-gray-400 font-light">
                              {step.message}
                              {step.detail && (
                                <span className="text-slate-400 dark:text-gray-500"> — {step.detail}</span>
                              )}
                            </span>
                          </motion.div>
                        </motion.li>
                      );
                    })}
                  </ul>

                  {/* Blinking cursor while processing */}
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-stretch"
                    >
                      <div className="flex flex-col items-center flex-shrink-0 w-5">
                        <div className="w-[2px] flex-1 bg-slate-200 dark:bg-gray-700/50" />
                      </div>
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="ml-3 mt-1 w-[5px] h-3.5 bg-slate-400 dark:bg-gray-500 rounded-[1px]"
                      />
                    </motion.div>
                  )}

                  {/* Error message */}
                  {isError && errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                    </motion.div>
                  )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default UploadProgressPanel;
