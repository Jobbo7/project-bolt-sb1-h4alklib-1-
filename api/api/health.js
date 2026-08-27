const required = [
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'PLATE_API_KEY',
  'OCR_SPACE_API_KEY',
];

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  const missing = required.filter(name => !process.env[name]);
  return res.status(missing.length ? 503 : 200).json({
    status: missing.length ? 'configuration_required' : 'ready',
    missing,
    timestamp: new Date().toISOString(),
  });
}
