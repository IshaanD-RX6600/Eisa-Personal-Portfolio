'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// WebGL canvases touch `window`, so load them client-only.
const EarthScene = dynamic(() => import('./components/EarthScene'), {
  ssr: false,
});
const Strands = dynamic(() => import('./components/Strands'), { ssr: false });

const CANADA: [number, number] = [56, -106];

export default function Home() {
  const [focusRegion, setFocusRegion] = useState<[number, number] | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  const startPresentation = () => {
    setFocusRegion(CANADA);
  };

  const reset = () => {
    setFocusRegion(null);
    setResetSignal((n) => n + 1);
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black">
      {/* Animated shader background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Strands
          colors={['#F97316', '#7C3AED', '#06B6D4']}
          count={3}
          speed={0.5}
          amplitude={1}
          waviness={1}
          thickness={0.7}
          glow={2.6}
          taper={3}
          spread={1}
          intensity={0.6}
          saturation={2}
          opacity={1}
          scale={1.5}
        />
      </div>

      {/* Spinning globe (transparent canvas sits over the background) */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <EarthScene focusRegion={focusRegion} resetSignal={resetSignal} />
      </div>

      {/* Foreground UI */}
      <header className="pointer-events-none absolute inset-x-0 top-10 z-20 flex flex-col items-center text-center text-white">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Eisa Siddiqui
        </h1>
        <p className="mt-2 text-sm text-white/60 sm:text-base">Portfolio</p>
      </header>

      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
        {focusRegion && (
          <button
            onClick={reset}
            className="rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Reset
          </button>
        )}
        <button
          onClick={startPresentation}
          className="rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          Start presentation
        </button>
      </div>
    </main>
  );
}
