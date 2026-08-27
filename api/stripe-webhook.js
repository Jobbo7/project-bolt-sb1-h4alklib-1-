import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'STRIPE_WEBHOOK_NOT_CONFIGURED' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const signature = req.headers['stripe-signature'];
    if (!signature) return res.status(400).json({ error: 'MISSING_STRIPE_SIGNATURE' });
    const event = stripe.webhooks.constructEvent(
      await readRawBody(req),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
      case 'charge.refunded':
        console.info('Verified Stripe event', event.id, event.type);
        break;
      default:
        console.info('Unhandled verified Stripe event', event.id, event.type);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook verification failed', error);
    return res.status(400).json({ error: 'INVALID_STRIPE_WEBHOOK' });
  }
}
