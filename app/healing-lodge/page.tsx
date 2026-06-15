'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

// The two views of the lodge, crossfaded in an alternating loop. The screenshot
// filename has spaces, so it's URL-encoded for the <img> src.
const IMAGES = [
  {
    src: '/HealingLodge.png',
    alt: 'Ground-level view of the Okimaw Ohci Healing Lodge',
    caption: 'Ground-level view',
  },
  {
    src: '/Screenshot%202026-06-15%20012104.png',
    alt: 'Aerial view of the Okimaw Ohci Healing Lodge',
    caption: 'Aerial view',
  },
  {
    src: '/HEALINGLODGEEEEEEEEEEE.png',
    alt: 'View of the Okimaw Ohci Healing Lodge',
    caption: 'Lodge view',
  },
];

// Time each image is held before crossfading to the next, and the fade length.
const INTERVAL_MS = 4000;
const FADE_MS = 1000;

const INNER_BG = '#0b0f17';

export default function HealingLodgePage() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance through the images; pauses while the viewer hovers the frame.
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % IMAGES.length),
      INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <main className="min-h-screen w-full bg-black px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/topography"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <span aria-hidden="true">←</span> Back to map
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Okimaw Ohci Healing Lodge
        </h1>
        <p className="mt-3 text-sm text-white/60 sm:text-base">
          Two views of the lodge, alternating from ground level to overhead.
        </p>

        {/* Crossfade frame — both images stacked, opacity toggled per slide. */}
        <div
          className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-2xl ring-1 ring-white/10"
          style={{ background: INNER_BG }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {IMAGES.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.src}
              src={img.src}
              alt={img.alt}
              className="absolute inset-0 h-full w-full object-contain transition-opacity ease-in-out"
              style={{
                opacity: i === index ? 1 : 0,
                transitionDuration: `${FADE_MS}ms`,
              }}
            />
          ))}

          {/* Current view label */}
          <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium tracking-wide text-white/80 backdrop-blur-sm">
            {IMAGES[index].caption}
          </div>
        </div>

        {/* Dot indicators — click to jump to a specific image. */}
        <div className="mt-6 flex justify-center gap-3">
          {IMAGES.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${img.caption.toLowerCase()}`}
              aria-current={i === index}
              className={`h-2.5 w-2.5 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                i === index ? 'bg-white' : 'bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
