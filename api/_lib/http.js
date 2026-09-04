import crypto from 'node:crypto';

const buckets = globalThis.__partsforgeRateBuckets || new Map();
globalThis.__partsforgeRateBuckets = buckets;

export function requestId(req) {
  return String(req.headers['x-request-id'] || crypto.randomUUID()).slice(0, 100);
}

export function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

export function enforceRateLimit(req, res, { limit = 30, windowMs = 60_000, scope = 'api' } = {}) {
  const now = Date.now();
  const key = `${scope}:${clientIp(req)}`;
  const current = buckets.get(key);
  const entry = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
  entry.count += 1;
  buckets.set(key, entry);
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - entry.count)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
  if (entry.count <= limit) return true;
  res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
  res.status(429).json({ error: 'RATE_LIMITED' });
  return false;
}

export function logEvent(level, event, details = {}) {
  const safe = Object.fromEntries(Object.entries(details).filter(([key]) => !/secret|token|password|authcode|key/i.test(key)));
  console[level](JSON.stringify({ event, timestamp: new Date().toISOString(), ...safe }));
}
