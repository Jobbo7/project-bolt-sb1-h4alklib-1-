import { createClient } from '@supabase/supabase-js';

// Initializes your secure PostgreSQL cloud connection using hidden keys locked in Vercel
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  // Rigidly enforce security compliance: block any casual browser lookup requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, brand, price, qty, location, businessName } = req.body;

  // Validate that critical commercial variables are present before touching database rows
  if (!title || !price || !qty) {
    return res.status(400).json({ error: 'Missing critical inventory parameters (Title, Price, or Qty)' });
  }

  try {
    console.log(`🏢 Ingesting fresh commercial wholesale inventory line item for: ${title}`);

    // Execute an immutable insert row tracking payload into your Supabase data tables
    const { data, error } = await supabase
      .from('seller_offers')
      .insert([{
        id: `WHS-SKU-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36).toUpperCase()}`,
        part: title,
        brand: brand || 'Verified OEM Tier',
        price: parseFloat(price),
        stock: parseInt(qty),
        location: location || 'Main Warehouse Aisle',
        wholesaler_business_name: businessName || 'Registered Partner Distributor'
      }])
      .select();

    if (error) throw error;

    // Return a perfect success confirmation code matrix back to the frontend console
    return res.status(200).json({ 
      success: true, 
      msg: "Wholesale listing successfully appended to live marketplace index node.",
      record: data[0] 
    });

  } catch (error) {
    console.error("❌ PostgreSQL Cloud Ingestion Node Failure:", error.message);
    return res.status(500).json({ error: `Database warehouse disconnect exception: ${error.message}` });
  }
}
