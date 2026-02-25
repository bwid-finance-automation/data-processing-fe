import { useState, useRef, useEffect, useCallback } from 'react';

const IGNORED_TYPES = ['heartbeat', 'waiting', 'connected'];

/**
 * Custom hook for managing Server-Sent Events (SSE) progress streams.
 * Supports two modes:
 * - startWorkflow(): Tracks currentStep, completedSteps, result (Settlement, Open-New)
 * - startUploadStream(): Accumulates step objects with step_update merging (Upload)
 *
 * Each hook instance manages its own EventSource and cleans up on unmount.
 */
export function useSSEProgress() {
  const eventSourceRef = useRef(null);

  // Shared state
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);

  // Workflow mode state (Settlement / Open-New)
  const [currentStep, setCurrentStep] = useState('');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [result, setResult] = useState(null);

  // Upload mode state
  const [steps, setSteps] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  const close = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const resetWorkflow = useCallback(() => {
    setCurrentStep('');
    setCompletedSteps([]);
    setResult(null);
    setError(null);
  }, []);

  const resetUpload = useCallback(() => {
    setSteps([]);
    setIsComplete(false);
    setError(null);
  }, []);

  const resetAll = useCallback(() => {
    close();
    resetWorkflow();
    resetUpload();
    setIsRunning(false);
  }, [close, resetWorkflow, resetUpload]);

  /**
   * Start a workflow-style SSE stream (Settlement / Open-New pattern).
   * Tracks: currentStep, completedSteps, result, error, isRunning
   */
  const startWorkflow = useCallback((streamFn) => {
    close();
    resetWorkflow();
    setIsRunning(true);

    const es = streamFn();
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (IGNORED_TYPES.includes(data.type)) return;

        if (data.type === 'step_start') {
          setCurrentStep(data.step);
        }
        if (data.type === 'step_complete') {
          setCompletedSteps(prev => [...prev, data.step]);
        }
        if (data.type === 'complete') {
          setResult(data.data || {});
          setCurrentStep('done');
          setIsRunning(false);
          es.close();
        }
        if (data.type === 'error') {
          setError(data.message);
          setIsRunning(false);
          es.close();
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    es.onerror = () => {
      es.close();
    };
  }, [close, resetWorkflow]);

  /**
   * Start an upload-style SSE stream (Upload pattern).
   * Tracks: steps[], isComplete, error
   * Features step_update merging (replaces last entry if same step+type).
   */
  const startUploadStream = useCallback((streamFn) => {
    close();
    resetUpload();

    const es = streamFn();
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (IGNORED_TYPES.includes(data.type)) return;

        if (data.type === 'error') {
          setError(data.message);
          es.close();
          return;
        }

        if (data.type === 'complete') {
          setIsComplete(true);
          setSteps(prev => [...prev, data]);
          es.close();
          return;
        }

        // step_update merging: replace last entry if same step + type
        setSteps(prev => {
          if (data.type === 'step_update' && prev.length > 0) {
            const last = prev[prev.length - 1];
            if (last.step === data.step && last.type === 'step_update') {
              return [...prev.slice(0, -1), data];
            }
          }
          return [...prev, data];
        });
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    es.onerror = () => {
      console.warn('SSE connection lost, continues in background');
      es.close();
    };
  }, [close, resetUpload]);

  // Cleanup on unmount
  useEffect(() => {
    return () => close();
  }, [close]);

  return {
    // Shared
    isRunning, setIsRunning, error, setError,
    // Workflow mode
    currentStep, completedSteps, result,
    // Upload mode
    steps, setSteps, isComplete, setIsComplete,
    // Methods
    startWorkflow, startUploadStream, resetAll, resetWorkflow, resetUpload, close,
  };
}

export default useSSEProgress;
