import { createClient } from '@supabase/supabase-js';
import { requireUser } from './_lib/auth.js';
import { enforceRateLimit } from './_lib/http.js';
import { environmentValue } from './_lib/environment.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  if (!enforceRateLimit(req, res, { scope: 'fulfilments', limit: 60 })) return;
  const auth = await requireUser(req, res, ['MECHANIC', 'APPRENTICE', 'SELLER']);
  if (!auth) return;
  const supabaseUrl = environmentValue('SUPABASE_URL');
  const supabaseSecretKey = environmentValue('SUPABASE_SECRET_KEY');
  if (!supabaseUrl || !supabaseSecretKey) return res.status(503).json({ error: 'FULFILMENT_STORE_NOT_CONFIGURED' });

  const admin = createClient(supabaseUrl, supabaseSecretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const participantColumn = auth.role === 'SELLER' ? 'seller_id' : 'buyer_id';
  const { data, error } = await admin.from('order_fulfilments')
    .select('id,order_id,method,status,delivery_address,tracking_reference,accepted_at,collected_at,delivered_at,created_at,updated_at')
    .eq(participantColumn, auth.user.id)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return res.status(502).json({ error: 'FULFILMENTS_UNAVAILABLE' });
  return res.status(200).json({ fulfilments: data || [] });
}
