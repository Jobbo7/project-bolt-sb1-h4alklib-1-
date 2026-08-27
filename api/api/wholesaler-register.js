import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const authorization = req.headers.authorization;
  if (!supabaseUrl || !publishableKey) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  if (!authorization?.startsWith('Bearer ')) return res.status(401).json({ error: 'AUTHENTICATION_REQUIRED' });
  const supabase = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) return res.status(401).json({ error: 'INVALID_SESSION' });
  const { title, brand, price, qty, location, businessName } = req.body;

  if (!title || !price || !qty) {
    return res.status(400).json({ error: 'Missing critical inventory data fields' });
  }

  try {
    const { data, error } = await supabase
      .from('seller_offers')
      .insert([{
        id: `WHS-SKU-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36).toUpperCase()}`,
        owner_id: authData.user.id,
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
