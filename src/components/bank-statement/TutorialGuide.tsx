import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SPOTLIGHT_PAD = 10;
const SPOTLIGHT_RADIUS = 16;
const TOOLTIP_W = 340;
const TOOLTIP_H_EST = 170;

/* ------------------------------------------------------------------ */
/*  Tour step definitions                                              */
/* ------------------------------------------------------------------ */

interface TourStep {
  target: string;   // CSS selector for the highlighted element
  descKey: string;  // i18n key
}

const STEPS: TourStep[] = [
  { target: '[data-tour="bs-header"]',   descKey: 'bsTourWelcome' },
  { target: '[data-tour="bs-project"]',  descKey: 'bsTourProject' },
  { target: '[data-tour="bs-upload"]',   descKey: 'bsTourUpload' },
  { target: '[data-tour="bs-results"]',  descKey: 'bsTourResults' },
  { target: '[data-tour="bs-history"]',  descKey: 'bsTourHistory' },
];

/* ------------------------------------------------------------------ */
/*  Position helpers                                                   */
/* ------------------------------------------------------------------ */

function computeTooltipPos(rect: DOMRect) {
  const gap = 16;

  // Try bottom first
  let top = rect.bottom + SPOTLIGHT_PAD + gap;
  let placement: 'bottom' | 'top' = 'bottom';

  if (top + TOOLTIP_H_EST > window.innerHeight - 16) {
    top = rect.top - SPOTLIGHT_PAD - gap - TOOLTIP_H_EST;
    placement = 'top';
  }
  if (top < 16) top = 16;

  let left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
  left = Math.max(16, Math.min(left, window.innerWidth - TOOLTIP_W - 16));

  const arrowX = Math.max(20, Math.min(
    rect.left + rect.width / 2 - left,
    TOOLTIP_W - 20,
  ));

  return { top, left, placement, arrowX };
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

interface TutorialGuideProps {
  open: boolean;
  onClose: () => void;
}

export default function TutorialGuide({ open, onClose }: TutorialGuideProps) {
  const { t } = useTranslation();
  const [stepIdx, setStepIdx] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState<TourStep[]>([]);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef(0);

  /* ---- detect visible steps when opened ---- */
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const vs = STEPS.filter((s) => document.querySelector(s.target));
      setVisibleSteps(vs);
      setStepIdx(0);
    }, 100);
    return () => clearTimeout(timer);
  }, [open]);

  /* ---- sync spotlight rect ---- */
  const syncRect = useCallback(() => {
    if (!open || visibleSteps.length === 0) return;
    const step = visibleSteps[stepIdx];
    if (!step) return;
    const el = document.querySelector(step.target);
    if (el) {
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [open, visibleSteps, stepIdx]);

  useEffect(() => { syncRect(); }, [syncRect]);

  /* ---- follow scroll / resize ---- */
  useEffect(() => {
    if (!open) return;
    const onUpdate = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(syncRect);
    };
    window.addEventListener('scroll', onUpdate, true);
    window.addEventListener('resize', onUpdate);
    return () => {
      window.removeEventListener('scroll', onUpdate, true);
      window.removeEventListener('resize', onUpdate);
      cancelAnimationFrame(rafRef.current);
    };
  }, [open, syncRect]);

  /* ---- scroll target into view ---- */
  useEffect(() => {
    if (!open || visibleSteps.length === 0) return;
    const step = visibleSteps[stepIdx];
    if (!step) return;
    const el = document.querySelector(step.target);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [open, stepIdx, visibleSteps]);

  /* ---- actions ---- */
  const complete = useCallback(() => {
    onClose();
  }, [onClose]);

  const next = useCallback(() => {
    if (stepIdx < visibleSteps.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      complete();
    }
  }, [stepIdx, visibleSteps.length, complete]);

  // Nothing to render when closed or no targets found
  if (!open || visibleSteps.length === 0) return null;

  const currentStep = visibleSteps[stepIdx];
  const pos = rect ? computeTooltipPos(rect) : null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]" onClick={complete}>

      {/* ── Spotlight ── */}
      {rect ? (
        <div
          className="absolute pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: rect.top - SPOTLIGHT_PAD,
            left: rect.left - SPOTLIGHT_PAD,
            width: rect.width + SPOTLIGHT_PAD * 2,
            height: rect.height + SPOTLIGHT_PAD * 2,
            borderRadius: SPOTLIGHT_RADIUS,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/55 pointer-events-none" />
      )}

      {/* ── Tooltip ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.descKey}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="absolute z-[10000]"
          style={
            pos
              ? { top: pos.top, left: pos.left, width: TOOLTIP_W }
              : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: TOOLTIP_W }
          }
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow pointing UP (tooltip is below target) */}
          {pos?.placement === 'bottom' && (
            <div
              className="w-0 h-0 ml-4"
              style={{
                marginLeft: pos.arrowX - 10,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderBottom: '10px solid rgb(17 24 39)',
              }}
            />
          )}

          {/* Card body */}
          <div className="bg-gray-900 rounded-2xl px-5 pt-5 pb-4 shadow-2xl">
            <p className="text-white text-sm leading-relaxed">
              {t(currentStep.descKey)}
            </p>

            <div className="mt-4 flex items-center justify-between">
              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {visibleSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === stepIdx ? 'w-5 bg-white' : 'w-2 bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              {/* Next / finish button */}
              <button
                onClick={next}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-gray-900 hover:bg-gray-200 transition-colors shadow-lg"
                aria-label={stepIdx < visibleSteps.length - 1 ? t('bsTourNext') : t('bsTourFinish')}
              >
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Arrow pointing DOWN (tooltip is above target) */}
          {pos?.placement === 'top' && (
            <div
              className="w-0 h-0"
              style={{
                marginLeft: pos.arrowX - 10,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '10px solid rgb(17 24 39)',
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Skip button ── */}
      <button
        onClick={(e) => { e.stopPropagation(); complete(); }}
        className="fixed top-6 right-6 z-[10001] flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm transition-colors"
      >
        {t('bsTourSkip')}
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>,
    document.body,
  );
}
