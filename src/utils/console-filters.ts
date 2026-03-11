const REACT_DEVTOOLS_MESSAGE = 'Download the React DevTools for a better development experience';

if (typeof window !== 'undefined') {
  const originalInfo = console.info.bind(console);

  console.info = (...args: unknown[]) => {
    const firstArg = args[0];
    if (typeof firstArg === 'string' && firstArg.includes(REACT_DEVTOOLS_MESSAGE)) {
      return;
    }

    originalInfo(...args);
  };
}
