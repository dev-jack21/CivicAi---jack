'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileUp,
  FileText,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Tag,
  Building2,
} from 'lucide-react';
import { useConfirm } from '@/hooks/useConfirm';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  full_name: string | null;
  email: string;
  role: string;
  avatar_url: string | null;
}

interface AdminLayoutShellProps {
  children: React.ReactNode;
  profile: Profile;
}

export default function AdminLayoutShell({ children, profile }: AdminLayoutShellProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { confirm, ConfirmModal } = useConfirm();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle ESC key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      description: 'Overview & stats',
    },
    {
      name: 'Upload',
      href: '/admin/upload',
      icon: FileUp,
      description: 'Add new policy',
    },
    {
      name: 'Policies',
      href: '/admin/policies',
      icon: FileText,
      description: 'Manage files',
    },
    {
      name: 'Feedback',
      href: '/admin/feedback',
      icon: MessageSquare,
      description: 'Citizen reviews',
    },
    {
      name: 'Categories',
      href: '/admin/categories',
      icon: Tag,
      description: 'Policy categories',
    },
    {
      name: 'Ministries',
      href: '/admin/ministries',
      icon: Building2,
      description: 'Government bodies',
    },
  ];

  // Helper to determine if link is active
  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const handleLogoutClick = async () => {
    const ok = await confirm({
      title: 'Log out',
      message: 'Are you sure you want to log out?',
      confirmLabel: 'Log out',
      icon: 'logout',
    });
    if (ok) {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (profile.full_name) {
      return profile.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return profile.email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-bg-base font-inter text-text-primary antialiased">
      {/* Skip Navigation Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary text-white rounded-md shadow-lg font-medium outline-none ring-2 ring-primary ring-offset-2"
      >
        Skip to main content
      </a>

      {/* MOBILE HEADER BAR */}
      <header className="lg:hidden bg-surface border-b border-border-custom px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="CivicAI" className="h-10 w-auto" />
          <span>
            Civic<span className="text-text-primary">AI</span>
            <span className="text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1.5 align-middle">
              Admin
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden inline-flex items-center justify-center min-h-11 min-w-11 text-text-secondary hover:text-text-primary hover:bg-zinc-100 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR DRAWER */}
      <aside
        id="mobile-menu"
        className={`lg:hidden fixed top-0 bottom-0 left-0 w-72 bg-surface border-r border-border-custom z-50 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out flex flex-col`}
      >
        <div className="p-4 border-b border-border-custom flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-primary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CivicAI" className="h-10 w-auto" />
            <span>
              Civic<span className="text-text-primary">AI</span>
              <span className="text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1.5">
                Admin
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="inline-flex items-center justify-center min-h-11 min-w-11 text-text-secondary hover:text-text-primary hover:bg-zinc-100 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  active
                    ? 'bg-primary/5 text-primary border-l-4 border-primary pl-3'
                    : 'text-text-secondary hover:bg-zinc-50 hover:text-text-primary pl-4'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-text-muted'}`} />
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-[11px] text-text-muted font-normal mt-0.5">
                    {item.description}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
              </Link>
            );
          })}
        </nav>

        {/* Mobile User Profile Footer */}
        <div className="p-4 border-t border-border-custom bg-bg-base/50">
          <div className="flex items-center gap-3 mb-4">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'Admin'}
                className="w-10 h-10 rounded-full border border-border-custom object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                {getInitials()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary truncate">
                {profile.full_name || 'Administrator'}
              </p>
              <p className="text-xs text-text-secondary truncate">{profile.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border-custom hover:bg-red-50 hover:text-red-600 text-text-secondary font-medium text-sm rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* DESKTOP PERSISTENT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-72 bg-surface border-r border-border-custom fixed left-0 top-0 h-screen z-30 shrink-0">
        {/* Sidebar Header Brand */}
        <div className="h-16 px-6 border-b border-border-custom flex items-center">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CivicAI" className="h-10 w-auto" />
            <span>
              Civic<span className="text-text-primary">AI</span>
              <span className="text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1.5 align-middle">
                Admin
              </span>
            </span>
          </Link>
        </div>

        {/* Desktop Sidebar Navigation Links */}
        <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto" aria-label="Desktop navigation">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary group ${
                  active
                    ? 'bg-primary/5 text-primary border-l-4 border-primary pl-3'
                    : 'text-text-secondary hover:bg-zinc-50 hover:text-text-primary pl-4'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'
                  }`}
                />
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-[11px] text-text-muted group-hover:text-text-secondary font-normal mt-0.5">
                    {item.description}
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 ml-auto opacity-0 group-hover:opacity-40 transition-opacity duration-200 ${
                    active ? 'opacity-40' : ''
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Desktop User Profile Footer */}
        <div className="p-6 border-t border-border-custom bg-bg-base/30">
          <div className="flex items-center gap-3 mb-4">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'Admin'}
                className="w-10 h-10 rounded-full border border-border-custom object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shrink-0">
                {getInitials()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary truncate">
                {profile.full_name || 'Administrator'}
              </p>
              <p className="text-xs text-text-secondary truncate">{profile.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border-custom hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-text-secondary font-medium text-sm rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main id="main-content" className="lg:ml-72 flex flex-col min-w-0 relative">
        {/* Content Wrapper */}
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-6xl w-full mx-auto">{children}</div>
      </main>
      {ConfirmModal}
    </div>
  );
}
