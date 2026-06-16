'use client';

import Link from 'next/link';
import ImageCarousel, { type CarouselImage } from '../components/ImageCarousel';
import ReferencesModal from '../components/ReferencesModal';

const TITLE = 'Toronto Spirit Garden';
const HINT = 'Click the arrows, dots, or swipe to explore each view.';

// Views of the Toronto Spirit Garden. Filenames have no spaces, so they're used
// as-is for the <img> src.
const DESCRIPTION_1 = `The Spirit Garden occupies one of the most visible locations in Toronto, directly beside City Hall and Nathan Phillips Square. This location was chosen intentionally because reconciliation cannot happen if Indigenous histories remain hidden. Built in response to Truth and Reconciliation Call to Action #82, the garden creates a permanent Indigenous presence in one of Canada's busiest public spaces. Rather than placing Indigenous history inside a museum, the design brings it into the everyday lives of millions of visitors. This demonstrates how architecture can contribute to reconciliation by making Indigenous experiences visible, encouraging public learning, and creating a shared space for reflection and understanding.`;

const DESCRIPTION_2 = `The Spirit Canoe recognizes the importance of travel, trade, and connection within Indigenous cultures. For generations, canoes linked communities across the land long before modern cities existed. By placing an Indigenous canoe within Toronto's civic centre, the Spirit Garden reminds visitors that Indigenous histories did not begin with colonization. The canoe helps challenge the misconception that Indigenous cultures belong only to the past. Instead, it presents Indigenous knowledge and traditions as living parts of Canada today. Architecture contributes to reconciliation when public spaces tell a more complete story of the land and the people connected to it.`;

const DESCRIPTION_3 = `At the centre of the Spirit Garden stands a limestone turtle sculpture created by Anishinaabe artist Solomon King. The turtle represents Turtle Island, a name many Indigenous peoples use for North America, and symbolizes the connection between people, land, and creation. The sculpture also honours survivors of residential schools and the children who never returned home. Positioned at the heart of the garden, the turtle serves as a reminder that reconciliation begins with acknowledging difficult truths. This reflects how Indigenous architecture differs from many traditional monuments: rather than celebrating power or conquest, it emphasizes memory, healing, and relationships. Through design, the Spirit Garden transforms public space into a place of learning and reconciliation.`;

const IMAGES: CarouselImage[] = [
  {
    src: '/ILOVENATAN.png',
    alt: 'Aerial view of the Toronto Spirit Garden and City Hall',
    caption: 'Aerial view',
    reference: 'Google Earth',
    description: DESCRIPTION_1,
  },
  {
    src: '/NaathanFILLIPSSQUARe.png',
    alt: 'The TORONTO sign and painted canoe sculpture at the Spirit Garden',
    caption: 'Spirit Canoe',
    reference: 'https://devp.org/en/toronto-spirit-garden/',
    description: DESCRIPTION_2,
  },
  {
    src: '/NATANFILiP.png',
    alt: 'Carved limestone turtle sculpture at the Toronto Spirit Garden',
    caption: 'Turtle sculpture',
    reference:
      'https://www.cbc.ca/news/canada/toronto/indigenous-spirit-garden-toronto-residential-school-survivors-cultural-space-1.7337072',
    description: DESCRIPTION_3,
  },
];

export default function TorontoPage() {
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
