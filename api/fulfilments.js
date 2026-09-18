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

  const fulfilments = data || [];
  if (auth.role !== 'SELLER') {
    const deliveredOrderIds = fulfilments
      .filter(item => item.status === 'DELIVERED')
      .map(item => item.order_id);
    if (deliveredOrderIds.length) {
      const { data: orders } = await admin
        .from('orders')
        .select('id,items,paid_at')
        .eq('buyer_id', auth.user.id)
        .in('id', deliveredOrderIds);
      const offerIds = [...new Set((orders || []).flatMap(order =>
        (Array.isArray(order.items) ? order.items : []).map(item => String(item.offerId || '')).filter(Boolean)
      ))];
      const { data: offers } = offerIds.length
        ? await admin
          .from('seller_offers')
          .select('id,part,brand,part_number,location,wholesaler_business_name')
          .in('id', offerIds)
        : { data: [] };
      const offersById = new Map((offers || []).map(offer => [String(offer.id), offer]));
      const ordersById = new Map((orders || []).map(order => [String(order.id), order]));
      for (const fulfilment of fulfilments) {
        const order = ordersById.get(String(fulfilment.order_id));
        if (!order) continue;
        fulfilment.deliveredItems = (Array.isArray(order.items) ? order.items : []).map(item => {
          const offer = offersById.get(String(item.offerId)) || {};
          return {
            offerId: item.offerId,
            title: item.title || offer.part || 'PartsForge item',
            brand: offer.brand || '',
            sku: offer.part_number || item.offerId,
            seller: offer.wholesaler_business_name || 'PartsForge supplier',
            location: offer.location || '',
            quantity: Number(item.quantity) || 1,
            unitAmount: Number(item.unitAmount) || 0,
            paidAt: order.paid_at,
          };
        });
      }
    }
  }
  return res.status(200).json({ fulfilments });
}
