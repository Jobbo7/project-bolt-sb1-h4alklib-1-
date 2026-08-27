import Stripe from 'stripe';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  const stripeSecretKey = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!stripeSecretKey) {
    return res.status(503).json({ error: 'PAYMENTS_NOT_CONFIGURED' });
  }

  const amount = Number(req.body?.amount);
  const currency = String(req.body?.currency || 'aud').toLowerCase();
  const orderId = String(req.body?.orderId || '').slice(0, 100);
  if (!Number.isInteger(amount) || amount < 50 || amount > 99_999_999) {
    return res.status(422).json({ error: 'INVALID_AMOUNT' });
  }
  if (!/^[a-z]{3}$/.test(currency)) {
    return res.status(422).json({ error: 'INVALID_CURRENCY' });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { orderId },
    }, orderId ? { idempotencyKey: `partsforge-${orderId}` } : undefined);

    return res.status(200).json({
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      status: intent.status,
    });
  } catch (error) {
    console.error('Stripe PaymentIntent error', error);
    return res.status(502).json({ error: 'PAYMENT_PROVIDER_FAILED' });
  }
}
