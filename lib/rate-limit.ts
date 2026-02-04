type RateState = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateState>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    buckets.set(key, next);
    return { ok: true, remaining: limit - 1, resetAt: next.resetAt };
  }

  if (current.count >= limit) {
    return { ok: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  buckets.set(key, current);
  return { ok: true, remaining: limit - current.count, resetAt: current.resetAt };
}

export function getClientKey(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  // @ts-expect-error NextRequest has ip but Request doesn't
  return request.ip || 'unknown';
}
