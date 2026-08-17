import { createClient } from '@supabase/supabase-js';

// Initializes backend Supabase connection securely using hidden environment variables
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { query } = req.body;
  if (!query || !query.trim()) return res.status(400).json({ error: 'Missing query parameters' });

  try {
    // 🏢 ENGINE 1: REGISTERED SUPPLIER CATALOG (SUPABASE CLOUD DATABASE)
    const { data: dbMatches, error: dbError } = await supabase
      .from('seller_offers')
      .select('*')
      .ilike('part', `%${query.trim()}%`);

    if (dbError) throw dbError;

    const wholesalers = (dbMatches || []).map(item => ({
      id: item.id,
      title: item.part,
      brand: item.brand || 'Verified Wholesale Network',
      shop: item.wholesaler_business_name || 'Registered Partner Node',
      price: parseFloat(item.price),
      trade: parseFloat(item.price) * 0.85, // 15% trade margin discount for mechanics
      retail: parseFloat(item.price),
      distanceKm: item.distance || 0,
      stock: item.stock || 5,
      loc: item.location || 'Main Warehouse Space'
    }));

    // 🌐 ENGINE 2: LIVE FACEBOOK MARKETPLACE CRAWLER (SOCIALCRAWL PROXY)
    let facebookItems = [];
    const proxyResponse = await fetch(`https://socialcrawl.dev`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.SOCIALCRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        searchKeyword: query.trim(),
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

    return res.status(200).json({ localWholesalers: wholesalers, facebookMarketplace: facebookItems });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
