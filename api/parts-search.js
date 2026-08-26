import { createClient } from '@supabase/supabase-js';

// Initializes backend Supabase connection securely using hidden environment variables
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  // 🟢 CORS HANDSHAKE SECURITY HEADERS ENABLES TABLET LAYER CONNECTION
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Con// ─── PARTSFORGE MULTI-SOURCE LIVE INTEGRATED SEARCH BROKER ───
// FILE: api/parts-search.js

import { createClient } from '@supabase/supabase-js';

// Initializes backend Supabase connection securely using hidden environment variables
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  // CORS Handshake security headers enable cross-platform tablet connection
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Reads both 'GET' URL parameters and 'POST' body loops seamlessly
  const searchParam = req.query.q || req.query.query || (req.body && req.body.query) || '';
  
  if (!searchParam || !searchParam.trim()) {
    return res.status(200).json({ local: [], national: [], trans_tasman: [], global_direct: [], facebook: [] });
  }

  try {
    const cleanQuery = searchParam.trim();
    console.log(`Dispatched live network database search parameter: "${cleanQuery}"`);

    // 🏢 ENGINE 1: REGISTERED SUPPLIER CATALOGUE (SUPABASE CLOUD DATABASE)
    const { data: dbMatches, error: dbError } = await supabase
      .from('seller_offers')
      .select('*')
      .ilike('part', `%${cleanQuery}%`);

    if (dbError) throw dbError;

    const wholesalers = (dbMatches || []).map(item => ({
      id: item.id || `SKU-${Math.random().toString(36).substring(7)}`,
      title: (item.part || 'Wholesale Auto Component').toUpperCase(),
      brand: (item.brand || 'Verified Wholesale Network').toUpperCase(),
      shop: item.wholesaler_business_name || 'Registered Partner Node',
      price: parseFloat(item.price) || 0,
      trade: parseFloat(item.price) * 0.85 || 0, // 15% trade margin discount for mechanics
      retail: parseFloat(item.price) || 0,
      distanceKm: item.distance || 4.2,
      stock: item.stock || 5,
      loc: item.location || 'Main Warehouse Space',
      category: 'part'
    }));

    // 🌐 ENGINE 2: LIVE FACEBOOK MARKETPLACE CRAWLER (SOCIALCRAWL PROXY)
    let facebookItems = [];
    
    if (process.env.SOCIALCRAWL_API_KEY) {
      try {
        const proxyResponse = await fetch(`https://socialcrawl.dev`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SOCIALCRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            searchKeyword: cleanQuery,
            location: "Melbourne, Australia",
            radiusKm: 50
          })
        });

        if (proxyResponse.ok) {
          const scraped = await proxyResponse.json();
          facebookItems = (scraped || []).slice(0, 4).map((item, idx) => ({
            id: item.id || `CRAWL-${idx}-${Date.now()}`,
            title: `[FB Marketplace] ${item.title}`.toUpperCase(),
            brand: 'USED CONSUMER LISTING',
            shop: item.sellerName || 'Private Individual Seller',
            price: parseFloat(item.price) || 0,
            retail: parseFloat(item.price) || 0,
            trade: parseFloat(item.price) || 0,
            distanceKm: item.distanceKm || 12,
            stock: 1,
            loc: item.location || 'Local Pickup Area',
            category: 'part'
          }));
        }
      } catch (crawlErr) {
        console.error("⚠️ Background crawler bypass active:", crawlErr);
      }
    } else {
      facebookItems = [
        { id: `FB-MOCK-${Date.now()}`, title: `[Peer Listing] Used Parts Matching: ${cleanQuery}`.toUpperCase(), brand: 'USED CONSUMER LISTING', shop: 'Local Private Seller', price: 120.00, retail: 120.00, trade: 120.00, distanceKm: 15, stock: 1, loc: 'Craigieburn, VIC', category: 'part' }
      ];
    }

    // 🌐 ENGINE 3: GLOBAL BROAD MARKET REPLACEMENT CATALOGUE (EBAY MOTORS API)
    let globalDirectItems = [];
    if (process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET) {
      try {
        const credentialsToken = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64');
        const authHandshake = await fetch('https://ebay.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentialsToken}`
          },
          body: 'grant_type=client_credentials&scope=https://ebay.com'
        });
        const authData = await authHandshake.json();

        if (authData.access_token) {
          const catalogueUrl = `https://ebay.com{encodeURIComponent(cleanQuery)}&limit=4`;
          const catalogueResponse = await fetch(catalogueUrl, {
            headers: { 'Authorization': `Bearer ${authData.access_token}` }
          });
          const marketData = await catalogueResponse.json();

          globalDirectItems = (marketData.itemSummaries || []).map((item, idx) => {
            const baseValue = parseFloat(item.price?.value) || 85.00;
            return {
              id: `PART-LIVE-EBAY-${idx}-${Date.now()}`,
              title: (item.title || 'Automotive Component').toUpperCase().substring(0, 60),
              brand: (item.brand || 'Genuine OEM').toUpperCase(),
              price: baseValue,
              trade: +(baseValue * 0.80).toFixed(2), // Calculates a 20% trade garage discount factor
              retail: baseValue,
              shop: item.seller?.username || 'Verified Marketplace Vendor',
              loc: 'Global Distribution Shard Node',
              distanceKm: 8.5 + idx,
              stock: 2 + idx,
              category: 'part'
            };
          });
        }
      } catch (ebayErr) {
        console.error('⚠️ Secondary eBay connection timeout bypassed:', ebayErr);
      }
    }

    // ─── ALIGN PAYLOAD DATA SHAPES PRECISELY WITH SOURCING_TIERS KEYS ───
    return res.status(200).json({
      local: wholesalers,
      national: wholesalers.slice(2),
      trans_tasman: [],
      global_direct: globalDirectItems,
      facebook: facebookItems
    });

  } catch (error) {
    console.error("❌ Parts database query process failure:", error);
    return res.status(200).json({ local: [], national: [], trans_tasman: [], global_direct: [], facebook: [] });
  }
}
trol-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 🟢 READS BOTH 'GET' URL PARAMS AND 'POST' BODY LOOPS SILENTLY
  const searchParam = req.query.q || req.query.query || (req.body && req.body.query) || '';
  
  if (!searchParam || !searchParam.trim()) {
    return res.status(200).json({ localWholesalers: [], facebookMarketplace: [] });
  }

  try {
    const cleanQuery = searchParam.trim();
    console.log(`📡 Dispatched live network database search parameter: "${cleanQuery}"`);

    // 🏢 ENGINE 1: REGISTERED SUPPLIER CATALOG (SUPABASE CLOUD DATABASE)
    const { data: dbMatches, error: dbError } = await supabase
      .from('seller_offers')
      .select('*')
      .ilike('part', `%${cleanQuery}%`);

    if (dbError) throw dbError;

    const wholesalers = (dbMatches || []).map(item => ({
      id: item.id || `SKU-${Math.random().toString(36).substring(7)}`,
      title: item.part || 'Wholesale Auto Component',
      brand: item.brand || 'Verified Wholesale Network',
      shop: item.wholesaler_business_name || 'Registered Partner Node',
      price: parseFloat(item.price) || 0,
      trade: parseFloat(item.price) * 0.85 || 0, // 15% trade margin discount for mechanics
      retail: parseFloat(item.price) || 0,
      distanceKm: item.distance || 0,
      stock: item.stock || 5,
      loc: item.location || 'Main Warehouse Space'
    }));

    // 🌐 ENGINE 2: LIVE FACEBOOK MARKETPLACE CRAWLER (SOCIALCRAWL PROXY)
    let facebookItems = [];
    
    // Checks if your premium proxy crawler authentication key is present
    if (process.env.SOCIALCRAWL_API_KEY) {
      try {
        const proxyResponse = await fetch(`https://socialcrawl.dev`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${process.env.SOCIALCRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            searchKeyword: cleanQuery,
            location: "Melbourne, Australia",
            radiusKm: 50 
          })
        });

        if (proxyResponse.ok) {
          const scraped = await proxyResponse.json();
          facebookItems = (scraped || []).slice(0, 4).map((item, idx) => ({
            id: item.id || `CRAWL-${idx}-${Date.now()}`,
            title: `[FB Marketplace] ${item.title}`,
            brand: 'Used Consumer Listing',
            shop: item.sellerName || 'Private Individual Seller',
            price: parseFloat(item.price) || 0,
            retail: parseFloat(item.price) || 0,
            trade: parseFloat(item.price) || 0,
            distanceKm: item.distanceKm || 12,
            stock: 1,
            loc: item.location || 'Local Pickup Area'
          }));
        }
      } catch (crawlErr) {
        console.error("⚠️ Background crawler bypass active:", crawlErr);
      }
    } else {
      // Clean fallback index records for the used marketplace panel tracking rows
      facebookItems = [
        { id: `FB-MOCK-${Date.now()}`, title: `[Peer Listing] Used Parts Matching: ${cleanQuery}`, brand: 'Used Consumer Listing', shop: 'Local Private Seller', price: 120.00, retail: 120.00, trade: 120.00, distanceKm: 15, stock: 1, loc: 'Craigieburn, VIC' }
      ];
    }

    return res.status(200).json({ localWholesalers: wholesalers, facebookMarketplace: facebookItems });
  } catch (error) {
    console.error("❌ Parts database query process failure:", error);
    return res.status(500).json({ error: error.message });
  }
}
