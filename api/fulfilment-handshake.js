import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { requireUser } from './_lib/auth.js';
import { enforceRateLimit } from './_lib/http.js';
import { environmentValue } from './_lib/environment.js';

const tokenHash = token => crypto.createHash('sha256').update(token).digest('hex');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  if (!enforceRateLimit(req, res, { scope: 'fulfilment-handshake', limit: 30 })) return;
  const auth = await requireUser(req, res, ['MECHANIC', 'APPRENTICE', 'SELLER']);
  if (!auth) return;

  const fulfilmentId = String(req.body?.fulfilmentId || '');
  const action = String(req.body?.action || '').toUpperCase();
  const suppliedToken = String(req.body?.qrToken || '');
  if (!/^[0-9a-f-]{36}$/i.test(fulfilmentId)) return res.status(422).json({ error: 'INVALID_FULFILMENT' });

  const supabaseUrl = environmentValue('SUPABASE_URL');
  const supabaseSecretKey = environmentValue('SUPABASE_SECRET_KEY');
  if (!supabaseUrl || !supabaseSecretKey) return res.status(503).json({ error: 'FULFILMENT_STORE_NOT_CONFIGURED' });
  const admin = createClient(supabaseUrl, supabaseSecretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: fulfilment, error } = await admin.from('order_fulfilments').select('*').eq('id', fulfilmentId).single();
  if (error || !fulfilment) return res.status(404).json({ error: 'FULFILMENT_NOT_FOUND' });

  const isSeller = String(fulfilment.seller_id) === String(auth.user.id);
  const isBuyer = String(fulfilment.buyer_id) === String(auth.user.id);
  let nextStatus;
  let qrToken;
  if (action === 'ACCEPT' && isSeller && fulfilment.status === 'AWAITING_SUPPLIER') nextStatus = 'ACCEPTED';
  else if (action === 'READY' && isSeller && fulfilment.status === 'ACCEPTED') nextStatus = 'READY_FOR_COLLECTION';
  else if (action === 'DISPATCH' && isSeller && ['ACCEPTED', 'READY_FOR_COLLECTION'].includes(fulfilment.status)) {
    nextStatus = 'IN_TRANSIT';
    qrToken = crypto.randomBytes(32).toString('base64url');
  } else if (action === 'RECEIVE' && isBuyer && fulfilment.status === 'IN_TRANSIT' && suppliedToken && tokenHash(suppliedToken) === fulfilment.handoff_token_hash) nextStatus = 'DELIVERED';
  else return res.status(409).json({ error: 'INVALID_FULFILMENT_TRANSITION' });

  const changes = { status: nextStatus, updated_at: new Date().toISOString() };
  if (qrToken) changes.handoff_token_hash = tokenHash(qrToken);
  if (nextStatus === 'ACCEPTED') changes.accepted_at = changes.updated_at;
  if (nextStatus === 'IN_TRANSIT') changes.collected_at = changes.updated_at;
  if (nextStatus === 'DELIVERED') changes.delivered_at = changes.updated_at;
  const { error: updateError } = await admin.from('order_fulfilments').update(changes).eq('id', fulfilmentId).eq('status', fulfilment.status);
  if (updateError) return res.status(409).json({ error: 'FULFILMENT_UPDATE_CONFLICT' });
  await admin.from('fulfilment_events').insert({ fulfilment_id: fulfilmentId, actor_id: auth.user.id, event_type: nextStatus });
  return res.status(200).json({ fulfilmentId, status: nextStatus, ...(qrToken ? { qrToken } : {}) });
}
