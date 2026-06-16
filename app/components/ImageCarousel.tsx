'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface CarouselImage {
  src: string;
  alt: string;
  caption: string;
  reference?: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
}

// ─────────────────────────────────────────────────────────────────────────────
// FEEL — transition timing / easing, tweak the motion here.
// ─────────────────────────────────────────────────────────────────────────────
const FADE_MS = 650; //   slide enter/exit length
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // soft, settled overshoot-free
const INNER_BG = '#0b0f17';
const SWIPE_THRESHOLD = 40; // px of horizontal travel to register a swipe
const TAP_SLOP = 6; //        movement under this counts as a tap (advance)
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

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const count = images.length;
  const reduced = usePrefersReducedMotion();

  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null); // exiting slide
  const [direction, setDirection] = useState(1); //                 1 fwd, -1 back
  const [animKey, setAnimKey] = useState(0); //                     retriggers anims
  const [showReferences, setShowReferences] = useState(false); //    references modal

  // Current index mirrored to a ref so the imperative pointer/keyboard handlers
  // always read the latest value without re-binding.
  const indexRef = useRef(0);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const go = useCallback(
    (next: number, dir?: number) => {
      const curr = indexRef.current;
      if (next === curr || next < 0 || next >= count) return;
      setDirection(dir ?? (next > curr ? 1 : -1));
      setPrevIndex(curr);
      setIndex(next);
      setAnimKey((k) => k + 1);
    },
    [count],
  );

  const goNext = useCallback(() => {
    const curr = indexRef.current;
    go((curr + 1) % count, 1);
  }, [go, count]);

  const goPrev = useCallback(() => {
    const curr = indexRef.current;
    go((curr - 1 + count) % count, -1);
  }, [go, count]);

  // Once a slide has finished exiting, drop it from the DOM.
  useEffect(() => {
    if (prevIndex === null) return;
    const t = window.setTimeout(() => setPrevIndex(null), FADE_MS);
    return () => window.clearTimeout(t);
  }, [animKey, prevIndex]);

  // Keyboard: ← / → step, Home / End jump to the ends.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (count <= 1) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'Home') {
      e.preventDefault();
      go(0, -1);
    } else if (e.key === 'End') {
      e.preventDefault();
      go(count - 1, 1);
    }
  };

  // Pointer: tap to advance, drag/swipe horizontally to step.
  const drag = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, active: true };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    } else if (Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) {
      goNext();
    }
  };

  // Per-slide animation names (reduced motion → plain fade, no travel/zoom).
  const enterAnim = reduced
    ? 'carouselFadeIn'
    : direction > 0
      ? 'carouselEnterRight'
      : 'carouselEnterLeft';
  const exitAnim = reduced
    ? 'carouselFadeOut'
    : direction > 0
      ? 'carouselExitLeft'
      : 'carouselExitRight';

  return (
    <div>
      {/* Stage */}
      <div
        className="group relative mt-10 aspect-[16/9] w-full select-none overflow-hidden rounded-2xl ring-1 ring-white/10"
        style={{ background: INNER_BG }}
        role="group"
        aria-roledescription="carousel"
        aria-label="Image carousel — use the arrows or arrow keys"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerLeave={() => {
          drag.current.active = false;
        }}
      >
        {/* Slides layer — taps/swipes land here (behind the controls). */}
        <div
          className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {prevIndex !== null && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`exit-${animKey}`}
              src={images[prevIndex].src}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="absolute inset-0 h-full w-full object-contain will-change-transform"
              style={{ animation: `${exitAnim} ${FADE_MS}ms ${EASE} both` }}
            />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={`enter-${animKey}`}
            src={images[index].src}
            alt={images[index].alt}
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain will-change-transform"
            style={{ animation: `${enterAnim} ${FADE_MS}ms ${EASE} both` }}
          />
        </div>

        {/* Current view label */}
        <div
          key={`cap-${index}`}
          className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-full bg-black/60 px-3 py-1 text-xs font-medium tracking-wide text-white/80 backdrop-blur-sm"
          style={{ animation: reduced ? undefined : `carouselCaptionIn ${FADE_MS}ms ${EASE} both` }}
        >
          {images[index].caption}
        </div>

        {/* Slide counter */}
        {count > 1 && (
          <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium tabular-nums text-white/70 backdrop-blur-sm">
            {index + 1} / {count}
          </div>
        )}

        {/* Prev / next arrows — appear on hover/focus (always shown on touch). */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/80 opacity-70 backdrop-blur-md transition hover:bg-black/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-90 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/80 opacity-70 backdrop-blur-md transition hover:bg-black/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-90 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}

        {/* Announce the active slide for assistive tech. */}
        <span className="sr-only" aria-live="polite">
          {`Image ${index + 1} of ${count}: ${images[index].caption}`}
        </span>
      </div>

      {/* Dot indicators — click to jump straight to an image. */}
      {count > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2.5">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show ${img.caption.toLowerCase()}`}
              aria-current={i === index}
              className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                i === index ? 'w-7 bg-white' : 'w-2.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* References button — always visible */}
      <div className="mt-6 flex items-center justify-center">
        <button
          type="button"
          onClick={() => setShowReferences(true)}
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          View References
        </button>
      </div>

      {/* References Modal */}
      {showReferences && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowReferences(false)}
        >
          <div
            className="max-h-96 w-full max-w-2xl overflow-y-auto rounded-2xl bg-black p-6 ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Image References</h2>
              <button
                type="button"
                onClick={() => setShowReferences(false)}
                aria-label="Close"
                className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {images.map((img, i) => (
                <div key={img.src} className="border-l-2 border-white/20 pl-4">
                  <p className="text-sm font-medium text-white">{img.caption}</p>
                  {img.reference ? (
                    <p className="mt-1 text-sm text-white/60">{img.reference}</p>
                  ) : (
                    <p className="mt-1 text-sm text-white/40 italic">No reference provided</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
