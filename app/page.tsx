'use client';

import dynamic from 'next/dynamic';

// R3F renders to a WebGL canvas and touches `window`, so load it client-only.
const EarthScene = dynamic(() => import('./components/EarthScene'), {
  ssr: false,
});

export default function Home() {
  const startPresentation = () => {
    // TODO: wire up what "Start presentation" should do.
    console.log('Start presentation');
  };

  return (
    <main className="relative h-screen w-full bg-black">
      <EarthScene />
      <header className="pointer-events-none absolute inset-x-0 top-10 flex flex-col items-center text-center text-white">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Eisa Siddiqui
        </h1>
        <p className="mt-2 text-sm text-white/60 sm:text-base">Portfolio</p>
      </header>
      <button
        onClick={startPresentation}
        className="absolute bottom-6 right-6 rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        Start presentation
      </button>
    </main>
  );
}
