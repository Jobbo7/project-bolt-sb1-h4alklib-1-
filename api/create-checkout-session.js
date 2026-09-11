import Stripe from 'stripe';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { requireUser } from './_lib/auth.js';
import { enforceRateLimit } from './_lib/http.js';
import { environmentValue } from './_lib/environment.js';
import { rejectAdminDemoMutation } from './_lib/admin-demo.js';

export function normaliseCheckoutItems(items) {
  if (!Array.isArray(items)) return [];

  const quantities = new Map();
  for (const item of items.slice(0, 100)) {
    const id = String(item?.offerId || item?.id || '').trim();
    if (!id) return [];
    const quantity = Math.max(1, Math.min(99, Math.trunc(Number(item?.qty) || 1)));
    quantities.set(id, Math.min(99, (quantities.get(id) || 0) + quantity));
  }

  return [...quantities].map(([id, quantity]) => ({ id, quantity }));
}

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
  if (rejectAdminDemoMutation(auth, res)) return;
  if (!supabaseSecretKey || !supabaseUrl) return res.status(503).json({ error: 'ORDER_STORE_NOT_CONFIGURED' });
  const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 100) : [];
  if (!items.length) return res.status(422).json({ error: 'EMPTY_CART' });

  try {
    const requested = normaliseCheckoutItems(items);
    if (!requested.length) return res.status(422).json({ error: 'CATALOGUE_ITEM_ID_REQUIRED' });
    const admin = createClient(supabaseUrl, supabaseSecretKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: offers, error: offerError } = await admin.from('seller_offers').select('id,part,brand,price,stock,owner_id,delivery_available,pickup_available,delivery_fee').in('id', requested.map(item => item.id));
    if (offerError) throw offerError;
    const offerMap = new Map((offers || []).map(offer => [String(offer.id), offer]));
    if (offerMap.size !== requested.length) return res.status(409).json({ error: 'CATALOGUE_CHANGED' });
    const pricedItems = requested.map(item => ({ ...item, offer: offerMap.get(item.id) }));
    if (pricedItems.some(item => item.quantity > Number(item.offer.stock))) return res.status(409).json({ error: 'INSUFFICIENT_STOCK' });
    const deliveryMethod = String(req.body?.deliveryMethod || 'DELIVERY').toUpperCase();
    if (!['DELIVERY', 'PICKUP'].includes(deliveryMethod)) return res.status(422).json({ error: 'INVALID_DELIVERY_METHOD' });
    if (deliveryMethod === 'DELIVERY' && pricedItems.some(item => !item.offer.delivery_available)) return res.status(409).json({ error: 'DELIVERY_UNAVAILABLE' });
    if (deliveryMethod === 'PICKUP' && pricedItems.some(item => !item.offer.pickup_available)) return res.status(409).json({ error: 'PICKUP_UNAVAILABLE' });
   
const currency = 'aud';

const lineItems = pricedItems.map(item => {
  const unitAmount = Math.round(Number(item.offer.price) * 100);
  const quantity = item.quantity;

  if (!Number.isInteger(unitAmount) || unitAmount < 50) {
    throw new Error('INVALID_LINE_ITEM');
  }

  return {
    quantity,
    price_data: {
      currency,
      unit_amount: unitAmount,
      product_data: {
        name: String(item.offer.part || 'PartsForge item').slice(0, 200),
        metadata: { offerId: item.id },
      },
    },
  };
});

const sellerDeliveryFees = new Map();
if (deliveryMethod === 'DELIVERY') {
  for (const item of pricedItems) {
    const fee = Math.round(Number(item.offer.delivery_fee || 0) * 100);
    sellerDeliveryFees.set(String(item.offer.owner_id), Math.max(fee, sellerDeliveryFees.get(String(item.offer.owner_id)) || 0));
  }
}
const deliveryAmount = [...sellerDeliveryFees.values()].reduce((sum, fee) => sum + fee, 0);
if (deliveryAmount > 0) {
  lineItems.push({ quantity: 1, price_data: { currency, unit_amount: deliveryAmount, product_data: { name: 'PartsForge supplier delivery' } } });
}

const stripe = new Stripe(stripeSecretKey);
const orderId = crypto.randomUUID();
    const amountTotal = pricedItems.reduce((sum, item) => sum + Math.round(Number(item.offer.price) * 100) * item.quantity, 0) + deliveryAmount;
    const { error: orderError } = await admin.from('orders').insert({ id: orderId, buyer_id: auth.user.id, status: 'PAYMENT_PENDING', currency, amount_total: amountTotal, delivery_method: deliveryMethod, delivery_amount: deliveryAmount, items: pricedItems.map(item => ({ offerId: item.id, sellerId: item.offer.owner_id, title: item.offer.part, unitAmount: Math.round(Number(item.offer.price) * 100), quantity: item.quantity })) });
    if (orderError) throw orderError;
const reservationItems = pricedItems.map(item => ({
  offerId: item.id,
  quantity: item.quantity,
}));

const reservationExpiresAtMs =
  Date.now() + 35 * 60 * 1000;

const reservationExpiresAt =
  new Date(reservationExpiresAtMs).toISOString();

const { error: reservationError } = await admin.rpc(
  'reserve_order_stock',
  {
    p_order_id: orderId,
    p_items: reservationItems,
    p_expires_at: reservationExpiresAt,
  },
);

if (reservationError) {
  await admin
    .from('orders')
    .update({ status: 'CANCELLED' })
    .eq('id', orderId)
    .eq('status', 'PAYMENT_PENDING');

  if (
    String(reservationError.message || '').includes(
      'INSUFFICIENT_AVAILABLE_STOCK',
    )
  ) {
    return res.status(409).json({
      error: 'INSUFFICIENT_STOCK',
    });
  }

  throw reservationError;
}
    let session;

try {
  session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    expires_at: Math.floor(reservationExpiresAtMs / 1000),
    success_url: `${process.env.PUBLIC_APP_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.PUBLIC_APP_URL}/?checkout=cancelled`,
    metadata: { orderId, buyerId: auth.user.id },
    ...(deliveryMethod === 'DELIVERY' ? { shipping_address_collection: { allowed_countries: ['AU'] }, phone_number_collection: { enabled: true } } : {}),
  }, {
    idempotencyKey: `partsforge-checkout-${orderId}`,
  });
} catch (stripeError) {
  await admin.rpc('release_order_stock', {
    p_order_id: orderId,
  });

  await admin
    .from('orders')
    .update({ status: 'CANCELLED' })
    .eq('id', orderId)
    .eq('status', 'PAYMENT_PENDING');

  throw stripeError;
}

const { error: sessionStoreError } = await admin
  .from('orders')
  .update({
    stripe_checkout_session_id: session.id,
  })
  .eq('id', orderId)
  .eq('status', 'PAYMENT_PENDING');

if (sessionStoreError) {
  try {
    await stripe.checkout.sessions.expire(session.id);
  } catch (expireError) {
    console.error(
      'Failed to expire Stripe session after order update failure',
      expireError,
    );
  }

  await admin.rpc('release_order_stock', {
    p_order_id: orderId,
  });

  await admin
    .from('orders')
    .update({ status: 'CANCELLED' })
    .eq('id', orderId)
    .eq('status', 'PAYMENT_PENDING');

  throw sessionStoreError;
}
    return res.status(200).json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe Checkout error', error);
    return res.status(502).json({ error: 'CHECKOUT_PROVIDER_FAILED' });
  }
}
