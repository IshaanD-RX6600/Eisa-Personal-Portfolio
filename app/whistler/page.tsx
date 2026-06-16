'use client';

import Link from 'next/link';
import ImageCarousel, { type CarouselImage } from '../components/ImageCarousel';
import ReferencesModal from '../components/ReferencesModal';

const TITLE = "Squamish Lil'wat Cultural Centre";
const HINT = 'Click the arrows, dots, or swipe to explore each view.';

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
