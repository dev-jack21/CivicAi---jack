import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-surface border border-border-custom rounded-xl p-8 shadow-sm">
        <div className="w-16 h-16 bg-red-500/10 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
        <p className="text-text-secondary mb-8 text-sm leading-relaxed">
          You do not have the required permissions to view this page. Please contact your system
          administrator if you believe this is an error.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Go Home
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 border border-border-custom hover:bg-bg-base text-text-secondary text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
