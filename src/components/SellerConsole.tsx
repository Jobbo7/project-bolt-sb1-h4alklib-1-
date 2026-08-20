import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Building2, Phone, Mail, MapPin, FileText, Zap, Truck, Package, Boxes,
  Warehouse, CreditCard, Save, Upload, ChevronDown, CheckCircle2, Activity,
  ArrowRight, Hash, Globe, Server, Database, Shield, Percent,
  Settings, ChevronRight, ArrowLeft, Landmark, ShieldCheck, Send, X,
  Bell, Volume2, AlertTriangle, Link2,
} from 'lucide-react';
const regionConfig = { defaultRegion: 'AU_VIC', currencies: { AU_VIC: 'A$' } };
import {
  streamInvoiceToLedger, connectAccountingSoftware,
import { executeWholesalerItemUpload, executeStripeSplitPayouts } from '../mockBackend.js';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
  bg: '#070A12',
  panel: '#101524',
  panel2: '#0C111C',
  border: '#1E2A42',
  orange: '#FF5A00',
  orangeSoft: '#FF7A30',
  emerald: '#10B981',
  text: '#E2E8F0',
  textDim: '#64748B',
  textDimmer: '#475569',
  red: '#EF4444',
  cyan: '#00E5FF',
  gold: '#FFD700',
};

const uid = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const fmt = (n: number, region: any) => formatCurrency(n, region || REGIONS.AU);

// ─── Types ──────────────────────────────────────────────────────────────────
interface SellerProfile {
  businessName: string;
  registryCode: string;
  phone: string;
  billingAddress: string;
  dispatchEmail: string;
  subscriptionTier: 'monthly' | 'annual';
}

interface PickTicket {
  id: string;
  jobRef: string;
  destination: string;
  sku: string;
  itemName: string;
  qty: number;
  status: 'PENDING_DISPATCH' | 'READY_FOR_COLLECTION' | 'IN_TRANSIT_TO_HUB' | 'AUTO_DISPATCHED';
  dispatchedAt?: string;
  autoDispatched?: boolean;
}

interface ConsolidatedManifest {
  id: string;
  postcode: string;
  parcelCount: number;
  sellerCount: number;
  status: string;
  driverRoute: string;
}

interface ShelfItem {
  id: string;
  sku: string;
  name: string;
  aisle: string;
  shelf: string;
  stockQty: number;
  tradePrice: number;
}

interface SellerConsoleProps {
  region: any;
  usStateCode: string;
  onDispatchToBankFeed: (summary: { description: string; amount: number; channel: string; ref: string }) => void;
  onSignOut: () => void;
  corpProfile: any;
  setCorpProfile: (p: any) => void;
  regionCode: string;
  onRegionChange: (code: string) => void;
  usStates: any[];
  onUsStateChange: (code: string) => void;
  onConnectLedger: (provider: string) => Promise<any>;
  onConnectBankFeed: () => Promise<any>;
  bankFeedStatus: any;
}

// ─── Workshop destination nodes ─────────────────────────────────────────────
const WORKSHOP_NODES = ['Mernda', 'South Morang', 'Epping'];

// ─── Seed data ──────────────────────────────────────────────────────────────
const SEED_TICKETS: PickTicket[] = [
  { id: uid(), jobRef: 'JOB-2026-0418', destination: 'Mernda', sku: 'BRK-PAD-CER-001', itemName: 'Ceramic Brake Pad Set — Front', qty: 4, status: 'PENDING_DISPATCH' },
  { id: uid(), jobRef: 'JOB-2026-0419', destination: 'South Morang', sku: 'OIL-FLT-PRO-220', itemName: 'Pro Oil Filter — Spin-On', qty: 12, status: 'PENDING_DISPATCH' },
  { id: uid(), jobRef: 'JOB-2026-0420', destination: 'Epping', sku: 'IGN-COIL-V6-003', itemName: 'Ignition Coil Pack — V6', qty: 2, status: 'PENDING_DISPATCH' },
  { id: uid(), jobRef: 'JOB-2026-0421', destination: 'Mernda', sku: 'AIR-FLT-CAB-014', itemName: 'Cabin Air Filter — Carbon', qty: 6, status: 'PENDING_DISPATCH' },
  { id: uid(), jobRef: 'JOB-2026-0422', destination: 'South Morang', sku: 'SUS-SHK-REAR-008', itemName: 'Rear Shock Absorber Pair', qty: 2, status: 'PENDING_DISPATCH' },
  { id: uid(), jobRef: 'JOB-2026-0423', destination: 'Epping', sku: 'BAT-AGM-070-009', itemName: 'AGM Battery 70Ah', qty: 3, status: 'PENDING_DISPATCH' },
  { id: uid(), jobRef: 'JOB-2026-0424', destination: 'Mernda', sku: 'TIM-BELT-KIT-015', itemName: 'Timing Belt Kit + Tensioner', qty: 1, status: 'PENDING_DISPATCH' },
  { id: uid(), jobRef: 'JOB-2026-0425', destination: 'South Morang', sku: 'WPR-BLD-FRT-021', itemName: 'Front Wiper Blade Pair', qty: 8, status: 'PENDING_DISPATCH' },
];

