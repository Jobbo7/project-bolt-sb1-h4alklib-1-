import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const CACHE_TTL_SECONDS = 30 * 60; // 30 minutes

let client: Redis | null = null;

function getClient(): Redis {
  if (!client) client = new Redis(REDIS_URL);
  return client;
}

/** Build a stable cache key from the search params. */
export function cacheKey(searchString: string, location: string): string {
  return `fb:search:${location.toLowerCase()}:${searchString.toLowerCase()}`;
}

/** Return cached listings for a query, or null on miss. */
export async function getCached(
  searchString: string,
  location: string,
): Promise<string | null> {
  try {
    return await getClient().get(cacheKey(searchString, location));
  } catch {
    return null;
  }
}

/** Store listings for a query with a 30-minute TTL. */
export async function setCached(
  searchString: string,
  location: string,
  payload: string,
): Promise<void> {
  try {
    await getClient().set(cacheKey(searchString, location), payload, 'EX', CACHE_TTL_SECONDS);
  } catch {
    /* cache is best-effort */
  }
}
