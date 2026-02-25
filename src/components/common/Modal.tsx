import {
  forwardRef,
  memo,
  type ComponentType,
  type ForwardRefExoticComponent,
  type MouseEvent,
  type NamedExoticComponent,
  type RefAttributes,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
  className?: string;
  maxWidth?: string;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
};

type ModalHeaderProps = {
  icon?: ComponentType<{ className?: string }>;
  iconBg?: string;
  iconColor?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  className?: string;
};

type ModalSectionProps = {
  children?: ReactNode;
  className?: string;
};

type ModalCompoundComponent = ForwardRefExoticComponent<
  ModalProps & RefAttributes<HTMLDivElement>
> & {
  Header: NamedExoticComponent<ModalHeaderProps>;
  Body: NamedExoticComponent<ModalSectionProps>;
  Footer: NamedExoticComponent<ModalSectionProps>;
};

const ModalBase = forwardRef<HTMLDivElement, ModalProps>(({
  open,
  onClose,
  children,
  className = '',
  maxWidth = 'max-w-md',
  closeOnBackdrop = true,
  showCloseButton = false,
}, ref) => {
  const handleContentClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={handleContentClick}
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

ModalBase.displayName = 'Modal';

const ModalHeader = memo(function ModalHeader({
  icon: Icon,
  iconBg = 'bg-blue-100 dark:bg-blue-900/30',
  iconColor = 'text-blue-600 dark:text-blue-400',
  title,
  subtitle,
  children,
  className = '',
}: ModalHeaderProps) {
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

const ModalBody = memo(function ModalBody({
  children,
  className = '',
}: ModalSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
});

const ModalFooter = memo(function ModalFooter({
  children,
  className = '',
}: ModalSectionProps) {
  return (
    <div className={`mt-6 flex gap-3 ${className}`}>
      {children}
    </div>
  );
});

const Modal = Object.assign(ModalBase, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
}) as ModalCompoundComponent;

export default Modal;
