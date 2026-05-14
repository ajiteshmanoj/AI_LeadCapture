// In-memory rate limiter. Resets on cold start — fine for the volumes we expect
// per conversation; swap for Upstash/Redis if you go multi-region.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) return { allowed: false, remaining: 0 };
  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}
