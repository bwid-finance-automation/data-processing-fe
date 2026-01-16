import { forwardRef } from 'react';

const ScrollContainer = forwardRef(({
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
