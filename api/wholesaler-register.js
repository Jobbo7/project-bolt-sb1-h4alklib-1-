import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { title, brand, price, qty, location, businessName } = req.body;

  if (!title || !price || !qty) {
    return res.status(400).json({ error: 'Missing critical inventory data fields' });
  }

  try {
    const { data, error } = await supabase
      .from('seller_offers')
      .insert([{
        id: `WHS-SKU-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36).toUpperCase()}`,
        part: title,
        brand: brand || 'OEM Verified',
        price: parseFloat(price),
        stock: parseInt(qty),
        location: location || 'Warehouse Bin Storage',
        wholesaler_business_name: businessName || 'Registered Partner Distributor'
      }])
      .select();

    if (error) throw error;
    return res.status(200).json({ success: true, record: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
