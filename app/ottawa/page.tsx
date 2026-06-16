'use client';

import Link from 'next/link';
import ImageCarousel, { type CarouselImage } from '../components/ImageCarousel';
import ReferencesModal from '../components/ReferencesModal';

const TITLE = 'Residential Schools National Monument';
const HINT = 'Click the arrows, dots, or swipe to explore each view.';

// Two views of the monument near Parliament Hill in Ottawa. Filenames have no
// spaces, so they're used as-is for the <img> src.
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
    reference:
      'https://ottawacitizen.com/news/local-news/residential-school-memorial-monument-to-be-unveiled-at-museum-of-history',
    description: DESCRIPTION_2,
  },
];

export default function OttawaPage() {
  return (
    <main className="relative min-h-screen w-full px-6 py-24 sm:px-10">
      <ReferencesModal images={IMAGES} />

      <div className="w-full">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">
            ←
          </span>{' '}
          Back to map
        </Link>

        <h1 className="animate-fade-up mt-6 bg-gradient-to-br from-white via-white to-white/55 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-5xl">
          {TITLE}
        </h1>
        <p
          className="animate-fade-up mt-3 max-w-2xl text-sm text-white/50 sm:text-base"
          style={{ animationDelay: '90ms' }}
        >
          {HINT}
        </p>

        <ImageCarousel images={IMAGES} />
      </div>
    </main>
  );
}
