/**
 * In-memory, per-IP fixed-window rate limiting for every /api route.
 * DECISION (locked): in-memory is fine for local dev — ask the user before a
 * real deploy (a multi-instance deploy needs a shared store, e.g. Upstash).
 *
 * Usage in a route handler:
 *   const limited = enforceRateLimit(request, "walmart");
 *   if (limited) return limited;
 */

type Bucket = {
  count: number;
  /** Epoch ms when the window resets. */
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
/** Prune when the map grows past this (dev-scale safety valve). */
const PRUNE_THRESHOLD = 500;

type RateLimitOptions = {
  /** Requests allowed per window. */
  limit?: number;
  /** Window length in ms. */
  windowMs?: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  /** ms until the window resets (0 when ok). */
  retryInMs: number;
};

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Fixed-window limiter keyed by `${routeName}:${ip}`.
 */
function rateLimit(
  key: string,
  { limit = 10, windowMs = 60_000 }: RateLimitOptions = {},
): RateLimitResult {
  const now = Date.now();

  if (buckets.size > PRUNE_THRESHOLD) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryInMs: 0 };
  }

  existing.count += 1;
  if (existing.count <= limit) {
    return {
      ok: true,
      remaining: limit - existing.count,
      retryInMs: 0,
    };
  }

  return {
    ok: false,
    remaining: 0,
    retryInMs: Math.max(0, existing.resetAt - now),
  };
}

/**
 * Convenience for route handlers: returns a ready-to-send 429 JSON response
 * when the caller is over the limit, or null when the request may proceed.
 */
export function enforceRateLimit(
  request: Request,
  routeName: string,
  options: RateLimitOptions = {},
): Response | null {
  const result = rateLimit(`${routeName}:${getClientIp(request)}`, options);
  if (result.ok) return null;

  return Response.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(result.retryInMs / 1000)),
      },
    },
  );
}
