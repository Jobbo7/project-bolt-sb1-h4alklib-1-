import Stripe from 'stripe';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { requireUser } from './_lib/auth.js';
import { enforceRateLimit } from './_lib/http.js';
import { environmentValue } from './_lib/environment.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  const stripeSecretKey = environmentValue('STRIPE_SECRET_KEY');
  const supabaseUrl = environmentValue('SUPABASE_URL');
  const supabaseSecretKey = environmentValue('SUPABASE_SECRET_KEY');
  if (!stripeSecretKey || !process.env.PUBLIC_APP_URL) {
    return res.status(503).json({ error: 'CHECKOUT_NOT_CONFIGURED' });
  }
  if (!enforceRateLimit(req, res, { scope: 'checkout', limit: 10 })) return;
  const auth = await requireUser(req, res, ['DIY', 'MECHANIC', 'SELLER', 'ADMIN']);
  if (!auth) return;
  if (!supabaseSecretKey || !supabaseUrl) return res.status(503).json({ error: 'ORDER_STORE_NOT_CONFIGURED' });
  const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 100) : [];
  if (!items.length) return res.status(422).json({ error: 'EMPTY_CART' });

  try {
    const requested = items.map(item => ({ id: String(item.id || ''), quantity: Math.max(1, Math.min(99, Number(item.qty) || 1)) }));
    if (requested.some(item => !item.id)) return res.status(422).json({ error: 'CATALOGUE_ITEM_ID_REQUIRED' });
    const admin = createClient(supabaseUrl, supabaseSecretKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: offers, error: offerError } = await admin.from('seller_offers').select('id,part,brand,price,stock,owner_id').in('id', requested.map(item => item.id));
    if (offerError) throw offerError;
    const offerMap = new Map((offers || []).map(offer => [String(offer.id), offer]));
    if (offerMap.size !== requested.length) return res.status(409).json({ error: 'CATALOGUE_CHANGED' });
    const pricedItems = requested.map(item => ({ ...item, offer: offerMap.get(item.id) }));
    if (pricedItems.some(item => item.quantity > Number(item.offer.stock))) return res.status(409).json({ error: 'INSUFFICIENT_STOCK' });
    const lineItems = pricedItems.map(item => {
      const unitAmount = Math.round(Number(item.offer.price) * 100);
      const quantity = item.quantity;
      if (!Number.isInteger(unitAmount) || unitAmount < 50) throw new Error('INVALID_LINE_ITEM');
      return {
        quantity,
        price_data: {
          currency: String(req.body?.currency || 'aud').toLowerCase(),
          unit_amount: unitAmount,
          product_data: { name: String(item.offer.part || 'PartsForge item').slice(0, 200), metadata: { offerId: item.id } },
        },
      };
    });
    const stripe = new Stripe(stripeSecretKey);
    const orderId = crypto.randomUUID();
    const currency = String(req.body?.currency || 'aud').toLowerCase();
    if (!['aud', 'nzd'].includes(currency)) return res.status(422).json({ error: 'UNSUPPORTED_CURRENCY' });
    const amountTotal = pricedItems.reduce((sum, item) => sum + Math.round(Number(item.offer.price) * 100) * item.quantity, 0);
    const { error: orderError } = await admin.from('orders').insert({ id: orderId, buyer_id: auth.user.id, status: 'PAYMENT_PENDING', currency, amount_total: amountTotal, items: pricedItems.map(item => ({ offerId: item.id, sellerId: item.offer.owner_id, title: item.offer.part, unitAmount: Math.round(Number(item.offer.price) * 100), quantity: item.quantity })) });
    if (orderError) throw orderError;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${process.env.PUBLIC_APP_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_APP_URL}/?checkout=cancelled`,
      metadata: { orderId, buyerId: auth.user.id },
    }, { idempotencyKey: `partsforge-checkout-${orderId}` });
    await admin.from('orders').update({ stripe_checkout_session_id: session.id }).eq('id', orderId);
    return res.status(200).json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe Checkout error', error);
    return res.status(502).json({ error: 'CHECKOUT_PROVIDER_FAILED' });
  }
}
