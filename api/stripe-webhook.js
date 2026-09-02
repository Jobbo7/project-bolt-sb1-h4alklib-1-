import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { environmentValue } from './_lib/environment.js';

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
  const stripeSecretKey = environmentValue('STRIPE_SECRET_KEY');
  const stripeWebhookSecret = environmentValue('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = environmentValue('SUPABASE_URL');
  const supabaseSecretKey = environmentValue('SUPABASE_SECRET_KEY');
  if (!stripeSecretKey || !stripeWebhookSecret) {
    return res.status(503).json({ error: 'STRIPE_WEBHOOK_NOT_CONFIGURED' });
  }
  if (!supabaseUrl || !supabaseSecretKey) return res.status(503).json({ error: 'ORDER_STORE_NOT_CONFIGURED' });

  try {
    const stripe = new Stripe(stripeSecretKey);
    const signature = req.headers['stripe-signature'];
    if (!signature) return res.status(400).json({ error: 'MISSING_STRIPE_SIGNATURE' });
    const event = stripe.webhooks.constructEvent(
      await readRawBody(req),
      signature,
      stripeWebhookSecret,
    );
    const admin = createClient(supabaseUrl, supabaseSecretKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: eventError } = await admin.from('payment_events').insert({ stripe_event_id: event.id, event_type: event.type });
    if (eventError?.code === '23505') return res.status(200).json({ received: true, duplicate: true });
    if (eventError) throw eventError;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.payment_status === 'paid' && session.metadata?.orderId) {
          await admin.from('orders').update({ status: 'PAID', stripe_payment_intent_id: String(session.payment_intent || ''), paid_at: new Date(event.created * 1000).toISOString() }).eq('id', session.metadata.orderId).eq('status', 'PAYMENT_PENDING');
        }
        break;
      }
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
