import Stripe from 'stripe';

// This initializes Stripe safely using the hidden environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // block anything that isn't a POST transaction request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, description } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Missing calculation value parameters' });
    }

    // Create a secure payment intent with Stripe using your hidden secret key
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe processes calculations in cents
      currency: 'aud', 
      metadata: { description: description || 'PartsForge Trade Order' },
    });

    // Send back ONLY the temporary client secret token to the browser
    return res.status(200).json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error('Secure Stripe handler failure:', error.message);
    return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
}
