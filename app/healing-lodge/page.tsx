'use client';

import Link from 'next/link';
import ImageCarousel, { type CarouselImage } from '../components/ImageCarousel';

// The three views of the lodge. The screenshot filename has spaces, so it's
// URL-encoded for the <img> src.
const IMAGES: CarouselImage[] = [
  {
    src: '/Screenshot%202026-06-15%20012104.png',
    alt: 'Aerial view of the Okimaw Ohci Healing Lodge',
    caption: 'Aerial view',
    reference: 'Google Earth',
  },
  {
    src: '/HealingLodge.png',
    alt: 'Ground-level view of the Okimaw Ohci Healing Lodge',
    caption: 'Ground-level view',
    reference: 'https://salvationist.ca/articles/2016/02/okimaw-ohci-healing-lodge-salvation-army/',
  },
  {
    src: '/HEALINGLODGEEEEEEEEEEE.png',
    alt: 'View of the Okimaw Ohci Healing Lodge',
    caption: 'Lodge view',
    reference: 'https://globalnews.ca/news/10439439/indigenous-healing-lodges-face-chronic-underfunding-across-canada-critics-say/',
  },
];

export default function HealingLodgePage() {
  return (
    <main className="min-h-screen w-full bg-black px-6 py-24 sm:px-10">
      <div className="max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <span aria-hidden="true">←</span> Back to map
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Okimaw Ohci 
        </h1>


        <ImageCarousel images={IMAGES} />
      </div>
    </main>
  );
}
