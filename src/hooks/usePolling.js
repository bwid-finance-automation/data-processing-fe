import { useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for polling operations with automatic cleanup
 * @param {Object} options - Polling configuration
 * @param {Function} options.pollFn - Async function to call on each poll interval
 * @param {number} options.interval - Polling interval in ms (default: 2000)
 * @param {number} options.timeout - Maximum polling duration in ms (default: 300000 = 5 min)
 * @param {Function} options.onSuccess - Callback when polling completes successfully
 * @param {Function} options.onError - Callback when polling encounters an error
 * @param {Function} options.onTimeout - Callback when polling times out
 * @returns {Object} - { startPolling, stopPolling, isPolling }
 */
export function usePolling({
  pollFn,
  interval = 2000,
  timeout = 300000,
  onSuccess,
  onError,
  onTimeout,
}) {
  const pollIntervalRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const isPollingRef = useRef(false);

  // Keep callback refs up to date
  const pollFnRef = useRef(pollFn);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    pollFnRef.current = pollFn;
  }, [pollFn]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  const startPolling = useCallback(() => {
    // Clear any existing polling
    stopPolling();
    isPollingRef.current = true;

    // Start polling interval
    pollIntervalRef.current = setInterval(async () => {
      if (!isPollingRef.current) return;

      try {
        const result = await pollFnRef.current();

        if (result?.completed) {
          stopPolling();
          onSuccessRef.current?.(result);
        } else if (result?.failed) {
          stopPolling();
          onErrorRef.current?.(result.error || 'Polling failed');
        }
        // Continue polling if neither completed nor failed
      } catch (error) {
        console.error('Polling error:', error);
        // Don't stop polling on error by default, just log it
        // The caller can handle errors via the pollFn return value
      }
    }, interval);

    // Set timeout to stop polling after max duration
    pollTimeoutRef.current = setTimeout(() => {
      if (isPollingRef.current) {
        stopPolling();
        onTimeoutRef.current?.();
      }
    }, timeout);
  }, [interval, timeout, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    startPolling,
    stopPolling,
    isPolling: isPollingRef.current,
  };
}

export default usePolling;
