import { useMemo, useState } from 'react';
import {
  User,
  Phone,
  Hash,
  Car,
  ClipboardList,
  Wrench,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Loader2,
  Package,
  Calculator,
} from 'lucide-react';
import type { MockPart, MockVehicle } from './mockBackend';

export interface BomLine {
  id: string;
  title: string;
  brand: string;
  vendor: string;
  price: number;
}

interface JobCardProps {
  vehicle: MockVehicle | null;
  bom: BomLine[];
  setBom: React.Dispatch<React.SetStateAction<BomLine[]>>;
  onSavedToast: (msg: string) => void;
}

const REPAIR_TASKS = [
  'Brake pad replacement',
  'Alternator replacement',
  'Oil & filter change',
  'Timing belt service',
  'Diagnostic scan',
  'Suspension rebuild',
  'Clutch replacement',
  'Cooling system flush',
] as const;

const TAX_RATE = 0.10;

const inputCls =
  'w-full rounded-lg border border-[#1F293D] bg-[#0A0D14]/80 px-3 py-2.5 text-sm text-[#E2E8F0] placeholder:text-slate-500 transition-all duration-200 hover:border-[#3a4a66] focus:border-[#FF5A1F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20';

const labelCls = 'flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]';

const CARD = 'bg-[#121824]/90 border border-[#1F293D] shadow-[0_4px_20px_rgba(0,0,0,0.4)]';

