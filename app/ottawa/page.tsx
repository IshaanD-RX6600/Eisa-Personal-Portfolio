'use client';

import { useState } from 'react';
import Link from 'next/link';
import ImageCarousel, { type CarouselImage } from '../components/ImageCarousel';

// Three views around Ottawa. Filenames have no spaces, so they're used
// as-is for the <img> src.
const DESCRIPTION_1 = `The location of the Residential Schools National Monument is as important as the monument itself. It is being built beside Parliament Hill, one of the most significant political spaces in Canada. For generations, decisions made by governments contributed to the residential school system and its devastating impacts on Indigenous communities. By placing the monument at the centre of the nation's capital, Indigenous history can no longer be ignored or pushed to the margins. This directly connects to TRC Call to Action #81, which calls for the creation of a Residential Schools National Monument in Ottawa. The monument demonstrates how architecture and public space can contribute to reconciliation by ensuring Indigenous experiences are visibly represented in places of national importance.`;

const DESCRIPTION_2 = `This monument incorporates Indigenous artistic traditions and symbolism into its design, allowing Indigenous voices to shape how the story of residential schools is remembered. Rather than having governments tell Indigenous stories on their behalf, Indigenous artists and survivors have played an important role in the monument's development. This contributes to reconciliation because it creates a space where Indigenous perspectives are respected and shared with the wider public. The monument demonstrates that architecture can do more than create structures; it can educate, commemorate, and encourage reflection. By embedding Indigenous identity into a national memorial, the design helps foster understanding between Indigenous and non-Indigenous Canadians while ensuring these histories remain visible for future generations.`;

const IMAGES: CarouselImage[] = [
  {
    src: '/MONUMNET.png',
    alt: 'Circular Indigenous beadwork-style flowerbed in a memorial garden',
    caption: 'Memorial garden',
    reference: 'Google Earth',
    description: DESCRIPTION_1,
  },
  {
    src: '/RESIDNETAILSCHOo.png',
    alt: 'Towering carved eagle sculpture above a residential school memorial installation',
    caption: 'Residential school memorial',
    reference: 'https://ottawacitizen.com/news/local-news/residential-school-memorial-monument-to-be-unveiled-at-museum-of-history',
    description: DESCRIPTION_2,
  },
];

export default function OttawaPage() {
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
          Ottawa residential school monument
        </h1>


        <ImageCarousel images={IMAGES} />
      </div>
    </main>
  );
}
