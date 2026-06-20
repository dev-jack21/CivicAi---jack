import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// Rate-limit rules per route pattern
// ---------------------------------------------------------------------------
interface RateLimitRule {
  pattern: RegExp;
  methods: string[];
  /** Max requests in windowMs */
  limit: number;
  /** Window in milliseconds */
  windowMs: number;
  label: string;
}

const RATE_LIMIT_RULES: RateLimitRule[] = [
  // File upload — expensive, pipeline-triggering
  {
    pattern: /^\/api\/upload$/,
    methods: ['POST'],
    limit: 5,
    windowMs: 60_000,
    label: 'upload',
  },
  // AI processing routes — calls external LLM/TTS
  {
    pattern: /^\/api\/process\/(summarize|tts)$/,
    methods: ['POST'],
    limit: 20,
    windowMs: 60_000,
    label: 'process',
  },
  // Feedback submission
  {
    pattern: /^\/api\/policies\/[^/]+\/feedback$/,
    methods: ['POST'],
    limit: 10,
    windowMs: 60_000,
    label: 'feedback',
  },
];

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function middleware(req: NextRequest) {
  // ------------------------------------------------------------------
  // 1. Rate limiting (runs before auth so we fail fast)
  // ------------------------------------------------------------------
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();
  const ip = getClientIp(req);

  for (const rule of RATE_LIMIT_RULES) {
    if (rule.pattern.test(pathname) && rule.methods.includes(method)) {
      const result = rateLimit(ip, rule.label, {
        limit: rule.limit,
        windowMs: rule.windowMs,
      });

      if (!result.ok) {
        const retryAfterSecs = Math.ceil((result.resetAt - Date.now()) / 1000);
        return NextResponse.json(
          { error: 'Too many requests. Please slow down and try again shortly.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfterSecs),
              'X-RateLimit-Limit': String(rule.limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
            },
          }
        );
      }
      break; // only apply the first matching rule
    }
  }

  // ------------------------------------------------------------------
  // 2. Auth + session refresh (Supabase SSR pattern)
  // ------------------------------------------------------------------
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  // Protect profile route
  if (req.nextUrl.pathname.startsWith('/profile')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Protect feedback submission API route from unauthenticated users
  if (req.nextUrl.pathname.match(/^\/api\/policies\/[^/]+\/feedback$/) && req.method === 'POST') {
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to submit feedback.' },
        { status: 401 }
      );
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
