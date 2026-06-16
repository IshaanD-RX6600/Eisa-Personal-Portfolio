'use client';

import { useState } from 'react';
import Link from 'next/link';
import ImageCarousel, { type CarouselImage } from '../components/ImageCarousel';

// Views of Nathan Phillips Square. Filenames have no spaces, so they're used
// as-is for the <img> src.
const IMAGES: CarouselImage[] = [
  {
    src: '/ILOVENATAN.png',
    alt: 'Aerial view of Nathan Phillips Square and Toronto City Hall',
    caption: 'Aerial view',
    reference: 'Google Earth',
  },
  {
    src: '/NaathanFILLIPSSQUARe.png',
    alt: 'The TORONTO sign and painted canoe sculpture at Nathan Phillips Square',
    caption: 'TORONTO sign',
    reference: 'https://devp.org/en/toronto-spirit-garden/',
  },
  {
    src: '/NATANFILiP.png',
    alt: 'Carved stone turtle sculpture at Nathan Phillips Square',
    caption: 'Turtle sculpture',
    reference: 'https://www.cbc.ca/news/canada/toronto/indigenous-spirit-garden-toronto-residential-school-survivors-cultural-space-1.7337072',
  },
];

export default function TorontoPage() {
  const [showReferences, setShowReferences] = useState(false);

  return (
    <main className="relative min-h-screen w-full bg-black px-6 py-24 sm:px-10">
      {/* References button — top right of page */}
      <button
        type="button"
        onClick={() => setShowReferences(true)}
        className="fixed top-6 right-6 z-40 rounded-lg border border-white/20 bg-black/50 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition hover:bg-black/70 hover:text-white hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        View References
      </button>

      {/* References Modal */}
      {showReferences && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowReferences(false)}
        >
          <div
            className="max-h-96 w-full max-w-2xl overflow-y-auto rounded-2xl bg-black p-6 ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Image References</h2>
              <button
                type="button"
                onClick={() => setShowReferences(false)}
                aria-label="Close"
                className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {IMAGES.map((img) => (
                <div key={img.src} className="border-l-2 border-white/20 pl-4">
                  <p className="text-sm font-medium text-white">{img.caption}</p>
                  {img.reference ? (
                    <p className="mt-1 text-sm text-white/60">{img.reference}</p>
                  ) : (
                    <p className="mt-1 text-sm text-white/40 italic">No reference provided</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <span aria-hidden="true">←</span> Back to map
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Nathan Phillips Square
        </h1>


        <ImageCarousel images={IMAGES} />
      </div>
    </main>
  );
}
