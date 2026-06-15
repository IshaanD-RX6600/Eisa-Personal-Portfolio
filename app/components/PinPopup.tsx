'use client';

import { useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// POPUP — all timing / easing / scale values, tweak the feel here.
// ─────────────────────────────────────────────────────────────────────────────
export const POPUP = {
  anchor: 'center' as 'center', //   layout anchor (only 'center' implemented)
  maxWidth: 520, //                  px
  backdropOpacity: 0.6, //           final darkness of the backdrop
  backdropBlur: 8, //                px blur at full open

  openMs: 420, //                    open duration
  openEase: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // springy overshoot
  fromScale: 0.85, //                popup starts at this scale
  fromTranslateY: 20, //             ...and this many px below center
  staggerMs: 60, //                  delay between shell → header → body

  closeMs: 240, //                   close is snappier than open
  closeEase: 'cubic-bezier(0.4, 0, 1, 1)',

  reducedMs: 140, //                 prefers-reduced-motion: quick fade only
};
// ─────────────────────────────────────────────────────────────────────────────

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

interface PinPopupProps {
  /** Index of the selected pin, or null when nothing is selected. */
  pinIndex: number | null;
  /** Heading text for the selected pin. */
  label: string;
  /** Optional image shown on the left of the body. */
  image?: string;
  /** Optional filler/body text shown to the right of the image. */
  body?: string;
  /** Called to request dismissal (backdrop click, close button, or Esc). */
  onClose: () => void;
}

interface PopupContent {
  label: string;
  image?: string;
  body?: string;
}

// Image with a graceful placeholder if the file isn't there yet.
function PopupImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#243042] to-[#161b24] px-2 text-center text-[11px] font-medium uppercase tracking-wider text-white/40">
        {alt}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}

export default function PinPopup({ pinIndex, label, image, body, onClose }: PinPopupProps) {
  const reduced = usePrefersReducedMotion();

  const [mounted, setMounted] = useState(false); // present in the DOM
  const [shown, setShown] = useState(false); //    visually open (drives transitions)
  // Snapshot of the selected pin's content, retained during the close animation.
  const [content, setContent] = useState<PopupContent>({ label, image, body });

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const rafId = useRef<number | undefined>(undefined);

  // Open / swap / close driven by pinIndex. Interruptible: re-opening cancels an
  // in-flight close, and swapping pins just updates content without re-mounting.
  useEffect(() => {
    if (pinIndex !== null) {
      setContent({ label, image, body });
      window.clearTimeout(closeTimer.current);
      setMounted(true);
      // Two rAFs so the closed styles paint before flipping to open.
      rafId.current = requestAnimationFrame(() =>
        requestAnimationFrame(() => setShown(true)),
      );
      return () => {
        if (rafId.current) cancelAnimationFrame(rafId.current);
      };
    }
    // close
    setShown(false);
    closeTimer.current = window.setTimeout(
      () => setMounted(false),
      reduced ? POPUP.reducedMs : POPUP.closeMs,
    );
  }, [pinIndex, label, image, body, reduced]);

  // Focus trap + Esc, and restore focus on close.
  useEffect(() => {
    if (!mounted) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => closeBtnRef.current?.focus(), 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  const dur = reduced ? POPUP.reducedMs : shown ? POPUP.openMs : POPUP.closeMs;
  const ease = reduced ? 'ease' : shown ? POPUP.openEase : POPUP.closeEase;

  const backdropStyle: React.CSSProperties = {
    transition: `opacity ${dur}ms ${ease}, backdrop-filter ${dur}ms ${ease}, -webkit-backdrop-filter ${dur}ms ${ease}`,
    opacity: shown ? 1 : 0,
    backgroundColor: `rgba(0,0,0,${POPUP.backdropOpacity})`,
    backdropFilter: reduced ? undefined : `blur(${shown ? POPUP.backdropBlur : 0}px)`,
    WebkitBackdropFilter: reduced ? undefined : `blur(${shown ? POPUP.backdropBlur : 0}px)`,
  };

  const shellStyle: React.CSSProperties = {
    maxWidth: POPUP.maxWidth,
    transition: `transform ${dur}ms ${ease}, opacity ${dur}ms ${ease}, box-shadow ${dur}ms ease`,
    opacity: shown ? 1 : 0,
    transform: reduced
      ? 'none'
      : shown
        ? 'translateY(0) scale(1)'
        : `translateY(${POPUP.fromTranslateY}px) scale(${POPUP.fromScale})`,
    boxShadow: shown
      ? '0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08), 0 0 44px -8px rgba(126,152,188,0.28)'
      : '0 10px 30px rgba(0,0,0,0.4)',
  };

  // Staggered reveal for inner pieces (header = 1, body = 2). No delay on close.
  const innerStyle = (order: number): React.CSSProperties => ({
    transition: `opacity ${dur}ms ${ease}, transform ${dur}ms ${ease}`,
    transitionDelay: shown && !reduced ? `${order * POPUP.staggerMs}ms` : '0ms',
    opacity: shown ? 1 : 0,
    transform: reduced ? 'none' : shown ? 'translateY(0)' : 'translateY(8px)',
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ pointerEvents: shown ? 'auto' : 'none' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={backdropStyle}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Popup shell */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-popup-heading"
        onClick={(e) => e.stopPropagation()}
        style={shellStyle}
        className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0f1218]/90 backdrop-blur-md"
      >
        {/* Sheen sweep (runs once on open) */}
        {shown && !reduced && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.10) 50%, transparent 65%)',
              animation: 'popupSheen 900ms ease-out 360ms 1',
            }}
          />
        )}

        {/* Header (placeholder heading slot) */}
        <div
          style={innerStyle(1)}
          className="flex items-start justify-between gap-4 border-b border-white/10 px-6 pb-4 pt-5"
        >
          <h2
            id="pin-popup-heading"
            className="text-lg font-semibold tracking-tight text-white"
          >
            {content.label || 'Heading'}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-90"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Body — image on the left, filler text on the right (per pin) */}
        <div style={innerStyle(2)} className="px-6 py-6">
          {content.image || content.body ? (
            <div className="flex gap-5">
              {content.image && (
                <div className="h-36 w-36 flex-none overflow-hidden rounded-xl border border-white/10">
                  <PopupImage key={content.image} src={content.image} alt={content.label} />
                </div>
              )}
              {content.body && (
                <p className="min-w-0 flex-1 text-sm leading-relaxed text-white/70">
                  {content.body}
                </p>
              )}
            </div>
          ) : (
            <div className="min-h-[180px]" />
          )}
        </div>
      </div>
    </div>
  );
}
