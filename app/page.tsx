'use client';

import dynamic from 'next/dynamic';

// Leaflet and Three.js touch `window` at import time, so load them client-only.
const CanadaMap = dynamic(() => import('./components/CanadaMap'), { ssr: false });
const CanadaModel = dynamic(() => import('./components/CanadaModel'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center gap-12 bg-black px-4 py-12 text-white">
      {/* Flat, interactive Leaflet map of Canada */}
      <section className="w-full max-w-4xl">
        <CanadaMap />
      </section>

      {/* 3D GLB view of Canada, rendered beneath the flat map */}
      <section className="w-full max-w-4xl">
        <CanadaModel />
      </section>
    </main>
  );
}
