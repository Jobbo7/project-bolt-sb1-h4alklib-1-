import { requireUser } from './_lib/auth.js';
import { partsList } from './_lib/autoinfo.js';
import { clientIp, enforceRateLimit, logEvent, requestId } from './_lib/http.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  const id = requestId(req);
  res.setHeader('X-Request-Id', id);
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' }); }
  if (!enforceRateLimit(req, res, { scope: 'autoinfo', limit: 20 })) return;
  const auth = await requireUser(req, res, ['MECHANIC', 'APPRENTICE', 'SELLER', 'ADMIN']);
  if (!auth) return;
  const vehicleIds = (Array.isArray(req.body?.vehicleIds) ? req.body.vehicleIds : [req.body?.vehicleId]).filter(value => /^\d{1,18}$/.test(String(value))).slice(0, 5);
  if (!vehicleIds.length) return res.status(422).json({ error: 'VALID_VEHICLE_ID_REQUIRED' });
  const started = Date.now();
  try {
    const result = await partsList({ vehicleIds, partGroup: Number(req.body?.partGroup) || 0, subGroup: Number(req.body?.subGroup) || 0, callingIp: clientIp(req) });
    logEvent('info', 'autoinfo.parts.success', { requestId: id, userId: auth.user.id, latencyMs: Date.now() - started, count: result.parts.length });
    return res.status(200).json({ provider: 'autoinfo', authoritativeFitment: true, ...result });
  } catch (error) {
    logEvent('error', 'autoinfo.parts.failure', { requestId: id, userId: auth.user.id, latencyMs: Date.now() - started, code: error.code || error.message });
    return res.status(error.code === 'AUTOINFO_NOT_CONFIGURED' ? 503 : 502).json({ error: error.code || 'AUTOINFO_PROVIDER_FAILED', requestId: id });
  }
}
