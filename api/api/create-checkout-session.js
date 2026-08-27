import Stripe from 'stripe';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  if (!process.env.STRIPE_SECRET_KEY || !process.env.PUBLIC_APP_URL) {
    return res.status(503).json({ error: 'CHECKOUT_NOT_CONFIGURED' });
  }
  const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 100) : [];
  if (!items.length) return res.status(422).json({ error: 'EMPTY_CART' });

  try {
    const lineItems = items.map(item => {
      const unitAmount = Math.round(Number(item.unitPrice) * 100);
      const quantity = Math.max(1, Math.min(99, Number(item.qty) || 1));
      if (!Number.isInteger(unitAmount) || unitAmount < 50) throw new Error('INVALID_LINE_ITEM');
      return {
        quantity,
        price_data: {
          currency: String(req.body?.currency || 'aud').toLowerCase(),
          unit_amount: unitAmount,
          product_data: { name: String(item.title || 'PartsForge item').slice(0, 200) },
        },
      };
    });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const orderId = String(req.body?.orderId || `order-${Date.now()}`);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${process.env.PUBLIC_APP_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_APP_URL}/?checkout=cancelled`,
      metadata: { orderId: orderId.slice(0, 100) },
    }, { idempotencyKey: `partsforge-checkout-${orderId}` });
    return res.status(200).json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe Checkout error', error);
    return res.status(502).json({ error: 'CHECKOUT_PROVIDER_FAILED' });
  }
}
