import 'dotenv/config';
import { chromium, type BrowserContext, type Page } from 'playwright';
import { SELECTORS, buildMarketplaceUrl } from './selectors.js';
import { resolveProxy, applyProxyAuth } from './proxy.js';
import { getCached, setCached } from './cache.js';
import type { MarketplaceListing, SearchParams } from './types.js';

/**
 * Facebook Marketplace fallback metasearch worker.
 *
 * Isolated from the main API router so selector changes ship without
 * touching the Express app. Accepts a searchString + location, returns
 * normalized listings, and caches results in Redis for 30 minutes.
 */
export async function searchMarketplace(
  params: SearchParams,
): Promise<MarketplaceListing[]> {
  const { searchString, location } = params;

  // 1. Cache check — duplicate queries never hit Facebook twice.
  const cached = await getCached(searchString, location);
  if (cached) return JSON.parse(cached) as MarketplaceListing[];

  // 2. Launch a headless browser profile, routing through the proxy.
  const proxy = resolveProxy();
  const browser = await chromium.launch({
    headless: true,
    ...(proxy ? { proxy: { server: proxy.server } } : {}),
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    viewport: { width: 1366, height: 900 },
    locale: 'en-US',
  });

  if (proxy) await applyProxyAuth(context, proxy);

  try {
    const listings = await scrape(context, searchString, location);
    await setCached(searchString, location, JSON.stringify(listings));
    return listings;
  } finally {
    await context.close();
    await browser.close();
  }
}

async function scrape(
  context: BrowserContext,
  searchString: string,
  location: string,
): Promise<MarketplaceListing[]> {
  const page = await context.newPage();
  const url = buildMarketplaceUrl(searchString, location);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  await handleCookieConsent(page);

  // Wait for listing cards to render.
  await page
    .waitForSelector(SELECTORS.listingCard, { timeout: 15000 })
    .catch(() => {});

  return extractListings(page);
}

/** Accept the cookie consent dialog if present. */
async function handleCookieConsent(page: Page): Promise<void> {
  for (const sel of [SELECTORS.cookieAcceptButton, SELECTORS.cookieAcceptFallback]) {
    const btn = await page.$(sel);
    if (btn) {
      await btn.click().catch(() => {});
      return;
    }
  }
}

/** Extract normalized listings using the strict selector map. */
async function extractListings(page: Page): Promise<MarketplaceListing[]> {
  const cards = await page.$$(SELECTORS.listingCard);
  const listings: MarketplaceListing[] = [];

  for (const card of cards) {
    const title =
      (await card.$eval(SELECTORS.listingTitle, (el) => el.textContent ?? '').catch(
        () => '',
      )) ||
      (await card.getAttribute('aria-label')) ||
      '';

    const price = await card
      .$(SELECTORS.listingPrice)
      .then((el) => el?.textContent() ?? '')
      .catch(() => '');

    const location = await card
      .$(SELECTORS.listingLocation)
      .then((el) => el?.textContent() ?? '')
      .catch(() => '');

    const imageUrl = await card
      .$(SELECTORS.listingImage)
      .then((el) => el?.getAttribute('src') ?? '')
      .catch(() => '');

    const href = (await card.getAttribute('href')) ?? '';
    const sourceUrl = href
      ? new URL(href, 'https://www.facebook.com').toString().split('?')[0]
      : '';

    if (title && sourceUrl) {
      listings.push({ title: title.trim(), price, location, imageUrl, sourceUrl });
    }
  }

  return listings;
}

// CLI entry — run with: tsx server/src/workers/marketplaceWorker.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  const [searchString, location] = process.argv.slice(2);
  if (!searchString || !location) {
    console.error('Usage: marketplaceWorker.ts <searchString> <location>');
    process.exit(1);
  }
  searchMarketplace({ searchString, location })
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
