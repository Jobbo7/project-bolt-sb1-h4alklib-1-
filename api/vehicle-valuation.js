import { requireUser } from './_lib/auth.js';
import { enforceRateLimit } from './_lib/http.js';

const text = (value, max = 120) => String(value || '').trim().slice(0, max);
const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  if (!enforceRateLimit(req, res, { scope: 'vehicle-valuation', limit: 30 })) return;
  const auth = await requireUser(req, res, ['MECHANIC', 'ADMIN']);
  if (!auth) return;

  const vehicle = req.body?.vehicle || {};
  const odometerKm = finite(req.body?.odometerKm);
  const condition = text(req.body?.condition, 30).toUpperCase();
  const state = text(req.body?.state, 3).toUpperCase();
  if (!odometerKm || odometerKm < 1 || odometerKm > 5_000_000) return res.status(422).json({ error: 'INVALID_ODOMETER' });
  if (!['BELOW_AVERAGE', 'AVERAGE', 'GOOD', 'EXCELLENT'].includes(condition)) return res.status(422).json({ error: 'INVALID_CONDITION' });
  if (!['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'].includes(state)) return res.status(422).json({ error: 'INVALID_STATE' });
  if (!text(vehicle.vin, 17) && !(text(vehicle.make) && text(vehicle.model) && finite(vehicle.year))) return res.status(422).json({ error: 'VEHICLE_IDENTITY_REQUIRED' });

  const providerUrl = process.env.VEHICLE_VALUATION_API_URL;
  const providerKey = process.env.VEHICLE_VALUATION_API_KEY;
  const providerName = text(process.env.VEHICLE_VALUATION_PROVIDER || 'Configured valuation provider', 80);
  if (!providerUrl || !providerKey) {
    return res.status(503).json({
      error: 'VALUATION_NOT_CONFIGURED',
      message: 'Live valuation is not configured. Enter a documented insurer or licensed-provider valuation manually.',
    });
  }

  try {
    const response = await fetch(providerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${providerKey}`, 'X-Api-Key': providerKey },
      body: JSON.stringify({
        country: 'AU', state, odometerKm, condition,
        vehicle: { vin: text(vehicle.vin, 17), registration: text(vehicle.rego, 12), make: text(vehicle.make), model: text(vehicle.model), year: finite(vehicle.year), series: text(vehicle.series) },
      }),
      signal: AbortSignal.timeout(12_000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Provider response ${response.status}`);
    const marketLow = finite(data.marketLow ?? data.low ?? data.valuation?.low);
    const marketHigh = finite(data.marketHigh ?? data.high ?? data.valuation?.high);
    const recommendedValue = finite(data.recommendedValue ?? data.value ?? data.valuation?.recommended);
    if (!marketLow || !marketHigh || marketLow > marketHigh) throw new Error('Provider returned an invalid valuation range');
    return res.status(200).json({ success: true, provider: providerName, marketLow, marketHigh, recommendedValue: recommendedValue || Math.round((marketLow + marketHigh) / 2), currency: 'AUD', odometerKm, condition, valuedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Vehicle valuation provider error', error);
    return res.status(502).json({ error: 'VALUATION_PROVIDER_FAILED', message: 'The live valuation provider is temporarily unavailable. Use a documented manual valuation.' });
  }
}
