import { forwardRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Reusable Modal component with animations
 * Uses composition pattern with Header, Body, and Footer sub-components
 */
const Modal = forwardRef(({
  open,
  onClose,
  children,
  className = '',
  maxWidth = 'max-w-md',
  closeOnBackdrop = true,
  showCloseButton = false,
}, ref) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          {/* Modal Content */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative theme-surface rounded-xl p-6 w-full ${maxWidth} mx-4 shadow-2xl border border-[color:var(--app-border)] ${className}`}
          >
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

Modal.displayName = 'Modal';

/**
 * Modal Header sub-component
 * Displays icon, title, and optional subtitle
 */
const ModalHeader = memo(function ModalHeader({
  icon: Icon,
  iconBg = 'bg-blue-100 dark:bg-blue-900/30',
  iconColor = 'text-blue-600 dark:text-blue-400',
  title,
  subtitle,
  children,
  className = '',
}) {
  return (
    <div className={`flex items-start gap-3 mb-4 ${className}`}>
      {Icon && (
        <div className={`p-2 ${iconBg} rounded-lg flex-shrink-0`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
});

/**
 * Modal Body sub-component
 * Container for main modal content
 */
const ModalBody = memo(function ModalBody({
  children,
  className = '',
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
});

/**
 * Modal Footer sub-component
 * Container for action buttons
 */
const ModalFooter = memo(function ModalFooter({
  children,
  className = '',
}) {
  return (
    <div className={`mt-6 flex gap-3 ${className}`}>
      {children}
    </div>
  );
});

// Attach sub-components to Modal
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;
