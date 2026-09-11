export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  // This legacy endpoint accepted an amount supplied by the browser. It is
  // intentionally retired so a caller can never choose the amount charged.
  // Marketplace payments must use create-checkout-session, which prices every
  // line from the server-side seller catalogue and records an auditable order.
  return res.status(410).json({
    error: 'PAYMENT_ROUTE_RETIRED',
    replacement: '/api/create-checkout-session',
  });
}
