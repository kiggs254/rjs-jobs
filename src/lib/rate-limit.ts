// Best-effort in-memory rate limiter. Single-instance only; good enough to
// blunt brute-force on login and abuse on the public apply endpoint.
type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (b.count >= limit) return false
  b.count++
  return true
}

// Occasional cleanup so the map doesn't grow unbounded.
export function sweepRateLimits() {
  const now = Date.now()
  for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k)
}
