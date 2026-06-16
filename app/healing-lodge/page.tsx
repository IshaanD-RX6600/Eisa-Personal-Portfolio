'use client';

import Link from 'next/link';
import ImageCarousel, { type CarouselImage } from '../components/ImageCarousel';

// The three views of the lodge. The screenshot filename has spaces, so it's
// URL-encoded for the <img> src.
const IMAGES: CarouselImage[] = [
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

export default function HealingLodgePage() {
  return (
    <main className="min-h-screen w-full bg-black px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <span aria-hidden="true">←</span> Back to map
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Okimaw Ohci Healing Lodge
        </h1>
        <p className="mt-3 text-sm text-white/60 sm:text-base">
          Three views of the lodge — click, swipe, or use the arrows to explore.
        </p>

        <ImageCarousel images={IMAGES} />
      </div>
    </main>
  );
}
