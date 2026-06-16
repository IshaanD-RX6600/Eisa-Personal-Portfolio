'use client';

import dynamic from 'next/dynamic';

// WebGL canvas touches `window`, so load it client-only.
const CanadaModel = dynamic(() => import('./components/CanadaModel'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="relative w-full">
      {/* Section 1 — Topography map (landing) */}
      <section className="min-h-screen w-full px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <h1 className="animate-fade-up bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-6xl">
            Building Reconciliation
          </h1>
          <p
            className="animate-fade-up mt-4 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg"
            style={{ animationDelay: '90ms' }}
          >
            How architecture and public space across Canada answer the Truth and Reconciliation
            Commission&rsquo;s Calls to Action — one place at a time.
          </p>
          <p
            className="animate-fade-up mt-2 inline-flex items-center gap-2 text-sm text-white/40"
            style={{ animationDelay: '180ms' }}
          >
            <span aria-hidden="true" className="text-[var(--accent)]">
              ●
            </span>
            Hover the provinces and click a marker to explore.
          </p>
          <div className="animate-fade-up mt-10" style={{ animationDelay: '260ms' }}>
            <CanadaModel />
          </div>
        </div>
      </section>
    </main>
  );
}
