import { createClient } from '@supabase/supabase-js';

// Initialize the secure cloud connection using hidden keys locked in Vercel
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  // Lock down the endpoint to ONLY accept secure POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Missing search keyword parameters' });
  }

  try {
    // 🏢 ENGINE A: SCAN REGISTERED WHOLESALERS (SUPABASE CLOUD DATABASE)
    // Looks up parts inside your live PostgreSQL table matching the search string
    const { data: dbMatches, error: dbError } = await supabase
      .from('seller_offers')
      .select('*')
      .ilike('part', `%${query.trim()}%`);

    if (dbError) throw dbError;

    // Standardize database columns into the rows your frontend layout cards expect
    const wholesaleResults = (dbMatches || []).map(item => ({
      id: item.id,
      title: item.part,
      brand: item.brand || 'Verified Wholesale Network',
      shop: item.wholesaler_business_name || 'Registered Partner Node',
      price: parseFloat(item.price),
      trade: parseFloat(item.price) * 0.85, // Pre-calculate 15% trade margin discount for mechanics
      retail: parseFloat(item.price),
      distanceKm: item.distance || 0,
      stock: item.stock || 5,
      loc: item.location || 'Main Warehouse Space'
    }));

    // 🌐 ENGINE B: LIVE INTERNET CRAWLER (FACEBOOK MARKETPLACE APIS VIA PROXY)
    let marketplaceResults = [];
    
    // Send search keyword to an anonymous proxy scraper to bypass Meta's security firewalls
    const proxyResponse = await fetch(`https://socialcrawl.dev`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.SOCIALCRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        searchKeyword: query.trim(),
        location: "Melbourne, Australia", // Tailors default regional coordinates
        radiusKm: 50 
      })
    });

    if (proxyResponse.ok) {
      const rawScrapedData = await proxyResponse.json();
      
      // Map live crawled web ads cleanly onto your existing frontend HTML elements
      marketplaceResults = (rawScrapedData || []).slice(0, 4).map((item, idx) => ({
        id: item.id || `WEB-CRAWL-${idx}-${Date.now()}`,
        title: `[FB Marketplace] ${item.title}`,
        brand: 'Consumer Ad Listing',
        shop: item.sellerName || 'Private Individual Seller',
        price: parseFloat(item.price) || 0,
        retail: parseFloat(item.price) || 0,
        trade: parseFloat(item.price) || 0,
        distanceKm: item.distanceKm || 12,
        stock: 1,
        loc: item.location || 'Local Pickup Area'
      }));
    }

    // Blend both independent data streams back into a single unified JSON payload matrix
    return res.status(200).json({
      localWholesalers: wholesaleResults,
      facebookMarketplace: marketplaceResults
    });

  } catch (error) {
    console.error("❌ Aggregator Search Pipeline Failure:", error.message);
    return res.status(500).json({ error: `Internal backend microservice error: ${error.message}` });
  }
}
