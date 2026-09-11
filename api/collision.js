import crypto from 'node:crypto';
import { requireUser } from './_lib/auth.js';
import { rejectAdminDemoMutation } from './_lib/admin-demo.js';
import { enforceRateLimit } from './_lib/http.js';

const clean = (value, max = 1000) => String(value || '').trim().slice(0, max);
const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

async function handleValuation(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' }); }
  if (!enforceRateLimit(req, res, { scope: 'vehicle-valuation', limit: 30 })) return;
  const vehicle = req.body?.vehicle || {};
  const odometerKm = finite(req.body?.odometerKm);
  const condition = clean(req.body?.condition, 30).toUpperCase();
  const state = clean(req.body?.state, 3).toUpperCase();
  if (!odometerKm || odometerKm < 1 || odometerKm > 5_000_000) return res.status(422).json({ error: 'INVALID_ODOMETER' });
  if (!['BELOW_AVERAGE', 'AVERAGE', 'GOOD', 'EXCELLENT'].includes(condition)) return res.status(422).json({ error: 'INVALID_CONDITION' });
  if (!['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'].includes(state)) return res.status(422).json({ error: 'INVALID_STATE' });
  if (!clean(vehicle.vin, 17) && !(clean(vehicle.make) && clean(vehicle.model) && finite(vehicle.year))) return res.status(422).json({ error: 'VEHICLE_IDENTITY_REQUIRED' });
  const providerUrl = process.env.VEHICLE_VALUATION_API_URL;
  const providerKey = process.env.VEHICLE_VALUATION_API_KEY;
  const providerName = clean(process.env.VEHICLE_VALUATION_PROVIDER || 'Configured valuation provider', 80);
  if (!providerUrl || !providerKey) return res.status(503).json({ error: 'VALUATION_NOT_CONFIGURED', message: 'Live valuation is not configured. Enter a documented insurer or licensed-provider valuation manually.' });
  try {
    const response = await fetch(providerUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${providerKey}`, 'X-Api-Key': providerKey },
      body: JSON.stringify({ country: 'AU', state, odometerKm, condition, vehicle: { vin: clean(vehicle.vin, 17), registration: clean(vehicle.rego, 12), make: clean(vehicle.make, 120), model: clean(vehicle.model, 120), year: finite(vehicle.year), series: clean(vehicle.series, 120) } }),
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

async function handleJobs(req, res, auth) {
  if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' }); }
  if (req.method === 'GET') {
    const { data, error } = await auth.supabase.from('collision_repair_jobs').select('*').eq('owner_id', auth.user.id).order('updated_at', { ascending: false }).limit(100);
    if (error) return res.status(500).json({ error: 'COLLISION_JOBS_LOAD_FAILED' });
    return res.status(200).json({ jobs: data || [] });
  }
  if (rejectAdminDemoMutation(auth, res)) return;
  if (auth.role !== 'MECHANIC') return res.status(403).json({ error: 'INSUFFICIENT_ROLE' });
  const body = req.body || {};
  const jobType = body.jobType === 'PRIVATE' ? 'PRIVATE' : 'INSURANCE';
  const status = ['DRAFT','READY_TO_SEND','SUBMITTED','APPROVED','DECLINED','COMPLETED'].includes(body.status) ? body.status : 'DRAFT';
  const record = {
    id: /^[0-9a-f-]{36}$/i.test(String(body.id || '')) ? body.id : crypto.randomUUID(), owner_id: auth.user.id, job_type: jobType, status,
    customer_name: clean(body.customerName, 200) || null, customer_email: clean(body.customerEmail, 320) || null,
    insurer: jobType === 'INSURANCE' ? clean(body.insurer, 200) || null : null, claim_number: jobType === 'INSURANCE' ? clean(body.claimNumber, 120) || null : null,
    assessor_email: jobType === 'INSURANCE' ? clean(body.assessorEmail, 320) || null : null,
    vehicle: body.vehicle && typeof body.vehicle === 'object' ? body.vehicle : {}, odometer_km: Number.isInteger(Number(body.odometerKm)) ? Math.max(0, Math.min(5_000_000, Number(body.odometerKm))) : null,
    estimate: body.estimate && typeof body.estimate === 'object' ? body.estimate : {}, valuation: jobType === 'INSURANCE' && body.valuation && typeof body.valuation === 'object' ? body.valuation : {},
    notes: clean(body.notes, 10_000) || null, audit_history: Array.isArray(body.auditHistory) ? body.auditHistory.slice(0, 500) : [], updated_at: new Date().toISOString(),
  };
  const { data, error } = await auth.supabase.from('collision_repair_jobs').upsert(record, { onConflict: 'id' }).select('id,status,updated_at').single();
  if (error) return res.status(500).json({ error: 'COLLISION_JOB_SAVE_FAILED' });
  return res.status(200).json({ success: true, job: data });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const action = req.query?.action === 'valuation' ? 'valuation' : 'jobs';
  if (action === 'valuation' && req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  if (action === 'jobs' && !['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  const auth = await requireUser(req, res, ['MECHANIC', 'ADMIN']);
  if (!auth) return;
  return action === 'valuation' ? handleValuation(req, res) : handleJobs(req, res, auth);
}
