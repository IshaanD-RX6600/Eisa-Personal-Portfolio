'use client';

import { useState } from 'react';
import Link from 'next/link';
import ImageCarousel, { type CarouselImage } from '../components/ImageCarousel';

// The three views of the lodge. The screenshot filename has spaces, so it's
// URL-encoded for the <img> src.
const DESCRIPTION = `A regular prison is organized around control — its centre is a guard station and its logic is containment. Okimaw Ohci is organized around the opposite. At its centre is the Spiritual Lodge, where Elders lead teachings and ceremonies, and the whole site sits inside the forest instead of behind a wall. The women here are not called inmates; they are residents, and they are not kept behind bars. This matters for reconciliation because Canada's justice system has harmed Indigenous communities for generations and broken trust between Indigenous and non-Indigenous people. A building that chooses healing over punishment begins to rebuild that trust — it shows that Indigenous approaches to justice are valued, not dismissed. Architecture becomes the place where reconciliation stops being a word and turns into something a person actually lives.`;

const IMAGES: CarouselImage[] = [
  {
    src: '/Screenshot%202026-06-15%20012104.png',
    alt: 'Aerial view of the Okimaw Ohci Healing Lodge',
    caption: 'Aerial view',
    reference: 'Google Earth',
    description: DESCRIPTION,
  },
  {
    src: '/HealingLodge.png',
    alt: 'Ground-level view of the Okimaw Ohci Healing Lodge',
    caption: 'Ground-level view',
    reference: 'https://salvationist.ca/articles/2016/02/okimaw-ohci-healing-lodge-salvation-army/',
    description: DESCRIPTION,
  },
  {
    src: '/HEALINGLODGEEEEEEEEEEE.png',
    alt: 'View of the Okimaw Ohci Healing Lodge',
    caption: 'Lodge view',
    reference: 'https://globalnews.ca/news/10439439/indigenous-healing-lodges-face-chronic-underfunding-across-canada-critics-say/',
    description: DESCRIPTION,
  },
];

export default function HealingLodgePage() {
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
          Okimaw Ohci Healing Lodge
        </h1>


        <ImageCarousel images={IMAGES} />
      </div>
    </main>
  );
}