function BlockHeader({ icon: Icon, label, accent }: { icon: typeof User; label: string; accent: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`flex h-7 w-7 items-center justify-center rounded-md ${accent}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">{label}</h3>
    </div>
  );
}

export function JobCard({ vehicle, bom, setBom, onSavedToast }: JobCardProps) {
  // Block A — Customer & Vehicle
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobId, setJobId] = useState('');
  const [pulledVehicle, setPulledVehicle] = useState<MockVehicle | null>(null);
  const [pulling, setPulling] = useState(false);

  // Block B — Diagnostic notes
  const [notes, setNotes] = useState('');

  // Block C — Labor tracking
  const [task, setTask] = useState<string>(REPAIR_TASKS[0]);
  const [hours, setHours] = useState('1.5');
  const [rate, setRate] = useState('120');

  const [saving, setSaving] = useState(false);

  const activeVehicle = pulledVehicle ?? vehicle;

  const removeLine = (id: string) => {
    setBom((prev) => prev.filter((l) => l.id !== id));
  };

  const pullFromGarage = () => {
    setPulling(true);
    setTimeout(() => {
      setPulledVehicle(vehicle ?? { make: 'Toyota', model: 'Hilux', year: 2015, engine: '3.0L D-4D', fuel: 'Diesel', drivetrain: '4×4' });
      setPulling(false);
    }, 900);
  };

  const laborCost = useMemo(() => {
    const h = parseFloat(hours) || 0;
    const r = parseFloat(rate) || 0;
    return h * r;
  }, [hours, rate]);

  const partsTotal = useMemo(() => bom.reduce((sum, l) => sum + l.price, 0), [bom]);
  const subtotal = laborCost + partsTotal;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const resetSheet = () => {
    setCustomerName('');
    setPhone('');
    setJobId('');
    setPulledVehicle(null);
    setNotes('');
    setTask(REPAIR_TASKS[0]);
    setHours('1.5');
    setRate('120');
    setBom([]);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSavedToast(`Work Order ${jobId || 'WO-' + Date.now().toString().slice(-5)} saved — ${activeVehicle?.year ?? ''} ${activeVehicle?.make ?? ''} ${activeVehicle?.model ?? ''}`);
      resetSheet();
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Sheet header */}
      <div className={`flex items-center justify-between rounded-2xl ${CARD} px-4 py-3`}>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF5A1F]/15 text-[#FF5A1F] ring-1 ring-[#FF5A1F]/30">
            <ClipboardList className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-sm font-bold text-[#E2E8F0]">Digital Job Card</p>
            <p className="text-[10px] uppercase tracking-wider text-[#64748B]">Repair Order Sheet</p>
          </div>
        </div>
        <span className="rounded-full bg-[#00E5FF]/10 px-2.5 py-1 font-mono text-[10px] font-bold text-[#00E5FF] ring-1 ring-[#00E5FF]/30">
          {jobId || 'RO-•••••'}
        </span>
      </div>

      {/* Block A — Customer & Vehicle Profile */}
      <section className={`rounded-2xl ${CARD} p-4`}>
        <BlockHeader icon={User} label="A · Customer & Vehicle" accent="bg-[#FF5A1F]/15 text-[#FF5A1F]" />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelCls}><User className="h-3 w-3" /> Customer Name</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Jane Smith" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}><Phone className="h-3 w-3" /> Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04xx xxx xxx" className={inputCls} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className={labelCls}><Hash className="h-3 w-3" /> Job ID / RO Number</label>
            <input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="RO-2025-0418" className={`${inputCls} font-mono`} />
          </div>
        </div>

        <button
          onClick={pullFromGarage}
          disabled={pulling}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all duration-200 ${
            pulling
              ? 'cursor-wait bg-slate-800/60 text-slate-500 ring-1 ring-[#1F293D]'
              : activeVehicle
              ? 'bg-[#FF5A1F]/15 text-[#FF5A1F] ring-1 ring-[#FF5A1F]/30 hover:bg-[#FF5A1F]/25 hover:shadow-[0_0_15px_rgba(255,90,31,0.4)]'
              : 'bg-[#FF5A1F] text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)] hover:shadow-[0_0_20px_rgba(255,90,31,0.6)]'
          } active:scale-[0.98]`}
        >
          {pulling ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Pulling from Garage…</>
          ) : activeVehicle ? (
            <><CheckCircle2 className="h-4 w-4" /> {activeVehicle.year} {activeVehicle.make} {activeVehicle.model} {activeVehicle.engine}</>
          ) : (
            <><Car className="h-4 w-4" /> Pull Saved Car From Garage</>
          )}
        </button>
      </section>

      {/* Block B — Diagnostic Notes & Symptoms */}
      <section className={`rounded-2xl ${CARD} p-4`}>
        <BlockHeader icon={ClipboardList} label="B · Diagnostic Notes & Symptoms" accent="bg-[#00E5FF]/15 text-[#00E5FF]" />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Customer reports squeaking noise on deceleration. Code P0301 logged…"
          className={`mt-3 w-full resize-none rounded-lg border border-[#1F293D] bg-[#0A0D14]/80 px-3 py-2.5 text-sm text-[#E2E8F0] placeholder:text-slate-500 transition-all duration-200 hover:border-[#3a4a66] focus:border-[#FF5A1F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20`}
        />
      </section>

      {/* Block C — Labor Tracking & Flat-Rate */}
      <section className={`rounded-2xl ${CARD} p-4`}>
        <BlockHeader icon={Clock} label="C · Labor Tracking & Flat-Rate" accent="bg-[#FF5A1F]/15 text-[#FF5A1F]" />
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <label className={labelCls}><Wrench className="h-3 w-3" /> Repair Task</label>
            <select
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className={`${inputCls} appearance-none`}
            >
              {REPAIR_TASKS.map((t) => (
                <option key={t} value={t} className="bg-[#0A0D14]">{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}><Clock className="h-3 w-3" /> Est. Labor Hours</label>
              <input type="number" min="0" step="0.1" value={hours} onChange={(e) => setHours(e.target.value)} className={`${inputCls} font-mono`} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}><DollarSign className="h-3 w-3" /> Shop Rate ($/hr)</label>
              <input type="number" min="0" step="1" value={rate} onChange={(e) => setRate(e.target.value)} className={`${inputCls} font-mono`} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[#0A0D14]/60 px-3 py-2">
            <span className="text-xs text-[#64748B]">Labor subtotal</span>
            <span className="font-mono text-sm font-bold text-[#00E5FF]">${laborCost.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Block D — Live Parts BOM */}
      <section className={`rounded-2xl ${CARD} p-4`}>
        <BlockHeader icon={Package} label="D · Live Parts BOM" accent="bg-[#00E5FF]/15 text-[#00E5FF]" />
        <p className="mt-2 text-[11px] text-[#64748B]">
          Search parts above, then tap <span className="font-semibold text-[#FF5A1F]">➕ Add to Job Card</span> to nest lines here.
        </p>

        {bom.length === 0 ? (
          <div className="mt-3 flex flex-col items-center justify-center rounded-lg border border-dashed border-[#1F293D] py-6 text-center">
            <Package className="h-6 w-6 text-slate-600" />
            <p className="mt-2 text-xs text-[#64748B]">No parts added yet</p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {bom.map((line) => (
              <div key={line.id} className="flex items-center gap-3 rounded-lg bg-[#0A0D14]/60 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#E2E8F0]">{line.title}</p>
                  <p className="truncate text-[10px] text-[#64748B]">{line.brand} · {line.vendor}</p>
                </div>
                <span className="flex-none font-mono text-sm font-bold text-[#00E5FF]">
                  ${line.price.toFixed(2)}
                </span>
                <button
                  onClick={() => removeLine(line.id)}
                  aria-label="Remove line"
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-slate-500 transition hover:bg-[#FF5A1F]/10 hover:text-[#FF5A1F] active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg bg-[#0A0D14]/60 px-3 py-2">
              <span className="text-xs text-[#64748B]">Parts subtotal</span>
              <span className="font-mono text-sm font-bold text-[#00E5FF]">${partsTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </section>

      {/* Invoice Total Calculator */}
      <section className={`rounded-2xl ${CARD} p-4`}>
        <BlockHeader icon={Calculator} label="Invoice Calculator" accent="bg-[#FF5A1F]/15 text-[#FF5A1F]" />
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-[#0A0D14]/60 px-3 py-2">
            <span className="text-xs text-[#64748B]">Labor ({hours || 0}h × ${rate || 0}/hr)</span>
            <span className="font-mono text-xs text-[#E2E8F0]">${laborCost.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[#0A0D14]/60 px-3 py-2">
            <span className="text-xs text-[#64748B]">Parts BOM ({bom.length} items)</span>
            <span className="font-mono text-xs text-[#E2E8F0]">${partsTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[#0A0D14]/60 px-3 py-2">
            <span className="text-xs text-[#64748B]">Subtotal</span>
            <span className="font-mono text-xs text-[#E2E8F0]">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[#0A0D14]/60 px-3 py-2">
            <span className="text-xs text-[#64748B]">Tax (10%)</span>
            <span className="font-mono text-xs text-[#E2E8F0]">${tax.toFixed(2)}</span>
          </div>
        </div>

        {/* Final total — digital instrument cluster style */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-[#FF5A1F]/40 bg-gradient-to-r from-[#FF5A1F]/10 to-[#00E5FF]/10 px-4 py-3 shadow-[0_0_20px_rgba(255,90,31,0.15)]">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FF5A1F]">
            💰 Final Estimate
          </span>
          <span className="font-mono text-2xl font-bold text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">
            ${total.toFixed(2)}
          </span>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all duration-200 ${
            saving
              ? 'cursor-wait bg-slate-800/60 text-slate-500 ring-1 ring-[#1F293D]'
              : 'bg-[#FF5A1F] text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)] hover:shadow-[0_0_20px_rgba(255,90,31,0.6)] active:scale-[0.98]'
          }`}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating Work Order…</>
          ) : (
            <><Save className="h-4 w-4" /> 💾 Save & Generate Work Order</>
          )}
        </button>
      </section>
    </div>
  );
}

// Helper exported for the dashboard to render the Add-to-Job-Card button on part cards.
export function AddToJobCardButton({ part, onAdd }: { part: MockPart; onAdd: (part: MockPart) => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onAdd(part);
      }}
      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#00E5FF]/10 py-2 text-xs font-semibold text-[#00E5FF] ring-1 ring-[#00E5FF]/30 transition-all duration-200 hover:bg-[#00E5FF]/20 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] active:scale-[0.98]"
    >
      <Plus className="h-3.5 w-3.5" />
      ➕ Add to Job Card
    </button>
  );
}
