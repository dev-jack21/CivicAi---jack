import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="border-b bg-white" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-10 w-auto" />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-[#111827] leading-none">CivicAI</span>
            <span className="text-[10px] text-[#6B7280] leading-tight">Understand. Participate.</span>
          </div>
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium text-[#6B7280]">
          <Link href="/policies" className="hover:text-[#111827] transition-colors">
            Policies
          </Link>
          <Link href="/search" className="hover:text-[#111827] transition-colors">
            Search
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-[#1B6CA8] hover:bg-[#0D4F80] text-white rounded-md transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}
