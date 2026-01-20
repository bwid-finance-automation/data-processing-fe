import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to detect clicks outside of a referenced element
 * @param {Function} callback - Function to call when click outside is detected
 * @param {boolean} enabled - Whether the hook is active (default: true)
 * @returns {React.RefObject} - Ref to attach to the element
 */
export function useClickOutside(callback, enabled = true) {
  const ref = useRef(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callbackRef.current(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [enabled]);

  return ref;
}

export default useClickOutside;
