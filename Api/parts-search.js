// ─── Dual-Engine Live Aggregator Search Broker ──────────────────────────────
// Routes frontend queries straight to your secure serverless backend proxy,
// stitching internal database lines together with live crawled marketplace results.
export const processPartsQuery = async (searchString) => {
  try {
    if (!searchString || !searchString.trim()) {
      return { local: [], national: [], trans_tasman: [], global_direct: [], facebook: [] };
    }

    console.log(`📡 Pushing unified query parameters to Vercel api: ${searchString}`);

    const response = await fetch('/api/parts-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchString.trim() })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Server rejected search handshake');

    // Feed the results smoothly directly into your existing layout tabs
    return {
      local: data.localWholesalers || [],          // 🏢 Your Live Supabase Wholesalers
      national: [],
      trans_tasman: [],
      global_direct: [],
      facebook: data.facebookMarketplace || []    // 🌐 Live Scraped Facebook Ads
    };

  } catch (error) {
    console.error("❌ Aggregator Search Connection Interrupted:", error.message);
    // Safe empty response array fallback to protect UI from crashing during blackouts
    return { local: [], national: [], trans_tasman: [], global_direct: [], facebook: [], error: error.message };
  }
};
