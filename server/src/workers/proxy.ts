import type { ProxyConfig } from './types.js';

/**
 * Proxy middleware.
 *
 * All worker traffic is routed through this function so proxy credentials
 * live in one place. Swap the placeholder block for residential proxy
 * credentials (Bright Data, Smartproxy, Oxylabs, etc.) without touching
 * the worker logic.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  PLACEHOLDER — residential proxy credentials                │
 * │                                                             │
 * │  PROXY_SERVER     = http://gate.provider.com:8000           │
 * │  PROXY_USERNAME   = <account-id>                            │
 * │  PROXY_PASSWORD   = <zone-password>                         │
 * └─────────────────────────────────────────────────────────────┘
 */
const PROXY_SERVER = process.env.PROXY_SERVER ?? '';
const PROXY_USERNAME = process.env.PROXY_USERNAME ?? '';
const PROXY_PASSWORD = process.env.PROXY_PASSWORD ?? '';

/** Resolve the proxy configuration, or null if unconfigured. */
export function resolveProxy(): ProxyConfig | null {
  if (!PROXY_SERVER) return null;
  return {
    server: PROXY_SERVER,
    username: PROXY_USERNAME || undefined,
    password: PROXY_PASSWORD || undefined,
  };
}

/** Attach proxy auth headers to an in-page context (used for authenticated proxies). */
export async function applyProxyAuth(
  context: import('playwright').BrowserContext,
  proxy: ProxyConfig,
): Promise<void> {
  if (!proxy.username || !proxy.password) return;
  await context.setHTTPCredentials({
    username: proxy.username,
    password: proxy.password,
  });
}
