'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Eye, Type, LogOut, User as UserIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

import { User } from '@supabase/supabase-js';

const navLinks = [
  { href: '/policies', label: 'Policies' },
  { href: '/search', label: 'Search' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Auth state listener
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Accessibility state loader
  useEffect(() => {
    const storedContrast = localStorage.getItem('high-contrast') === 'true';
    const storedSize = (localStorage.getItem('font-size') as 'sm' | 'md' | 'lg' | 'xl') || 'md';

    setHighContrast(storedContrast);
    setFontSize(storedSize);

    if (storedContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    document.documentElement.classList.remove(
      'font-size-sm',
      'font-size-md',
      'font-size-lg',
      'font-size-xl'
    );
    document.documentElement.classList.add(`font-size-${storedSize}`);
  }, []);

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

  const toggleContrast = () => {
    const newContrast = !highContrast;
    setHighContrast(newContrast);
    localStorage.setItem('high-contrast', String(newContrast));
    if (newContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  const cycleFontSize = () => {
    const sizes: ('sm' | 'md' | 'lg' | 'xl')[] = ['sm', 'md', 'lg', 'xl'];
    const nextIdx = (sizes.indexOf(fontSize) + 1) % sizes.length;
    const nextSize = sizes[nextIdx];
    setFontSize(nextSize);
    localStorage.setItem('font-size', nextSize);
    document.documentElement.classList.remove(
      'font-size-sm',
      'font-size-md',
      'font-size-lg',
      'font-size-xl'
    );
    document.documentElement.classList.add(`font-size-${nextSize}`);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className="bg-surface sticky top-0 z-40 shadow-sm">
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
            <span className="text-lg font-bold tracking-tight text-text-primary leading-none">
              CivicAI
            </span>
            <span className="text-[10px] text-text-secondary leading-tight">
              Understand. Participate.
            </span>
          </div>
        </Link>

        {/* Desktop navigation & Accessibility Controls (640px and up) */}
        <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-text-secondary">
          {/* Accessibility Buttons — no divider, just grouped with a small gap */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleContrast}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-bg-base text-text-secondary hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              title="Toggle High Contrast Mode"
              aria-label="Toggle High Contrast Mode"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={cycleFontSize}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-bg-base text-text-secondary hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              title={`Increase Font Size (Current: ${fontSize})`}
              aria-label={`Increase Font Size (Current: ${fontSize})`}
            >
              <Type className="w-5 h-5" />
            </button>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className="inline-flex items-center min-h-11 px-3 hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 min-h-11 px-3 text-primary hover:text-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
              >
                <UserIcon className="w-4 h-4" />
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 min-h-11 px-3 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center min-h-11 px-4 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile accessibility & hamburger (below 640px) */}
        <div className="flex sm:hidden items-center gap-1">
          <button
            onClick={toggleContrast}
            className="p-2 rounded-md text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Toggle High Contrast Mode"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={cycleFontSize}
            className="p-2 rounded-md text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Cycle Font Size"
          >
            <Type className="w-5 h-5" />
          </button>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="inline-flex items-center justify-center min-h-11 min-w-11 text-text-secondary hover:text-text-primary hover:bg-bg-base rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
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
        </div>
      </nav>

      {/* Mobile menu backdrop */}
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
        className={`sm:hidden absolute left-0 right-0 top-16 bg-surface shadow-lg z-40 transform transition-transform duration-200 ease-in-out ${
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
              className="flex items-center min-h-11 px-3 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-base rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              tabIndex={isMobileMenuOpen ? 0 : -1}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center min-h-11 px-3 text-sm font-medium text-primary hover:bg-bg-base rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                tabIndex={isMobileMenuOpen ? 0 : -1}
              >
                <UserIcon className="w-4 h-4 mr-2" />
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center min-h-11 px-3 text-sm font-medium text-red-600 hover:bg-bg-base rounded-md transition-colors text-left focus:outline-none focus:ring-2 focus:ring-red-500"
                tabIndex={isMobileMenuOpen ? 0 : -1}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center min-h-11 px-4 mt-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              tabIndex={isMobileMenuOpen ? 0 : -1}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
