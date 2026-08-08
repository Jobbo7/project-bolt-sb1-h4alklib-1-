/**
 * Centralized selectors for Facebook Marketplace.
 *
 * Facebook rotates its DOM frequently. Keeping every selector in one file
 * means the worker can be updated independently of the main API router —
 * a selector fix is a one-file change with no API surface impact.
 *
 * Each selector is prefixed with the data it extracts so the worker reads
 * as a declaration rather than imperative scraping logic.
 */
export const SELECTORS = {
  // Cookie consent dialog (EU / first-visit)
  cookieAcceptButton: 'button[data-testid="cookie-policy-dialog-accept-button"]',
  cookieAcceptFallback: 'div[role="dialog"] button:nth-of-type(2)',

  // Search results — each listing card
  listingCard: 'a[href*="/marketplace/item/"]',
  listingCardFallback: 'div[role="article"] a[href*="/marketplace/item/"]',

  // Fields within a card
  listingTitle: 'span[role="heading"], img[alt]',
  listingPrice: 'span[dir="auto"]:has-text("$")',
  listingLocation: 'span[dir="auto"]:nth-of-type(2)',
  listingImage: 'img[src*="scontent"]',
} as const;

/** Build the Marketplace search URL for a query + location. */
export function buildMarketplaceUrl(searchString: string, location: string): string {
  const params = new URLSearchParams({ query: searchString });
  return `https://www.facebook.com/marketplace/${encodeURIComponent(location)}/search/?${params.toString()}`;
}
