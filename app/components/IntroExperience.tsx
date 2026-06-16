'use client';

import { useCallback, useEffect, useState } from 'react';
import IntroStage from './IntroStage';
import { loadModel } from '../lib/loadModel';

const SOCCER = '/soccer_ball.glb';
const CRADLE = '/newtons_cradle.glb';
const SUPRA = '/toyota_supra.glb';

interface Scene {
  key: string;
  model: string | null;
  eyebrow: string;
  title: string;
  lines: string[];
}

const SCENES: Scene[] = [
  {
    key: 'welcome',
    model: null,
    eyebrow: 'Welcome',
    title: 'Meet Eisa',
    lines: ['A quick introduction before you step inside.'],
  },
  {
    key: 'soccer',
    model: SOCCER,
    eyebrow: 'Favourite sport',
    title: 'Soccer',
    lines: ['Position: Goalkeeper.', 'The last line of defence.'],
  },
  {
    key: 'physics',
    model: CRADLE,
    eyebrow: 'Favourite subject',
    title: 'IB SL Physics',
    lines: ['The same physics behind every save and curling free kick.'],
  },
  {
    key: 'driving',
    model: SUPRA,
    eyebrow: 'Off the pitch',
    title: 'Driving',
    lines: ['Happiest behind the wheel.'],
  },
];

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

// Full-screen "gate" that introduces Eisa with 3D props before revealing the
// site. Plays on every full page load / refresh (it stays mounted across
// client-side navigations, so it doesn't replay when moving between pages).
// Skippable, keyboard- and reduced-motion-friendly.
export default function IntroExperience() {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [ready, setReady] = useState<Record<string, boolean>>({});

  // Preload both models (with progress) as soon as the gate is up, so the heavy
  // Supra is ready by the time the viewer clicks through to it.
  useEffect(() => {
    if (!visible) return;
    for (const url of [SOCCER, CRADLE, SUPRA]) {
      loadModel(url, (frac) =>
        setProgress((p) => (p[url] === 1 ? p : { ...p, [url]: frac })),
      )
        .then(() => setReady((r) => ({ ...r, [url]: true })))
        .catch(() => {});
    }
  }, [visible]);

  // Lock background scroll while the gate is up.
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const finish = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => setVisible(false), reduced ? 0 : 550);
  }, [reduced]);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= SCENES.length - 1) {
        finish();
        return i;
      }
      return i + 1;
    });
  }, [finish]);

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Keyboard: →/Enter/Space advance, ← back, Esc skips.
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        back();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, next, back, finish]);

  if (!visible) return null;

  const scene = SCENES[index];
  const isLast = index === SCENES.length - 1;
  const modelLoading = scene.model ? !ready[scene.model] : false;
  const modelProgress = scene.model ? (progress[scene.model] ?? 0) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Introduction to Eisa"
      className="fixed inset-0 z-[200] overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, var(--surface) 0%, var(--base) 100%)',
        opacity: leaving ? 0 : 1,
        transition: reduced ? undefined : 'opacity 550ms ease',
      }}
    >
      {/* accent light pool */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 50% 36%, color-mix(in srgb, var(--accent) 16%, transparent) 0%, transparent 70%)',
        }}
      />

      {/* model stage */}
      <IntroStage modelUrl={scene.model} spin={!reduced} />

      {/* vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 85% at 50% 45%, transparent 55%, rgba(0,0,0,0.62) 100%)',
        }}
      />

      {/* Skip */}
      <button
        type="button"
        onClick={finish}
        className="absolute right-6 top-6 z-10 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 backdrop-blur-md transition hover:border-white/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        Skip intro →
      </button>

      {/* Text + controls */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-10">
        <div key={index} className="mx-auto w-full max-w-5xl">
          <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            {scene.eyebrow}
          </p>
          <h2
            className="animate-fade-up mt-2 bg-gradient-to-br from-white via-white to-white/55 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-7xl"
            style={{ animationDelay: reduced ? undefined : '70ms' }}
          >
            {scene.title}
          </h2>
          {scene.lines.map((line, i) => (
            <p
              key={i}
              className="animate-fade-up mt-2 max-w-xl text-base text-white/65 sm:text-lg"
              style={{ animationDelay: reduced ? undefined : `${140 + i * 60}ms` }}
            >
              {line}
            </p>
          ))}

          {/* loading bar for heavy models */}
          {modelLoading && (
            <div className="mt-5 max-w-xs">
              <div className="mb-1.5 text-xs text-white/45">
                Loading model… {Math.round(modelProgress * 100)}%
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-200"
                  style={{ width: `${Math.max(6, modelProgress * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* controls */}
          <div className="mt-8 flex items-center gap-5">
            <div className="flex items-center gap-2">
              {SCENES.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to ${s.title}`}
                  aria-current={i === index}
                  className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    i === index ? 'w-7 bg-[var(--accent)]' : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>

            <div className="flex-1" />

            {index > 0 && (
              <button
                type="button"
                onClick={back}
                className="text-sm font-medium text-white/60 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] active:scale-95"
            >
              {isLast ? 'Enter site' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
