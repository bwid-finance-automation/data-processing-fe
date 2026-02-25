import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

type ScrollContainerProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  maxHeight?: string;
};

const ScrollContainer = forwardRef<HTMLDivElement, ScrollContainerProps>(({
  children,
  className = '',
  maxHeight = 'max-h-60',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`overflow-y-auto ${maxHeight} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

ScrollContainer.displayName = 'ScrollContainer';

export default ScrollContainer;
