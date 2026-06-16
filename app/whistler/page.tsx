'use client';

import Link from 'next/link';
import ImageCarousel, { type CarouselImage } from '../components/ImageCarousel';

// Three views around Whistler, BC. Filenames have no spaces, so they're used
// as-is for the <img> src.
const IMAGES: CarouselImage[] = [
  {
    src: '/BCWHISTLER.png',
    alt: 'Aerial view of a timber lodge among the forested mountains of Whistler, BC',
    caption: 'Mountain lodge',
  },
  {
    src: '/WhistlerBC.png',
    alt: 'View of Whistler, BC',
    caption: 'Whistler view',
  },
  {
    src: '/INDIGENOUSMUSEAMBC.png',
    alt: 'Carved totem poles outside the Squamish Lil’wat Cultural Centre',
    caption: 'Cultural centre',
  },
];

export default function WhistlerPage() {
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
          Whistler, BC
        </h1>
        <p className="mt-3 text-sm text-white/60 sm:text-base">
          Three views around Whistler — click, swipe, or use the arrows to explore.
        </p>

        <ImageCarousel images={IMAGES} />
      </div>
    </main>
  );
}
