import { useMemo, useState } from 'react';

type JobType = 'INSURANCE' | 'PRIVATE';
type AuditEntry = { at: string; action: string; repairTotal: number; supportedValue: number; reason: string };
type VehicleRecord = { year?: number | string; make?: string; model?: string; series?: string; vin?: string; rego?: string; [key: string]: unknown };

interface Props {
  adminDemoMode?: boolean;
  onExitDemo?: () => void;
  onSignOut: () => void;
  getAccessToken: () => Promise<string>;
}

const money = (value: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value || 0);
const numberValue = (value: string) => Math.max(0, Number(value) || 0);

export default function CollisionRepairConsole({ adminDemoMode = false, onExitDemo, onSignOut, getAccessToken }: Props) {
  const [jobId, setJobId] = useState('');
  const [jobType, setJobType] = useState<JobType>('INSURANCE');
  const [identifierMode, setIdentifierMode] = useState<'REGO' | 'VIN'>('REGO');
  const [identifier, setIdentifier] = useState('');
  const [stateCode, setStateCode] = useState('VIC');
  const [vehicle, setVehicle] = useState<VehicleRecord | null>(null);
  const [odometer, setOdometer] = useState('');
  const [condition, setCondition] = useState('AVERAGE');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [insurer, setInsurer] = useState('');
  const [claimNumber, setClaimNumber] = useState('');
  const [assessorEmail, setAssessorEmail] = useState('');
  const [marketLow, setMarketLow] = useState('');
  const [marketHigh, setMarketHigh] = useState('');
  const [supportedValue, setSupportedValue] = useState('');
  const [valueReason, setValueReason] = useState('');
  const [parts, setParts] = useState('');
  const [paintMaterials, setPaintMaterials] = useState('');
  const [labour, setLabour] = useState('');
  const [sublet, setSublet] = useState('');
  const [overheadProfit, setOverheadProfit] = useState('');
  const [contingency, setContingency] = useState('');
  const [salvage, setSalvage] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  const repairTotal = useMemo(() => [parts, paintMaterials, labour, sublet, overheadProfit, contingency].reduce((sum, value) => sum + numberValue(value), 0), [parts, paintMaterials, labour, sublet, overheadProfit, contingency]);
  const comparisonValue = numberValue(supportedValue) || ((numberValue(marketLow) + numberValue(marketHigh)) / 2);
  const economicCost = repairTotal + numberValue(salvage);
  const ratio = comparisonValue > 0 ? economicCost / comparisonValue : 0;
  const assessment = !comparisonValue ? 'VALUATION REQUIRED' : ratio >= 1 ? 'POTENTIAL ECONOMIC TOTAL LOSS' : ratio >= 0.8 ? 'ASSESSOR REVIEW — NEAR THRESHOLD' : 'REPAIR MAY BE ECONOMICAL';

  const lookupVehicle = async () => {
    setBusy(true); setMessage('');
    try {
      const clean = identifier.trim().toUpperCase();
      if (!clean) throw new Error(`Enter a ${identifierMode === 'REGO' ? 'registration' : 'VIN'}.`);
      const url = identifierMode === 'REGO'
        ? `/api/vehicle-lookup?plate=${encodeURIComponent(clean)}&region=AU_${stateCode}`
        : `/api/vin-lookup?vin=${encodeURIComponent(clean)}`;
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'Vehicle lookup failed.');
      setVehicle(result);
      setMessage(`Vehicle matched: ${result.year || ''} ${result.make || ''} ${result.model || ''}`.trim());
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Vehicle lookup failed.'); }
    finally { setBusy(false); }
  };

  const lookupValuation = async () => {
    setBusy(true); setMessage('');
    try {
      if (!vehicle) throw new Error('Identify the vehicle before requesting a valuation.');
      if (!numberValue(odometer)) throw new Error('Enter the current odometer kilometres.');
      const token = await getAccessToken();
      const response = await fetch('/api/collision?action=valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vehicle, odometerKm: numberValue(odometer), condition, state: stateCode }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || result?.error || 'Live valuation is unavailable.');
      setMarketLow(String(result.marketLow)); setMarketHigh(String(result.marketHigh));
      setSupportedValue(String(result.recommendedValue || Math.round((result.marketLow + result.marketHigh) / 2)));
      setValueReason(`Provider valuation adjusted for ${Number(odometer).toLocaleString('en-AU')} km and ${condition.toLowerCase()} condition.`);
      setMessage(`Live valuation loaded from ${result.provider || 'valuation provider'}.`);
    } catch (error) { setMessage(`${error instanceof Error ? error.message : 'Live valuation unavailable.'} Enter the documented insurer/provider range manually.`); }
    finally { setBusy(false); }
  };

  const saveRevision = async (action: string) => {
    if (jobType === 'INSURANCE' && (!comparisonValue || !valueReason.trim())) {
      setMessage('Insurance assessments require a supported value and an adjustment reason or evidence note.');
      return;
    }
    const nextStatus = action === 'PREPARED_FOR_SUBMISSION' ? 'READY_TO_SEND' : 'DRAFT';
    const nextAudit = [{ at: new Date().toISOString(), action, repairTotal, supportedValue: comparisonValue, reason: valueReason.trim() }, ...audit];
    if (adminDemoMode) {
      setAudit(nextAudit); setStatus(nextStatus);
      setMessage('Demo preview updated locally. No Production job or submission was created.');
      return;
    }
    setBusy(true); setMessage('');
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/collision?action=jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: jobId || undefined, jobType, status: nextStatus, customerName, customerEmail, insurer, claimNumber, assessorEmail,
          vehicle, odometerKm: numberValue(odometer), notes, auditHistory: nextAudit,
          estimate: { parts: numberValue(parts), paintMaterials: numberValue(paintMaterials), labour: numberValue(labour), sublet: numberValue(sublet), overheadProfit: numberValue(overheadProfit), contingency: numberValue(contingency), repairTotal },
          valuation: { providerLow: numberValue(marketLow), providerHigh: numberValue(marketHigh), supportedValue: comparisonValue, adjustmentReason: valueReason.trim(), salvageValue: numberValue(salvage), economicCost, ratio, assessment },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || result?.error || 'Job could not be saved.');
      setJobId(result.job.id); setAudit(nextAudit); setStatus(nextStatus);
      setMessage(action === 'PREPARED_FOR_SUBMISSION' ? 'Submission package saved and ready for final review.' : 'Draft and audit revision saved securely.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Job could not be saved.'); }
    finally { setBusy(false); }
  };

  const fieldClass = 'mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-orange-500';
  const cardClass = 'rounded-xl border border-slate-800 bg-slate-900/70 p-4';

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-200">
      {adminDemoMode && <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-400/40 bg-amber-950/95 px-4 py-2 text-xs text-amber-100"><strong>ADMIN DEMO MODE — submission and production changes are blocked.</strong><button onClick={onExitDemo} className="rounded border border-amber-300/50 px-2 py-1">Back to Admin</button></div>}
      <header className="border-b border-slate-800 bg-slate-950/90 px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between"><div><h1 className="font-bold text-white">PartsForge Collision Repair</h1><p className="text-xs text-slate-400">Insurance assessments and private repairs · Australia</p></div><button onClick={onSignOut} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300">Sign out</button></div>
      </header>
      <main className="mx-auto max-w-6xl space-y-4 p-4">
        <section className={cardClass}>
          <div className="flex gap-2"><button onClick={() => setJobType('INSURANCE')} className={`rounded-lg px-4 py-2 text-sm font-bold ${jobType === 'INSURANCE' ? 'bg-orange-500 text-black' : 'bg-slate-800'}`}>Insurance Claim</button><button onClick={() => setJobType('PRIVATE')} className={`rounded-lg px-4 py-2 text-sm font-bold ${jobType === 'PRIVATE' ? 'bg-orange-500 text-black' : 'bg-slate-800'}`}>Private Repair</button></div>
          <div className="mt-4 grid gap-3 md:grid-cols-3"><label className="text-xs">Customer name<input className={fieldClass} value={customerName} onChange={e => setCustomerName(e.target.value)} /></label><label className="text-xs">Customer email<input type="email" className={fieldClass} value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} /></label>{jobType === 'INSURANCE' && <><label className="text-xs">Insurer<input className={fieldClass} value={insurer} onChange={e => setInsurer(e.target.value)} /></label><label className="text-xs">Claim number<input className={fieldClass} value={claimNumber} onChange={e => setClaimNumber(e.target.value)} /></label><label className="text-xs">Assessor email<input type="email" className={fieldClass} value={assessorEmail} onChange={e => setAssessorEmail(e.target.value)} /></label></>}</div>
        </section>

        <section className={cardClass}>
          <h2 className="font-bold text-white">1. Vehicle and odometer</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-4"><label className="text-xs">Identifier<select className={fieldClass} value={identifierMode} onChange={e => setIdentifierMode(e.target.value as 'REGO' | 'VIN')}><option>REGO</option><option>VIN</option></select></label><label className="text-xs">State<select className={fieldClass} value={stateCode} onChange={e => setStateCode(e.target.value)}>{['ACT','NSW','NT','QLD','SA','TAS','VIC','WA'].map(s => <option key={s}>{s}</option>)}</select></label><label className="text-xs">{identifierMode}<input className={fieldClass} value={identifier} onChange={e => setIdentifier(e.target.value.toUpperCase())} /></label><label className="text-xs">Odometer (km)<input type="number" min="0" className={fieldClass} value={odometer} onChange={e => setOdometer(e.target.value)} /></label></div>
          <button disabled={busy} onClick={lookupVehicle} className="mt-3 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-black">Identify vehicle</button>
          {vehicle && <p className="mt-3 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.vin ? `· VIN ${vehicle.vin}` : ''}</p>}
        </section>

        {jobType === 'INSURANCE' && <section className={cardClass}>
          <h2 className="font-bold text-white">2. Pre-accident market value</h2><p className="mt-1 text-xs text-slate-400">Provider figures stay separate from the shop-supported adjustment. Every adjustment requires a reason and remains in the revision history.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-4"><label className="text-xs">Condition<select className={fieldClass} value={condition} onChange={e => setCondition(e.target.value)}><option>BELOW_AVERAGE</option><option>AVERAGE</option><option>GOOD</option><option>EXCELLENT</option></select></label><label className="text-xs">Provider low (AUD)<input type="number" className={fieldClass} value={marketLow} onChange={e => setMarketLow(e.target.value)} /></label><label className="text-xs">Provider high (AUD)<input type="number" className={fieldClass} value={marketHigh} onChange={e => setMarketHigh(e.target.value)} /></label><label className="text-xs">Shop-supported value (AUD)<input type="number" className={fieldClass} value={supportedValue} onChange={e => setSupportedValue(e.target.value)} /></label></div>
          <label className="mt-3 block text-xs">Adjustment reason and evidence<textarea className={fieldClass} rows={2} value={valueReason} onChange={e => setValueReason(e.target.value)} placeholder="Low kilometres, factory options, condition and comparable listings..." /></label>
          <button disabled={busy} onClick={lookupValuation} className="mt-3 rounded-lg border border-cyan-500/40 px-4 py-2 text-sm font-bold text-cyan-300">Get live market valuation</button>
        </section>}

        <section className={cardClass}>
          <h2 className="font-bold text-white">{jobType === 'INSURANCE' ? '3' : '2'}. Repair estimate and shop margin</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">{[['Parts',parts,setParts],['Paint and materials',paintMaterials,setPaintMaterials],['Labour',labour,setLabour],['Sublet/towing',sublet,setSublet],['Overhead and profit',overheadProfit,setOverheadProfit],['Contingency/supplements',contingency,setContingency]].map(([label,value,setter]) => <label key={label as string} className="text-xs">{label as string} (AUD)<input type="number" min="0" className={fieldClass} value={value as string} onChange={e => (setter as (v:string)=>void)(e.target.value)} /></label>)}</div>
          {jobType === 'INSURANCE' && <label className="mt-3 block max-w-sm text-xs">Estimated salvage value (AUD)<input type="number" min="0" className={fieldClass} value={salvage} onChange={e => setSalvage(e.target.value)} /></label>}
          <label className="mt-3 block text-xs">Damage, repair-method and evidence notes<textarea className={fieldClass} rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></label>
        </section>

        <section className={`${cardClass} border-orange-500/30`}>
          <div className="grid gap-3 md:grid-cols-4"><div><p className="text-xs text-slate-400">Proposed repair quote</p><p className="text-xl font-bold text-white">{money(repairTotal)}</p></div>{jobType === 'INSURANCE' && <><div><p className="text-xs text-slate-400">Supported vehicle value</p><p className="text-xl font-bold text-white">{money(comparisonValue)}</p></div><div><p className="text-xs text-slate-400">Repair + salvage ratio</p><p className="text-xl font-bold text-white">{ratio ? `${(ratio * 100).toFixed(1)}%` : '—'}</p></div><div><p className="text-xs text-slate-400">Decision support</p><p className="font-bold text-orange-300">{assessment}</p></div></>}</div>
          <p className="mt-3 text-xs text-slate-400">This is decision support only. A qualified assessor or insurer makes the total-loss decision, and statutory write-off criteria override economic calculations.</p>
          {message && <p className="mt-3 rounded-lg bg-slate-950 p-3 text-sm text-amber-200">{message}</p>}
          <div className="mt-3 flex flex-wrap gap-2"><button disabled={busy} onClick={() => saveRevision('DRAFT_SAVED')} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-bold disabled:opacity-40">Save revision</button><button disabled={busy} onClick={() => saveRevision('PREPARED_FOR_SUBMISSION')} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">{jobType === 'INSURANCE' ? 'Prepare insurer submission' : 'Prepare customer quote'}</button><button onClick={() => window.print()} className="rounded-lg border border-cyan-500/40 px-4 py-2 text-sm text-cyan-300">Print / Save PDF</button></div>
          <p className="mt-2 text-xs text-slate-500">Status: {status}. PartsForge prepares the package but does not email or lodge it until a secure delivery integration is configured.</p>
        </section>

        <section className={cardClass}><h2 className="font-bold text-white">Revision history</h2>{audit.length === 0 ? <p className="mt-2 text-xs text-slate-500">No saved revisions yet.</p> : <div className="mt-2 space-y-2">{audit.map((entry, index) => <div key={`${entry.at}-${index}`} className="rounded-lg border border-slate-800 p-3 text-xs"><strong>{entry.action}</strong> · {new Date(entry.at).toLocaleString('en-AU')} · Quote {money(entry.repairTotal)} · Supported value {money(entry.supportedValue)}<p className="mt-1 text-slate-400">{entry.reason || 'No valuation adjustment.'}</p></div>)}</div>}</section>
      </main>
    </div>
  );
}
