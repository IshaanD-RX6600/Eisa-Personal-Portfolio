'use client';

import { useState } from 'react';
import Link from 'next/link';
import ImageCarousel, { type CarouselImage } from '../components/ImageCarousel';

// Three views around Whistler, BC. Filenames have no spaces, so they're used
// as-is for the <img> src.
const DESCRIPTION_1 = `From above, the Squamish Lil'wat Cultural Centre appears to emerge from the surrounding forest rather than dominate it. The building was intentionally designed to reflect Indigenous values that emphasize respect for the land and the interconnected relationship between people and nature. Rather than forcing the landscape to adapt to the building, the design works with its natural surroundings. This contributes to reconciliation because it demonstrates that Indigenous approaches to architecture offer valuable alternatives to conventional development practices. By recognizing Indigenous relationships with the land, the Cultural Centre helps challenge colonial ideas that viewed land primarily as a resource to be controlled and exploited.`;

const DESCRIPTION_2 = `The Cultural Centre was designed using architectural forms inspired by traditional Squamish and Lil'wat structures while incorporating modern materials and construction techniques. This demonstrates that Indigenous architecture is not confined to the past but continues to evolve and remain relevant today. Reconciliation requires more than acknowledging Indigenous history; it requires respecting Indigenous knowledge in the present. By creating a modern public building rooted in Indigenous worldviews, the Cultural Centre shows how architecture can bridge Indigenous traditions and contemporary Canadian society. The building itself becomes evidence that Indigenous perspectives deserve a meaningful place in the future of Canadian communities.`;

const IMAGES: CarouselImage[] = [
  {
    src: '/WhistlerBC.png',
    alt: 'View of Whistler, BC',
    caption: 'Whistler view',
    reference: 'Google Earth',
    description: DESCRIPTION_1,
  },
  {
    src: '/BCWHISTLER.png',
    alt: 'Aerial view of a timber lodge among the forested mountains of Whistler, BC',
    caption: 'Mountain lodge',
    reference: 'https://slcc.ca',
    description: DESCRIPTION_2,
  },
];

export default function WhistlerPage() {
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
            Squamish Lil'wat Cultural Centre
        </h1>


        <ImageCarousel images={IMAGES} />
      </div>
    </main>
  );
}
