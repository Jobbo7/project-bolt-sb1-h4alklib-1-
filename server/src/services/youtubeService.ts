const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY ?? '';
const YOUTUBE_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';

export interface YouTubeTutorial {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

/**
 * Build the strict search query format:
 *   [Vehicle Year] [Vehicle Make] [Vehicle Model] [partQuery] repair replacement
 */
export function buildSearchQuery(
  vehicle: { year: number; make: string; model: string },
  partQuery: string,
): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model} ${partQuery} repair replacement`;
}

/**
 * Query the YouTube Data API v3 for tutorial videos matching the strict
 * search query. Returns at most 5 results.
 */
export async function searchYouTubeTutorials(
  vehicle: { year: number; make: string; model: string },
  partQuery: string,
): Promise<YouTubeTutorial[]> {
  if (!YOUTUBE_API_KEY) return [];

  const q = buildSearchQuery(vehicle, partQuery);
  const url = new URL(YOUTUBE_ENDPOINT);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', '5');
  url.searchParams.set('q', q);
  url.searchParams.set('key', YOUTUBE_API_KEY);

  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) return [];

  const json = (await res.json()) as any;
  return (json.items ?? []).map((item: any) => ({
    video_id: item.id?.videoId ?? '',
    title: item.snippet?.title ?? '',
    channel: item.snippet?.channelTitle ?? '',
    thumbnail: item.snippet?.thumbnails?.medium?.url ?? '',
  }));
}
