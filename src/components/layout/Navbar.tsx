'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/policies', label: 'Policies' },
  { href: '/search', label: 'Search' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen || !menuRef.current) return;
    const firstLink = menuRef.current.querySelector<HTMLElement>('a, button');
    firstLink?.focus();
  }, [isMobileMenuOpen]);

  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
        role="navigation"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 min-h-11 focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-10 w-auto" />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-[#111827] leading-none">
              CivicAI
            </span>
            <span className="text-[10px] text-[#6B7280] leading-tight">
              Understand. Participate.
            </span>
          </div>
        </Link>

        {/* Desktop navigation (640px and up) */}
        <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-[#6B7280]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className="inline-flex items-center min-h-11 px-3 hover:text-[#111827] transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="inline-flex items-center min-h-11 px-4 bg-[#1B6CA8] hover:bg-[#0D4F80] text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Sign In
          </Link>
        </div>

        {/* Mobile hamburger (below 640px) */}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="sm:hidden inline-flex items-center justify-center min-h-11 min-w-11 text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" aria-hidden="true" />
          ) : (
            <Menu className="w-6 h-6" aria-hidden="true" />
          )}
        </button>
      </nav>

      {/* Mobile menu panel */}
      {isMobileMenuOpen && (
        <div
          className="sm:hidden fixed inset-0 top-16 bg-black/40 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        id="mobile-nav-menu"
        ref={menuRef}
        className={`sm:hidden absolute left-0 right-0 top-16 bg-white border-b border-border-custom shadow-lg z-40 transform transition-transform duration-200 ease-in-out ${
          isMobileMenuOpen
            ? 'translate-y-0 opacity-100'
            : '-translate-y-2 opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className="flex items-center min-h-11 px-3 text-sm font-medium text-[#6B7280] hover:text-[#111827] hover:bg-gray-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              tabIndex={isMobileMenuOpen ? 0 : -1}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="flex items-center justify-center min-h-11 px-4 mt-2 bg-[#1B6CA8] hover:bg-[#0D4F80] text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            tabIndex={isMobileMenuOpen ? 0 : -1}
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
