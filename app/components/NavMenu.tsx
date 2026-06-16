'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const LINKS = [{ href: '/', label: 'Home' }];

// Fixed hamburger button (top-left) that opens a full-screen navigation overlay.
export default function NavMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* Hamburger / close toggle */}
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="fixed left-6 top-6 z-50 flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full bg-white/10 backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <span
          className={`h-0.5 w-5 rounded-full bg-white transition-transform duration-300 ${
            open ? 'translate-y-[7px] rotate-45' : ''
          }`}
        />
        <span
          className={`h-0.5 w-5 rounded-full bg-white transition-opacity duration-300 ${
            open ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <span
          className={`h-0.5 w-5 rounded-full bg-white transition-transform duration-300 ${
            open ? '-translate-y-[7px] -rotate-45' : ''
          }`}
        />
      </button>

      {/* Overlay menu */}
      <nav
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
          open
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      >
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-3xl font-semibold tracking-tight transition sm:text-4xl ${
                active ? 'text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