const SEED_SHELF: ShelfItem[] = [
  { id: uid(), sku: 'BRK-PAD-CER-001', name: 'Ceramic Brake Pad Set — Front', aisle: 'A', shelf: '03', stockQty: 48, tradePrice: 42.50 },
  { id: uid(), sku: 'OIL-FLT-PRO-220', name: 'Pro Oil Filter — Spin-On', aisle: 'B', shelf: '01', stockQty: 120, tradePrice: 8.90 },
  { id: uid(), sku: 'IGN-COIL-V6-003', name: 'Ignition Coil Pack — V6', aisle: 'C', shelf: '07', stockQty: 18, tradePrice: 65.00 },
  { id: uid(), sku: 'AIR-FLT-CAB-014', name: 'Cabin Air Filter — Carbon', aisle: 'B', shelf: '04', stockQty: 64, tradePrice: 18.75 },
  { id: uid(), sku: 'SUS-SHK-REAR-008', name: 'Rear Shock Absorber Pair', aisle: 'D', shelf: '02', stockQty: 12, tradePrice: 89.00 },
  { id: uid(), sku: 'BAT-AGM-070-009', name: 'AGM Battery 70Ah', aisle: 'E', shelf: '01', stockQty: 24, tradePrice: 185.00 },
  { id: uid(), sku: 'TIM-BELT-KIT-015', name: 'Timing Belt Kit + Tensioner', aisle: 'C', shelf: '05', stockQty: 9, tradePrice: 145.00 },
  { id: uid(), sku: 'WPR-BLD-FRT-021', name: 'Front Wiper Blade Pair', aisle: 'A', shelf: '06', stockQty: 96, tradePrice: 12.30 },
  { id: uid(), sku: 'CLT-THS-OEM-031', name: 'OEM Coolant Thermostat', aisle: 'B', shelf: '08', stockQty: 32, tradePrice: 28.40 },
  { id: uid(), sku: 'FUE-PMP-HI-040', name: 'High-Pressure Fuel Pump', aisle: 'D', shelf: '06', stockQty: 7, tradePrice: 220.00 },
  { id: uid(), sku: 'ALT-120A-REM-052', name: 'Reman Alternator 120A', aisle: 'E', shelf: '03', stockQty: 14, tradePrice: 195.00 },
  { id: uid(), sku: 'STR-ASB-INNER-066', name: 'Inner Tie Rod Assembly', aisle: 'D', shelf: '04', stockQty: 22, tradePrice: 38.00 },
];

const SEED_MANIFESTS: ConsolidatedManifest[] = [
  { id: 'MANIFEST-7K2A', postcode: '3754', parcelCount: 5, sellerCount: 3, status: 'CONSOLIDATED INTO ONE DELIVERY VEHICLE — ASSIGNED DRIVER ROUTE', driverRoute: 'Epping Hub → Mernda Loop' },
  { id: 'MANIFEST-9X4B', postcode: '3752', parcelCount: 3, sellerCount: 2, status: 'CONSOLIDATED INTO ONE DELIVERY VEHICLE — ASSIGNED DRIVER ROUTE', driverRoute: 'Epping Hub → South Morang Loop' },
];

// ─── Audio-visual alert hook ────────────────────────────────────────────────
function useAlertBeep() {
  const audioRef = useRef<AudioContext | null>(null);
  return useCallback(() => {
    try {
      if (!audioRef.current) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (AC) audioRef.current = new AC();
      }
      const ctx = audioRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch { /* noop */ }
  }, []);
}

