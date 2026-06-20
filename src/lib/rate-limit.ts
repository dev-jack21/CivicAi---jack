/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Limitations:
 *  - State is per-process and resets on restart (acceptable for MVP/single-instance).
 *  - For multi-instance deployments, replace with a Redis-backed solution (e.g. Upstash).
 *
 * Usage:
 *   const result = rateLimit(ip, 'upload', { limit: 10, windowMs: 60_000 });
 *   if (!result.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  ok: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Epoch ms when the oldest request in the window expires */
  resetAt: number;
}

// Map<key, timestamps[]>
const store = new Map<string, number[]>();

export function rateLimit(
  identifier: string,
  route: string,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowMs } = options;
  const now = Date.now();
  const key = `${route}::${identifier}`;

  // Retrieve existing timestamps and drop expired ones
  const timestamps = (store.get(key) ?? []).filter((ts) => now - ts < windowMs);

  if (timestamps.length >= limit) {
    const resetAt = timestamps[0] + windowMs;
    return { ok: false, remaining: 0, resetAt };
  }

  timestamps.push(now);
  store.set(key, timestamps);

  return {
    ok: true,
    remaining: limit - timestamps.length,
    resetAt: timestamps[0] + windowMs,
  };
}
