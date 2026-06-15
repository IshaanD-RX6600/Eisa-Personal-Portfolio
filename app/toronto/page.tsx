'use client';

import Link from 'next/link';
import ImageCarousel, { type CarouselImage } from '../components/ImageCarousel';

// Views of Nathan Phillips Square. Filenames have no spaces, so they're used
// as-is for the <img> src.
const IMAGES: CarouselImage[] = [
  {
    src: '/NaathanFILLIPSSQUARe.png',
    alt: 'The TORONTO sign and painted canoe sculpture at Nathan Phillips Square',
    caption: 'TORONTO sign',
  },
  {
    src: '/NATANFILiP.png',
    alt: 'Carved stone turtle sculpture at Nathan Phillips Square',
    caption: 'Turtle sculpture',
  },
  {
    src: '/ILOVENATAN.png',
    alt: 'Aerial view of Nathan Phillips Square and Toronto City Hall',
    caption: 'Aerial view',
  },
];

export default function TorontoPage() {
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
          Nathan Phillips Square
        </h1>
        <p className="mt-3 text-sm text-white/60 sm:text-base">
          Three views of the square — click, swipe, or use the arrows to explore.
        </p>

        <ImageCarousel images={IMAGES} />
      </div>
    </main>
  );
}