// ─── Seller Account Dropdown Portal ────────────────────────────────────────
function SellerAccountDropdown({ profile, updateProfile, region, onConnectLedger, onConnectBankFeed, bankFeedStatus }: {
  profile: SellerProfile;
  updateProfile: (key: keyof SellerProfile, value: string) => void;
  region: any;
  onConnectLedger: (provider: string) => Promise<any>;
  onConnectBankFeed: () => Promise<any>;
  bankFeedStatus: any;
}) {
  const [open, setOpen] = useState(false);
  const [subFolder, setSubFolder] = useState<string | null>(null);
  const [ledgerStatus, setLedgerStatus] = useState<{ provider: string; status: string } | null>(null);
  const [bankStatus, setBankStatus] = useState<any>(bankFeedStatus);
  const [atoStatus, setAtoStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const r = region || REGIONS.AU;

  const registryLabel = r.code === 'AU' ? 'ABN/ACN' : r.code === 'UK' ? 'UK CRN/VAT' : 'Federal EIN';
  const bankProviderLabel = r.code === 'AU' ? 'Basiq API Core v2' : r.code === 'US' ? 'Plaid API Live Token' : 'Tink API Framework Network';
  const taxDept = r.code === 'AU' ? 'ATO Cloud Gateway' : r.code === 'UK' ? 'HMRC MTD API' : 'IRS e-Services API';

  const handleLedger = async (provider: string) => {
    setBusy(true);
    const res = await onConnectLedger(provider);
    setLedgerStatus({ provider, status: res?.status || 'linked' });
    setBusy(false);
  };
  const handleBankFeed = async () => {
    setBusy(true);
    const res = await onConnectBankFeed();
    setBankStatus(res);
    setBusy(false);
  };
  const handleAto = async () => {
    setBusy(true);
    await new Promise(r => setTimeout(r, 900));
    setAtoStatus('authenticated');
    setBusy(false);
  };

  const closeAll = () => { setOpen(false); setSubFolder(null); };

  const folders = [
    { id: 'warehouse', label: 'Warehouse Registration Coordinates', icon: <Warehouse className="h-4 w-4" /> },
    { id: 'subscription', label: 'Account & Subscription State', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'integrations', label: 'API Integration Link Modules', icon: <Link2 className="h-4 w-4" /> },
  ];

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition" style={{ borderColor: C.border, background: C.panel, color: C.text }}>
        <Settings className="h-4 w-4" style={{ color: C.orange }} /> Account
        <ChevronDown className="h-3 w-3" style={{ color: C.textDim }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={closeAll} />
          <div className="absolute right-0 z-[71] mt-2 w-[340px] overflow-hidden rounded-xl border shadow-2xl" style={{ background: C.bg, borderColor: C.border }}>
            {!subFolder ? (
              <div className="p-2">
                <div className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: C.textDim }}>System Profile Settings</div>
                {folders.map(fl => (
                  <button key={fl.id} onClick={() => setSubFolder(fl.id)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-white/5">
                    <span style={{ color: C.orange }}>{fl.icon}</span>
                    <span className="flex-1">{fl.label}</span>
                    <ChevronRight className="h-3.5 w-3.5" style={{ color: C.textDim }} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto p-4">
                <button onClick={() => setSubFolder(null)} className="mb-3 flex items-center gap-1.5 text-xs" style={{ color: C.textDim }}>
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>

                {/* ── A. WAREHOUSE REGISTRATION COORDINATES ── */}
                {subFolder === 'warehouse' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.orange }}>Warehouse Registration Coordinates</h4>
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[10px] font-semibold uppercase" style={{ color: C.textDim }}>Business Name</label>
                        <div className="mt-1 flex items-center gap-2 rounded-lg border px-2.5 py-2" style={{ borderColor: C.border, background: C.panel2 }}>
                          <Building2 className="h-3.5 w-3.5 shrink-0" style={{ color: C.textDim }} />
                          <input value={profile.businessName} onChange={(e) => updateProfile('businessName', e.target.value)} className="w-full bg-transparent text-xs text-slate-100 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase" style={{ color: C.textDim }}>{registryLabel}</label>
                        <div className="mt-1 flex items-center gap-2 rounded-lg border px-2.5 py-2" style={{ borderColor: C.border, background: C.panel2 }}>
                          <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: C.textDim }} />
                          <input value={profile.registryCode} onChange={(e) => updateProfile('registryCode', e.target.value)} className="w-full bg-transparent font-mono text-xs text-slate-100 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase" style={{ color: C.textDim }}>Corporate Phone Number</label>
                        <div className="mt-1 flex items-center gap-2 rounded-lg border px-2.5 py-2" style={{ borderColor: C.border, background: C.panel2 }}>
                          <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: C.textDim }} />
                          <input value={profile.phone} onChange={(e) => updateProfile('phone', e.target.value)} className="w-full bg-transparent font-mono text-xs text-slate-100 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase" style={{ color: C.textDim }}>Physical Billing Address</label>
                        <div className="mt-1 flex items-center gap-2 rounded-lg border px-2.5 py-2" style={{ borderColor: C.border, background: C.panel2 }}>
                          <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: C.textDim }} />
                          <input value={profile.billingAddress} onChange={(e) => updateProfile('billingAddress', e.target.value)} className="w-full bg-transparent text-xs text-slate-100 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase" style={{ color: C.textDim }}>Warehouse Dispatch Email</label>
                        <div className="mt-1 flex items-center gap-2 rounded-lg border px-2.5 py-2" style={{ borderColor: C.border, background: C.panel2 }}>
                          <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: C.textDim }} />
                          <input value={profile.dispatchEmail} onChange={(e) => updateProfile('dispatchEmail', e.target.value)} className="w-full bg-transparent font-mono text-xs text-slate-100 outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── B. ACCOUNT & SUBSCRIPTION STATE ── */}
                {subFolder === 'subscription' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.orange }}>Account & Subscription State</h4>
                    <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
                      <button
                        onClick={() => updateProfile('subscriptionTier', 'monthly')}
                        className="flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs font-bold transition"
                        style={{ borderColor: profile.subscriptionTier === 'monthly' ? C.orange : C.border, background: profile.subscriptionTier === 'monthly' ? `${C.orange}08` : 'transparent', color: profile.subscriptionTier === 'monthly' ? C.orange : C.text }}
                      >
                        <span className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> $50/mo Flat Tier</span>
                        {profile.subscriptionTier === 'monthly' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => updateProfile('subscriptionTier', 'annual')}
                        className="flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs font-bold transition"
                        style={{ borderColor: profile.subscriptionTier === 'annual' ? C.emerald : C.border, background: profile.subscriptionTier === 'annual' ? `${C.emerald}08` : 'transparent', color: profile.subscriptionTier === 'annual' ? C.emerald : C.text }}
                      >
                        <span className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Annual 10% Discount Tier (Fully Tax Deductible)</span>
                        {profile.subscriptionTier === 'annual' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px]" style={{ color: C.textDim }}>Subscription tier governs your PartsForge Index Network listing priority and backend automation rate limits.</p>
                  </div>
                )}

                {/* ── C. API INTEGRATION LINK MODULES ── */}
                {subFolder === 'integrations' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.orange }}>API Integration Link Modules</h4>

                    {/* Accounting software */}
                    <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
                      <div className="flex items-center gap-2">
                        <Landmark className="h-3.5 w-3.5" style={{ color: C.emerald }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textDim }}>Accounting Software</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button onClick={() => handleLedger('Xero')} disabled={busy} className="rounded-lg border px-3 py-2 text-xs font-semibold transition" style={{ borderColor: C.border, color: C.text }}>Connect Xero</button>
                        <button onClick={() => handleLedger('MYOB')} disabled={busy} className="rounded-lg border px-3 py-2 text-xs font-semibold transition" style={{ borderColor: C.border, color: C.text }}>Connect MYOB</button>
                      </div>
                      {ledgerStatus && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px]" style={{ borderColor: `${C.emerald}30`, background: `${C.emerald}05`, color: C.emerald }}>
                          <CheckCircle2 className="h-3 w-3" /> {ledgerStatus.provider}: {ledgerStatus.status}
                        </div>
                      )}
                    </div>

                    {/* Live banking data feed */}
                    <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
                      <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5" style={{ color: C.cyan }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textDim }}>Live Banking Data Feed</span>
                      </div>
                      <div className="mt-1.5 text-[10px] font-bold" style={{ color: C.cyan }}>{bankProviderLabel}</div>
                      <button onClick={handleBankFeed} disabled={busy} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-950 transition" style={{ background: C.orange }}>
                        <ShieldCheck className="h-3.5 w-3.5" /> Connect via {r.bankProvider?.name || bankProviderLabel.split(' ')[0]}
                      </button>
                      {bankStatus && bankStatus.ok && (
                        <div className="mt-2 rounded-lg border p-2.5" style={{ borderColor: `${C.emerald}30`, background: `${C.emerald}05` }}>
                          <p className="text-xs font-bold" style={{ color: C.emerald }}>{bankStatus.bankName} · ****{bankStatus.accountLast4}</p>
                          <p className="text-[10px]" style={{ color: C.textDim }}>Connected {new Date(bankStatus.connectedAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    {/* Corporate Taxation Department */}
                    <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5" style={{ color: C.orange }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textDim }}>Corporate Taxation Dept</span>
                      </div>
                      <div className="mt-1.5 text-[10px] font-bold" style={{ color: C.orange }}>{taxDept}</div>
                      <button onClick={handleAto} disabled={busy} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition" style={{ borderColor: `${C.orange}40`, color: C.orange }}>
                        {atoStatus ? <><CheckCircle2 className="h-3.5 w-3.5" /> Authenticated</> : <><Shield className="h-3.5 w-3.5" /> Authenticate Gateway</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main SellerConsole Component ───────────────────────────────────────────
export default function SellerConsole({
  region, usStateCode, onDispatchToBankFeed, onSignOut, corpProfile, setCorpProfile,
  regionCode, onRegionChange, usStates, onUsStateChange,
  onConnectLedger, onConnectBankFeed, bankFeedStatus,
}: SellerConsoleProps) {
  const r = region || REGIONS.AU;
  const f = (n: number) => fmt(n, r);

  const [profile, setProfile] = useState<SellerProfile>({
    businessName: 'ForgedParts Pty Ltd',
    registryCode: r.code === 'AU' ? corpProfile.abn || '51 428 927 641' : r.code === 'UK' ? corpProfile.companyHouse || '12345678' : corpProfile.ein || '47-1234567',
    phone: corpProfile.phone || '+61 3 9401 2300',
    billingAddress: '12 Trade Drive, Epping VIC 3076',
    dispatchEmail: 'dispatch@forgedparts.com.au',
    subscriptionTier: 'monthly',
  });

  const [tickets, setTickets] = useState<PickTicket[]>(SEED_TICKETS);
  const [manifests] = useState<ConsolidatedManifest[]>(SEED_MANIFESTS);
  const [shelf, setShelf] = useState<ShelfItem[]>(SEED_SHELF);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [alertFlash, setAlertFlash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const triggerBeep = useAlertBeep();

  const taxRate = r.taxIsFlat ? r.taxRate : getEffectiveTaxRate(r, usStateCode);
  const bankProvider = r.code === 'AU' ? 'Basiq API Core v2' : r.code === 'US' ? 'Plaid API Live Token' : 'Tink API Framework Network';

  const updateProfile = (key: keyof SellerProfile, value: string) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    if (key === 'registryCode') {
      if (r.code === 'AU') setCorpProfile({ ...corpProfile, abn: value });
      else if (r.code === 'UK') setCorpProfile({ ...corpProfile, companyHouse: value });
      else if (r.code === 'US') setCorpProfile({ ...corpProfile, ein: value });
    }
    if (key === 'phone') setCorpProfile({ ...corpProfile, phone: value });
  };

  const fireAlert = useCallback(() => {
    triggerBeep();
    setAlertFlash(true);
    setTimeout(() => setAlertFlash(false), 1200);
  }, [triggerBeep]);

  const handleDispatch = useCallback((ticketId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      onDispatchToBankFeed({
        description: `Leg-1 Dispatch: ${t.sku} → ${t.destination} (Job ${t.jobRef})`,
        amount: t.qty * 15.0,
        channel: 'Logistics Dispatch',
        ref: `DISP-${t.jobRef}`,
      });
      return { ...t, status: 'READY_FOR_COLLECTION', dispatchedAt: new Date().toISOString() };
    }));
    fireAlert();
    setSyncToast(`Pick notification flashed to staff terminals — ticket status set to READY FOR COLLECTION.`);
    setTimeout(() => setSyncToast(null), 3500);
  }, [onDispatchToBankFeed, fireAlert]);

  const handleStockChange = (id: string, newQty: number) => {
    setShelf(prev => prev.map(s => s.id === id ? { ...s, stockQty: Math.max(0, newQty) } : s));
  };

  const handleCsvUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSyncToast(`CSV "${file.name}" ingested — ${shelf.length} shelf rows synced across PartsForge Index Network.`);
      setTimeout(() => setSyncToast(null), 4000);
    }
    e.target.value = '';
  };

  const handleSyncShelf = async () => {
    setSyncing(true);
    await new Promise(r => setTimeout(r, 1200));
    const totalValue = shelf.reduce((s, item) => s + item.stockQty * item.tradePrice, 0);
    onDispatchToBankFeed({
      description: `Shelf vault sync — ${shelf.length} SKUs reconciled`,
      amount: totalValue,
      channel: 'Inventory Sync',
      ref: `SYNC-${Date.now()}`,
    });
    await streamInvoiceToLedger({ invoiceNo: `SYNC-${Date.now()}`, grandTotal: totalValue });
    await connectAccountingSoftware('xero');
    setSyncing(false);
    setSyncToast(`Shelf vault synced. ${shelf.length} SKUs reconciled — ledger posted, accounting software updated.`);
    setTimeout(() => setSyncToast(null), 4500);
  };

  const pendingTickets = tickets.filter(t => t.status === 'PENDING_DISPATCH');
  const readyTickets = tickets.filter(t => t.status === 'READY_FOR_COLLECTION');
  const inTransitTickets = tickets.filter(t => t.status === 'IN_TRANSIT_TO_HUB');
  const autoTickets = tickets.filter(t => t.status === 'AUTO_DISPATCHED');
  const totalInventoryValue = shelf.reduce((s, item) => s + item.stockQty * item.tradePrice, 0);

  const statusBadge = (status: PickTicket['status']) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      PENDING_DISPATCH: { bg: `${C.orange}15`, color: C.orange, label: 'PENDING DISPATCH' },
      READY_FOR_COLLECTION: { bg: `${C.emerald}15`, color: C.emerald, label: 'READY FOR COLLECTION' },
      IN_TRANSIT_TO_HUB: { bg: `${C.cyan}15`, color: C.cyan, label: 'LEG-1: IN TRANSIT TO HUB' },
      AUTO_DISPATCHED: { bg: `${C.gold}15`, color: C.gold, label: 'AUTO-DISPATCHED' },
    };
    return map[status] || map.PENDING_DISPATCH;
  };

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>
      {/* Alert flash overlay */}
      {alertFlash && (
        <div className="fixed inset-0 z-[90] pointer-events-none animate-pulse" style={{ background: `radial-gradient(circle at 50% 50%, ${C.orange}15, transparent 70%)` }} />
      )}

      {/* ── Top HUD Nav ── */}
      <nav className="sticky top-0 z-50 border-b" style={{ borderColor: C.border, background: `${C.bg}f0` }}>
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-950" style={{ background: C.orange }}>
              <Warehouse className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-50">PartsForge Seller Terminal</div>
              <div className="text-[10px]" style={{ color: C.textDim }}>B2B Industrial Logistics Command · {r.label}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Global Region Selector */}
            <div className="flex items-center gap-1.5 rounded-lg border px-2.5 py-2" style={{ borderColor: C.border, background: C.panel }}>
              <Globe className="h-3.5 w-3.5" style={{ color: C.orange }} />
              <select
                value={regionCode}
                onChange={(e) => onRegionChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-100 outline-none"
              >
                <option value="AU">Australia (AUD)</option>
                <option value="UK">United Kingdom (GBP)</option>
                <option value="US">United States (USD)</option>
              </select>
              {r.code === 'US' && (
                <select
                  value={usStateCode}
                  onChange={(e) => onUsStateChange(e.target.value)}
                  className="ml-1 bg-transparent text-xs font-bold text-slate-100 outline-none"
                  style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: '6px' }}
                >
                  {usStates.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              )}
            </div>
            <SellerAccountDropdown
              profile={profile}
              updateProfile={updateProfile}
              region={r}
              onConnectLedger={onConnectLedger}
              onConnectBankFeed={onConnectBankFeed}
              bankFeedStatus={bankFeedStatus}
            />
            <button onClick={onSignOut} className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition" style={{ borderColor: `${C.red}30`, background: `${C.red}08`, color: C.red }}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-5">
        {/* Sync toast */}
        {syncToast && (
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs" style={{ borderColor: `${C.emerald}40`, background: `${C.emerald}10`, color: C.emerald }}>
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {syncToast}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            DECOUPLED TRIPLE-COLUMN LIVE FREIGHT MANAGEMENT HUB
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* ── COLUMN A: Inbound Parts Pick-Tickets Queue ── */}
          <div className="flex flex-col rounded-xl border" style={{ background: C.panel, borderColor: C.border, maxHeight: 'calc(100vh - 160px)' }}>
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" style={{ color: C.orange }} />
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.text }}>Inbound Parts Pick-Tickets Queue</h3>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: `${C.orange}15`, color: C.orange }}>{tickets.length} ACTIVE</span>
            </div>
            <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-3" style={{ maxHeight: 'calc(100vh - 230px)' }}>
              {tickets.length === 0 && <p className="py-8 text-center text-xs" style={{ color: C.textDimmer }}>No active pick tickets.</p>}
              {tickets.map(t => {
                const badge = statusBadge(t.status);
                return (
                  <div key={t.id} className="rounded-lg border p-3 transition" style={{ borderColor: t.status === 'READY_FOR_COLLECTION' ? `${C.emerald}40` : t.status === 'AUTO_DISPATCHED' ? `${C.gold}40` : C.border, background: t.status === 'READY_FOR_COLLECTION' ? `${C.emerald}05` : t.status === 'AUTO_DISPATCHED' ? `${C.gold}05` : C.panel2 }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 shrink-0" style={{ color: C.orange }} />
                          <span className="truncate text-xs font-bold text-slate-100">{t.destination}</span>
                        </div>
                        <div className="mt-1 font-mono text-[10px]" style={{ color: C.textDim }}>{t.jobRef}</div>
                      </div>
                      <span className="shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold" style={{ background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="mt-2 space-y-0.5 text-[10px]" style={{ color: C.textDim }}>
                      <div className="flex items-center gap-1.5"><Hash className="h-2.5 w-2.5" /> SKU: <span className="font-mono text-slate-300">{t.sku}</span></div>
                      <div>Item: <span className="text-slate-300">{t.itemName}</span></div>
                      <div>Qty Sourced: <span className="font-mono font-bold" style={{ color: C.emerald }}>{t.qty}</span></div>
                    </div>
                    {t.status === 'PENDING_DISPATCH' && (
                      <button
                        onClick={() => handleDispatch(t.id)}
                        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-950 transition hover:opacity-90"
                        style={{ background: C.orange }}
                      >
                        <Zap className="h-3 w-3" /> CONFIRM PACKED & ALERT STAGING STALL
                      </button>
                    )}
                    {t.status === 'READY_FOR_COLLECTION' && (
                      <div className="mt-2.5 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[9px] font-bold" style={{ background: `${C.emerald}10`, color: C.emerald }}>
                        <CheckCircle2 className="h-3 w-3" /> Staging stall alerted — awaiting collection
                      </div>
                    )}
                    {t.status === 'AUTO_DISPATCHED' && (
                      <div className="mt-2.5 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[9px] font-bold" style={{ background: `${C.gold}10`, color: C.gold }}>
                        <Bell className="h-3 w-3" /> Auto-dispatched from mechanic checkout — stock deducted
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── COLUMN B: Freight Consolidation & Deployment Terminal ── */}
          <div className="flex flex-col rounded-xl border" style={{ background: C.panel, borderColor: C.border, maxHeight: 'calc(100vh - 160px)' }}>
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4" style={{ color: C.emerald }} />
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.text }}>Freight Consolidation & Deployment Terminal</h3>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: `${C.emerald}15`, color: C.emerald }}>EPPING HUB</span>
            </div>
            <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-3" style={{ maxHeight: 'calc(100vh - 230px)' }}>
              {/* Section 1: Leg-1 Inbound Shuttles */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: `${C.orange}15` }}>
                    <Truck className="h-3 w-3" style={{ color: C.orange }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.orange }}>Leg-1 · Supplier Shuttles → Central Hub</span>
                </div>
                <div className="space-y-1.5">
                  {readyTickets.length === 0 && inTransitTickets.length === 0 && autoTickets.length === 0 && (
                    <p className="rounded-lg border px-3 py-2.5 text-[10px]" style={{ borderColor: C.border, background: C.panel2, color: C.textDimmer }}>No parcels in transit to hub.</p>
                  )}
                  {readyTickets.map(t => (
                    <div key={t.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[10px]" style={{ borderColor: `${C.emerald}30`, background: `${C.emerald}05` }}>
                      <Package className="h-3 w-3 shrink-0" style={{ color: C.emerald }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono font-bold text-slate-100">{t.sku}</div>
                        <div className="truncate" style={{ color: C.textDim }}>→ Epping Hub · {t.qty} units</div>
                      </div>
                      <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold" style={{ background: `${C.emerald}15`, color: C.emerald }}>
                        <Activity className="h-2 w-2 animate-pulse" /> READY
                      </span>
                    </div>
                  ))}
                  {autoTickets.map(t => (
                    <div key={t.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[10px]" style={{ borderColor: `${C.gold}30`, background: `${C.gold}05` }}>
                      <Package className="h-3 w-3 shrink-0" style={{ color: C.gold }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono font-bold text-slate-100">{t.sku}</div>
                        <div className="truncate" style={{ color: C.textDim }}>→ Epping Hub · {t.qty} units (auto)</div>
                      </div>
                      <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold" style={{ background: `${C.gold}15`, color: C.gold }}>
                        <Zap className="h-2 w-2" /> AUTO
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Leg-2 Consolidated Freight Manifests */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: `${C.emerald}15` }}>
                    <Boxes className="h-3 w-3" style={{ color: C.emerald }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.emerald }}>Leg-2 · Consolidated Freight → Matching Postcodes</span>
                </div>
                <div className="space-y-1.5">
                  {manifests.map(m => (
                    <div key={m.id} className="rounded-lg border p-3" style={{ borderColor: `${C.emerald}30`, background: `${C.emerald}05` }}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-100">{m.id}</span>
                        <span className="rounded-full px-2 py-0.5 text-[8px] font-bold" style={{ background: `${C.emerald}15`, color: C.emerald }}>POSTCODE {m.postcode}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-[10px]" style={{ color: C.textDim }}>
                        <span>{m.parcelCount} parcels</span>
                        <span>·</span>
                        <span>{m.sellerCount} sellers</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[9px] font-bold" style={{ background: `${C.emerald}10`, color: C.emerald }}>
                        <Truck className="h-2.5 w-2.5" />
                        {m.status}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[9px]" style={{ color: C.textDim }}>
                        <ArrowRight className="h-2.5 w-2.5" /> {m.driverRoute}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── COLUMN C: High-Density Merchant Shelf Inventory Vault ── */}
          <div className="flex flex-col rounded-xl border" style={{ background: C.panel, borderColor: C.border, maxHeight: 'calc(100vh - 160px)' }}>
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4" style={{ color: C.orange }} />
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.text }}>Merchant Shelf Inventory Vault</h3>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: `${C.emerald}15`, color: C.emerald }}>{shelf.length} SKUs</span>
            </div>
            <div className="custom-scrollbar flex-1 overflow-y-auto p-3" style={{ maxHeight: 'calc(100vh - 230px)' }}>
              {/* CSV Upload Drop Zone */}
              <div
                onClick={handleCsvUpload}
                className="mb-3 cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition hover:border-current"
                style={{ borderColor: `${C.orange}40`, background: `${C.orange}04` }}
              >
                <Upload className="mx-auto h-6 w-6" style={{ color: C.orange }} />
                <p className="mt-2 text-[10px] font-bold" style={{ color: C.orange }}>Upload Master CSV Inventory Sheet to Sync Local Stock Across the PartsForge Index Network</p>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelected} className="hidden" />
              </div>

              {/* Spreadsheet grid */}
              <div className="overflow-x-auto rounded-lg border" style={{ borderColor: C.border }}>
                <table className="w-full text-left text-[10px]">
                  <thead className="sticky top-0 z-10" style={{ background: C.panel2 }}>
                    <tr className="border-b" style={{ borderColor: C.border }}>
                      <th className="px-2 py-2 font-bold uppercase tracking-wider" style={{ color: C.textDim }}>SKU</th>
                      <th className="px-2 py-2 font-bold uppercase tracking-wider" style={{ color: C.textDim }}>Component</th>
                      <th className="px-2 py-2 font-bold uppercase tracking-wider" style={{ color: C.textDim }}>Aisle</th>
                      <th className="px-2 py-2 font-bold uppercase tracking-wider" style={{ color: C.textDim }}>Shelf</th>
                      <th className="px-2 py-2 text-center font-bold uppercase tracking-wider" style={{ color: C.textDim }}>Stock Qty</th>
                      <th className="px-2 py-2 text-right font-bold uppercase tracking-wider" style={{ color: C.textDim }}>Trade Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shelf.map(item => (
                      <tr key={item.id} className="border-b transition hover:bg-white/[0.02]" style={{ borderColor: C.border }}>
                        <td className="px-2 py-2 font-mono text-slate-300">{item.sku}</td>
                        <td className="px-2 py-2 text-slate-100">{item.name}</td>
                        <td className="px-2 py-2 text-center font-mono" style={{ color: C.textDim }}>{item.aisle}</td>
                        <td className="px-2 py-2 text-center font-mono" style={{ color: C.textDim }}>{item.shelf}</td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="number"
                            value={item.stockQty}
                            onChange={(e) => handleStockChange(item.id, parseInt(e.target.value) || 0)}
                            className="w-16 rounded border px-1.5 py-1 text-center font-mono text-xs text-slate-100 outline-none transition focus:border-current"
                            style={{ borderColor: C.border, background: C.panel2 }}
                          />
                        </td>
                        <td className="px-2 py-2 text-right font-mono font-bold" style={{ color: C.emerald }}>{f(item.tradePrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sync button */}
              <button
                onClick={handleSyncShelf}
                disabled={syncing}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs font-bold text-slate-950 transition disabled:opacity-50"
                style={{ background: C.orange }}
              >
                {syncing ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> Syncing...</>) : (<><Save className="h-4 w-4" /> SYNC SHELF VAULT & AUTOMATE BACKENDS</>)}
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            3. AUTOMATED OPEN BANKING LIFE-CYCLES — status strip
        ══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border p-4" style={{ background: C.panel, borderColor: C.border }}>
          <div className="mb-3 flex items-center gap-2">
            <Server className="h-4 w-4" style={{ color: C.cyan }} />
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.text }}>Automated Open Banking Life-Cycles</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" style={{ color: C.orange }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textDim }}>Region & Currency</span>
              </div>
              <div className="mt-1.5 text-sm font-bold text-slate-100">{r.label}</div>
              <div className="text-[10px]" style={{ color: C.textDim }}>{r.currencyCode} · {r.taxLabel}</div>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5" style={{ color: C.emerald }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textDim }}>Tax Protocol</span>
              </div>
              <div className="mt-1.5 text-sm font-bold text-slate-100">{(taxRate * 100).toFixed(2)}%</div>
              <div className="text-[10px]" style={{ color: C.textDim }}>
                {r.code === 'AU' ? 'GST · ABN/ACN tracked' : r.code === 'UK' ? 'VAT · UK CRN/VAT' : `State Sales Tax · EIN tracked`}
              </div>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
              <div className="flex items-center gap-2">
                <Server className="h-3.5 w-3.5" style={{ color: C.cyan }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textDim }}>Open Banking Node</span>
              </div>
              <div className="mt-1.5 truncate text-sm font-bold text-slate-100">{bankProvider}</div>
              <div className="truncate text-[10px]" style={{ color: C.textDim }}>{r.bankProvider?.label || ''}</div>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5" style={{ color: C.orange }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textDim }}>Freight Weight</span>
              </div>
              <div className="mt-1.5 text-sm font-bold text-slate-100">{tickets.length} active legs</div>
              <div className="text-[10px]" style={{ color: C.textDim }}>{readyTickets.length} ready · {autoTickets.length} auto · {manifests.length} manifests</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px]" style={{ borderColor: `${C.emerald}25`, background: `${C.emerald}05`, color: C.emerald }}>
            <Volume2 className="h-3.5 w-3.5 shrink-0" />
            Mechanic checkouts auto-deduct warehouse stock, generate inbound pick-tickets (AUTO-DISPATCHED), and fire audio-visual staff alerts. Currency, weights, and banking compliance nodes recalculate on region change.
          </div>
        </div>

        <footer className="border-t pt-4 text-center text-xs" style={{ borderColor: C.border, color: C.textDim }}>
          PartsForge Seller Terminal — B2B Industrial Transport & Logistics Command · {profile.businessName}
        </footer>
      </main>
    </div>
  );
}
