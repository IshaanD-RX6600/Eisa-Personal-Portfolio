'use client';

import Link from 'next/link';
import ImageCarousel, { type CarouselImage } from '../components/ImageCarousel';

// Three views around Ottawa. Filenames have no spaces, so they're used
// as-is for the <img> src.
const IMAGES: CarouselImage[] = [
  {
    src: '/RESIDNETAILSCHOo.png',
    alt: 'Towering carved eagle sculpture above a residential school memorial installation',
    caption: 'Residential school memorial',
  },
  {
    src: '/MONUMNET.png',
    alt: 'Circular Indigenous beadwork-style flowerbed in a memorial garden',
    caption: 'Memorial garden',
  },
  {
    src: '/nigmonet.png',
    alt: 'The Gothic Revival West Block on Parliament Hill in Ottawa',
    caption: 'Parliament Hill',
  },
];

export default function OttawaPage() {
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
          Ottawa, ON
        </h1>
        <p className="mt-3 text-sm text-white/60 sm:text-base">
          Three views around Ottawa — click, swipe, or use the arrows to explore.
        </p>

        <ImageCarousel images={IMAGES} />
      </div>
    </main>
  );
}
