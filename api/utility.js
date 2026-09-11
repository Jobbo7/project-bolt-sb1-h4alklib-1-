const handlers = {
  'automotive-qa': () => import('./_lib/routes/automotive-qa.js'),
  'ocr-scan': () => import('./_lib/routes/ocr-scan.js'),
  'vin-lookup': () => import('./_lib/routes/vin-lookup.js'),
  'wholesaler-register': () => import('./_lib/routes/wholesaler-register.js'),
  health: () => import('./_lib/routes/health.js'),
};

export default async function handler(req, res) {
  const route = String(req.query?.route || '');
  const load = handlers[route];
  if (!load) return res.status(404).json({ error: 'ROUTE_NOT_FOUND' });

  const module = await load();
  return module.default(req, res);
}
