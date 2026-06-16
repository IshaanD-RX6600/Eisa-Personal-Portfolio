'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CarouselImage } from './ImageCarousel';

interface ReferencesModalProps {
  images: CarouselImage[];
}

const CLOSE_MS = 200;

// A reference is linkable only when it's an http(s) URL; other values
// (e.g. "Google Earth") are shown as plain source text.
export function isUrl(ref: string): boolean {
  return /^https?:\/\//i.test(ref.trim());
}

// Trim a URL down to a readable host + path for display.
function prettyUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, '');
    return u.host + (path && path !== '/' ? path : '');
  } catch {
    return url;
  }
}

// Self-contained "View References" affordance: renders the fixed trigger button
// and an animated modal listing each image's source. Shared by every place page.
export default function ReferencesModal({ images }: ReferencesModalProps) {
  const [open, setOpen] = useState(false); //  mounted in the DOM
  const [shown, setShown] = useState(false); // visually open (drives transition)
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    setShown(false);
    window.setTimeout(() => setOpen(false), CLOSE_MS);
  }, []);

  // Flip to shown on the next frame so the open transition runs, and move focus
  // to the close button for keyboard users.
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => setShown(true));
    const focus = window.setTimeout(() => closeBtnRef.current?.focus(), CLOSE_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(focus);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, handleClose]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-6 top-6 z-40 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md transition hover:border-[var(--accent)]/50 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        View references
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image references"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200"
            style={{ opacity: shown ? 1 : 0 }}
          />

          {/* Shell */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[var(--elevated)]/95 p-6 shadow-2xl backdrop-blur-md"
            style={{
              transition: `opacity ${CLOSE_MS}ms ease, transform ${CLOSE_MS}ms cubic-bezier(0.22,1,0.36,1)`,
              opacity: shown ? 1 : 0,
              transform: shown ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)',
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-white">Image references</h2>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-90"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <ul className="space-y-4">
              {images.map((img) => (
                <li key={img.src} className="border-l-2 border-[var(--accent)]/40 pl-4">
                  <p className="text-sm font-medium text-white">{img.caption}</p>
                  {img.reference ? (
                    isUrl(img.reference) ? (
                      <a
                        href={img.reference}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex max-w-full items-center gap-1.5 text-sm text-[var(--accent-2)] underline-offset-2 transition hover:text-[var(--accent-soft)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      >
                        <span className="truncate">{prettyUrl(img.reference)}</span>
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-hidden="true"
                          className="flex-none"
                        >
                          <path
                            d="M6 3h7v7M13 3L6.5 9.5M11 9.5V13H3V5h3.5"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-white/60">Source: {img.reference}</p>
                    )
                  ) : (
                    <p className="mt-1 text-sm italic text-white/40">No reference provided</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
