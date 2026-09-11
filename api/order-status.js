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
  if (!enforceRateLimit(req, res, { scope: 'order-status', limit: 60 })) return;

  const auth = await requireUser(req, res, ['DIY', 'MECHANIC', 'APPRENTICE', 'SELLER', 'ADMIN']);
  if (!auth) return;

  const sessionId = String(req.query?.session_id || '').trim();
  if (!/^cs_(test_|live_)[A-Za-z0-9]+$/.test(sessionId)) {
    return res.status(422).json({ error: 'INVALID_CHECKOUT_SESSION' });
  }

  const supabaseUrl = environmentValue('SUPABASE_URL');
  const supabaseSecretKey = environmentValue('SUPABASE_SECRET_KEY');
  if (!supabaseUrl || !supabaseSecretKey) {
    return res.status(503).json({ error: 'ORDER_STORE_NOT_CONFIGURED' });
  }

  const admin = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: order, error } = await admin
    .from('orders')
    .select('id,status,currency,amount_total,paid_at,created_at')
    .eq('stripe_checkout_session_id', sessionId)
    .eq('buyer_id', auth.user.id)
    .maybeSingle();

  if (error) {
    console.error('Order status lookup failed', error);
    return res.status(502).json({ error: 'ORDER_STATUS_UNAVAILABLE' });
  }
  if (!order) return res.status(404).json({ error: 'ORDER_NOT_FOUND' });

  return res.status(200).json({ order });
}
