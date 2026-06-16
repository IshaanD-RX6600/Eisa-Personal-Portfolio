'use client';

import dynamic from 'next/dynamic';

// WebGL canvas touches `window`, so load it client-only.
const CanadaModel = dynamic(() => import('./components/CanadaModel'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="relative w-full bg-black">
      {/* Section 1 — Topography map (landing) */}
      <section className="min-h-screen w-full px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Map of Canada
          </h1>
          <p className="mt-3 text-sm text-white/60 sm:text-base">
            A 3D model of Canada.
          </p>
          <div className="mt-10">
            <CanadaModel />
          </div>
        </div>
      </section>
    </main>
  );
}
