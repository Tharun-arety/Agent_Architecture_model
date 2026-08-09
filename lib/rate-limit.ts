/**
 * Fixed-window rate limit, in process memory.
 *
 * `/api/chat` is unauthenticated and spends a real API key, so it needs a cap
 * before it is public. This is the smallest thing that provides one.
 *
 * Its limits are real and worth stating rather than discovering: the counter
 * lives in the memory of a single serverless instance, so a deployment running
 * several instances enforces the limit per instance, and a cold start resets
 * it. That makes it a spend brake, not a security control. The honest fix is
 * Upstash or Vercel KV; the honest interim is saying so here instead of
 * implying a guarantee this does not give.
 */

const windows = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;

export type RateVerdict = { allowed: boolean; remaining: number; retryAfterSeconds: number };

export function checkRateLimit(key: string, limit: number): RateVerdict {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || now >= existing.resetAt) {
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);

  if (existing.count > limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds };
}

/** Best-effort client identity. Behind Vercel the leftmost `x-forwarded-for`
 *  entry is the real client; direct hits fall back to a shared bucket, which
 *  errs toward limiting too much rather than too little. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Housekeeping: without this the map grows for the lifetime of the instance. */
export function sweep(): void {
  const now = Date.now();
  for (const [key, window] of windows) {
    if (now >= window.resetAt) windows.delete(key);
  }
}
