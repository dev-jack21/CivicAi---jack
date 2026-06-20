import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="px-4 sm:px-6 lg:px-8 py-10 bg-surface overflow-x-hidden" role="contentinfo">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="max-w-md">
          <h2 className="text-base font-bold text-text-primary mb-2">About CivicAI</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            CivicAI is an accessible platform simplifying Kenyan government policies into plain
            English summaries with audio narrations, helping citizens stay informed and engaged.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 text-xs font-medium text-text-secondary">
            <Link
              href="/about"
              className="hover:text-[#1B6CA8] transition-colors focus:outline-none focus:underline"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="hover:text-[#1B6CA8] transition-colors focus:outline-none focus:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/accessibility"
              className="hover:text-[#1B6CA8] transition-colors focus:outline-none focus:underline"
            >
              Accessibility Statement
            </Link>
            <Link
              href="/contact"
              className="hover:text-[#1B6CA8] transition-colors focus:outline-none focus:underline"
            >
              Contact
            </Link>
          </div>
          <div className="text-[11px] text-text-muted">
            &copy; 2026 CivicAI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
