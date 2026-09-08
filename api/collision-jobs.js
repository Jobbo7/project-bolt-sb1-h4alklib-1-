import crypto from 'node:crypto';
import { requireUser } from './_lib/auth.js';
import { rejectAdminDemoMutation } from './_lib/admin-demo.js';

const clean = (value, max = 1000) => String(value || '').trim().slice(0, max);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  const auth = await requireUser(req, res, ['MECHANIC', 'ADMIN']);
  if (!auth) return;

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
    id: /^[0-9a-f-]{36}$/i.test(String(body.id || '')) ? body.id : crypto.randomUUID(),
    owner_id: auth.user.id,
    job_type: jobType,
    status,
    customer_name: clean(body.customerName, 200) || null,
    customer_email: clean(body.customerEmail, 320) || null,
    insurer: jobType === 'INSURANCE' ? clean(body.insurer, 200) || null : null,
    claim_number: jobType === 'INSURANCE' ? clean(body.claimNumber, 120) || null : null,
    assessor_email: jobType === 'INSURANCE' ? clean(body.assessorEmail, 320) || null : null,
    vehicle: body.vehicle && typeof body.vehicle === 'object' ? body.vehicle : {},
    odometer_km: Number.isInteger(Number(body.odometerKm)) ? Math.max(0, Math.min(5_000_000, Number(body.odometerKm))) : null,
    estimate: body.estimate && typeof body.estimate === 'object' ? body.estimate : {},
    valuation: jobType === 'INSURANCE' && body.valuation && typeof body.valuation === 'object' ? body.valuation : {},
    notes: clean(body.notes, 10_000) || null,
    audit_history: Array.isArray(body.auditHistory) ? body.auditHistory.slice(0, 500) : [],
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await auth.supabase.from('collision_repair_jobs').upsert(record, { onConflict: 'id' }).select('id,status,updated_at').single();
  if (error) return res.status(500).json({ error: 'COLLISION_JOB_SAVE_FAILED' });
  return res.status(200).json({ success: true, job: data });
}
