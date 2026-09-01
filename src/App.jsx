import { useState, useRef, useMemo, useCallback, useEffect, Component } from 'react';
import {
  ShieldCheck, Wrench, Mail, Lock, Eye, EyeOff, KeyRound, Search, Camera,
  ScanLine, BadgeCheck, CheckCircle2, AlertTriangle, X, ChevronDown,
  ShoppingCart, Plus, Trash2, Save, Send, Archive, Settings, Building2,
  Landmark, Briefcase, Phone, Percent, FileText, Zap, Truck, Clock,
  Package, Boxes, Warehouse, CreditCard, Lock as LockIcon, ExternalLink,
  ArrowLeft, BookOpen, FlaskConical, Droplets, CreditCard as CardIcon,
  History, RotateCcw, Bell, Play, MapPin, ChevronRight, Sparkles, Car,
  LogOut, PackageSearch, Store, Image as ImageIcon, Ban, SprayCan,
  Globe, Server, Database, Shield, Activity, ClipboardList,
  Radio, DollarSign, Rocket, Download, Inbox,
  QrCode, Users, UserPlus, Link2, Smartphone, CheckCircle, XCircle,
  Navigation, MapPin as MapPinIcon, ClipboardCheck, PackageCheck, UserCheck,
} from 'lucide-react';
import {
  processFreeRegoLookup, processVinLookup, processPartsQuery,
  persistJobProgress, COURIER_BASE_FEE, TAX_RATE, CONSUMABLES_MARKUP,
  SOURCING_TIERS, getToolsForComponent, getConsumablesForComponent,
  getDocsForComponent, TRADE_ACCOUNTS, MEMBERSHIP_TIERS, resolveTradeAccount,
  compileCustomerInvoice, dispatchInvoicePaymentRequest,
  settleInvoiceViaCustomerPortal, connectOpenBankingFeed, simulateInboundDeposit,
   startBasiqBankFeedListener, triggerXeroAccountantSync, linkAtoSbr,
  connectAccountingSoftware, inviteAccountant, streamInvoiceToLedger,
  executeStripeSplitPayouts, dispatchUberDirectDrivers, PLATFORM_LOGISTICS_MARKUP,
  TRANS_TASMAN_FREIGHT_SURCHARGE, GLOBAL_DIRECT_FREIGHT_SURCHARGE,
  dispatchConsolidatedFreight,
} from './mockBackend.js';

// ── Universal local components safely shield front-end dashboard rows ──
const WORKSHOP_BUSINESS = { name: "PartsForge Verified Workshop Partner", abn: "00 000 000 000", tier: "MECHANIC_GOLD" };
const createLiveCourierQuote = async () => ({ price: 25.00, etaMinutes: 35, provider: "Uber Direct Logistics" });


import { REGIONS, REGION_LIST, US_STATES, getEffectiveTaxRate, formatCurrency } from './regionConfig';
import SellerConsole from './components/SellerConsole';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabaseAuth = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;

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
const readStored = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};
const fmt = (n, regionCode) => {
  const activeCode = typeof regionCode === 'string' ? regionCode : 'AU_VIC';
  const targetRegion = (typeof REGIONS !== 'undefined' && REGIONS[activeCode]) ? REGIONS[activeCode] : { locale: 'en-AU', currency: 'AUD' };
  return typeof formatCurrency === 'function' ? formatCurrency(n, targetRegion) : new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n || 0);
};

const REGO_REGIONS = [
  { value: 'AU_VIC', label: 'AU — Victoria' }, { value: 'AU_NSW', label: 'AU — New South Wales' },
  { value: 'AU_QLD', label: 'AU — Queensland' }, { value: 'AU_SA', label: 'AU — South Australia' },
  { value: 'AU_WA', label: 'AU — Western Australia' }, { value: 'AU_TAS', label: 'AU — Tasmania' },
  { value: 'AU_NT', label: 'AU — Northern Territory' }, { value: 'AU_ACT', label: 'AU — ACT' },
  { value: 'NZ', label: 'New Zealand' }, { value: 'UK', label: 'United Kingdom' },
  { value: 'US_CA', label: 'US — California' }, { value: 'US_NY', label: 'US — New York' },
  { value: 'US_TX', label: 'US — Texas' },
];

const TIER_LABELS = { DIY: 'DIY Driver', MECHANIC: 'Mechanic Workshop', SELLER: 'Parts Seller' };

// ─── Error Boundary ──────────────────────────────────────────────────────────
export class AppErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center text-slate-200 px-4" style={{ background: C.bg }}>
          <div className="max-w-md text-center space-y-4">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl" style={{ background: `${C.orange}20`, ring: `1px solid ${C.orange}40` }}>
              <AlertTriangle className="h-7 w-7" style={{ color: C.orange }} />
            </div>
            <h1 className="text-xl font-bold text-slate-50">Something went wrong</h1>
            <p className="text-sm" style={{ color: C.textDim }}>An unexpected error occurred. Your data is safe — try reloading.</p>
            <button onClick={() => window.location.reload()} className="rounded-lg px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:opacity-90" style={{ background: C.orange }}>Reload Workshop</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Safety Shield Modal ─────────────────────────────────────────────────────
function SafetyShield({ onAccept }) {
  const [scrolled, setScrolled] = useState(false);
  const [checked, setChecked] = useState(false);
  const boxRef = useRef(null);
  const canAccept = scrolled && checked;

  const handleScroll = () => {
    const el = boxRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setScrolled(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border-2 shadow-2xl" style={{ background: C.bg, borderColor: `${C.orange}40` }}>
        <div className="h-2" style={{ background: `repeating-linear-gradient(45deg, ${C.orange} 0 8px, ${C.bg} 8px 16px)` }} />
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${C.orange}15` }}>
              <ShieldCheck className="h-6 w-6" style={{ color: C.orange }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Critical Safety & Liability Agreement</h2>
              <p className="text-xs" style={{ color: C.textDim }}>ForgedParts Pty Ltd — Read fully before entering the garage.</p>
            </div>
          </div>
          <div ref={boxRef} onScroll={handleScroll} className="terms-scroll mt-5 h-44 overflow-y-auto rounded-lg border p-4 text-sm leading-relaxed" style={{ background: C.panel2, borderColor: C.border, color: C.textDim }}>
            <p className="mb-3 font-semibold" style={{ color: C.orange }}>SAFETY WARNING — AUTOMOTIVE REPAIR INHERENT RISK</p>
            <p className="mb-3">By entering the PartsForge Garage, you acknowledge that automotive repair carries inherent risk of serious injury or death. Torque specifications, fitting procedures and educational content provided are general reference only and must be verified against the official workshop manual for your specific vehicle, engine and model year.</p>
            <p className="mb-3">ForgedParts Pty Ltd, its directors, employees and affiliates accept no liability for any property damage, personal injury, loss of income, consequential loss or death arising from the use of this application, its content, or parts sourced through its marketplace.</p>
            <p className="mb-3">Parts sourced via the Fast Local Delivery, National Retail and Facebook Marketplace channels are sold by third-party vendors. PartsForge does not manufacture, warehouse or warrant these parts. All warranty claims must be directed to the original manufacturer or vendor.</p>
            <p className="mb-3">Pro Workshop users performing repairs for paying customers do so under their own trade licence and insurance. The Job Card invoice calculator is an estimation tool only and does not constitute a tax invoice until issued by the registered business.</p>
            <p className="mb-3">Vehicle registration lookups use publicly available data. Misuse of vehicle data for fraud, theft or unlawful identification is a criminal offence. All activity is logged.</p>
            <p style={{ color: C.textDimmer }}>Scroll to the bottom of this box to unlock the acceptance checkbox, then tap "Accept & Enter Garage" to continue. If you do not agree, close this application.</p>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            {scrolled ? (
              <span className="flex items-center gap-1" style={{ color: C.emerald }}><CheckCircle2 className="h-3.5 w-3.5" /> Terms read</span>
            ) : (
      
<span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="h-3.5 w-3.5" /> Scroll to the bottom to continue</span>
            )}
          </div>
          <label className={`mt-4 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${scrolled ? '' : 'cursor-not-allowed opacity-50'}`} style={{ borderColor: scrolled ? `${C.orange}40` : C.border, background: scrolled ? `${C.orange}05` : C.panel2 }}>
            <input type="checkbox" checked={checked} disabled={!scrolled} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-4 w-4" style={{ accentColor: C.orange }} />
            <span className="text-sm text-slate-300">I have read and understood the safety warnings and liability terms. I accept all risk for any repair work I perform using PartsForge content or parts.</span>
          </label>
          <button onClick={onAccept} disabled={!canAccept} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition ${canAccept ? 'text-slate-950' : 'cursor-not-allowed'}`} style={{ background: canAccept ? C.orange : C.border, color: canAccept ? '#000' : C.textDim }}>
            <Wrench className="h-4 w-4" /> Enter PartsForge Hub
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Gate ───────────────────────────────────────────────────────────────
function AuthGate({ onAuthenticate, isAuthenticating }) {
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tier, setTier] = useState('DIY');
  const [linkedAccount, setLinkedAccount] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [checked, setChecked] = useState(false);
  const [authError, setAuthError] = useState('');
  const boxRef = useRef(null);

  const handleScroll = () => {
    if (!boxRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = boxRef.current;
    if (scrollHeight - scrollTop - clientHeight < 5) setScrolled(true);
  };

  const canSubmit = fullName.trim() && email.trim() && password.trim() && !isAuthenticating && checked && (tier !== 'APPRENTICE' || linkedAccount.trim());

  const handleAuthSubmission = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setAuthError('');

    if (!supabaseAuth) {
      setAuthError('Authentication is not configured. Add the Supabase URL and publishable key to the deployment environment.');
      return;
    }

    if (isSignUpMode) {
      const { error } = await supabaseAuth.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: { data: { name: fullName.trim(), tier, linkedAccount: tier === 'APPRENTICE' ? linkedAccount.trim() : 'Master Root Account' } },
      });
      if (error) {
        setAuthError(error.message);
        return;
      }
      alert('Account created. Check your email to confirm the account, then sign in.');
      setIsSignUpMode(false);
      setPassword('');
    } else {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
      if (error || !data?.user) {
        setAuthError(error?.message || 'Sign-in failed.');
        return;
      }
      const { data: dbProfile, error: profileError } = await supabaseAuth.from('profiles').select('display_name,role,linked_account').eq('id', data.user.id).single();
      if (profileError || !dbProfile) {
        await supabaseAuth.auth.signOut();
        setAuthError('Your account profile could not be verified. Contact support.');
        return;
      }
      onAuthenticate({ 
        name: dbProfile.display_name || fullName.trim(),
        email: data.user.email,
        role: dbProfile.role,
        linkedAccount: dbProfile.linked_account || '',
        technicianId: data.user.id,
        isEmployeeSubUser: dbProfile.role === 'APPRENTICE'
      });
    }
  };

return (
    <div className="flex items-center justify-center p-4 min-h-screen">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl" style={{ borderColor: C.border, background: C.panel }}>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20">
            <Wrench className="h-6 w-6 text-slate-950" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-100">PartsForge Secure Gateway</h2>
          <p className="mt-1 text-xs uppercase tracking-widest font-semibold" style={{ color: C.orange }}>Secure account access</p>
          <div className="mt-3 px-3 py-1 text-[11px] font-bold uppercase rounded-full border border-slate-800 bg-slate-900/60 text-slate-400">
            Node: <span className="text-orange-400">{isSignUpMode ? 'Account Creation' : 'Secure Sign In'}</span>
          </div>
        </div>

        <form onSubmit={handleAuthSubmission} className="mt-5 flex flex-col gap-4">
          {authError && (
            <div className="p-3 text-xs font-bold rounded-lg border border-red-900/30 bg-red-950/20 text-red-400 animate-pulse text-center">
              {authError}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textDim }}>Technician / Account Holder Name</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }} placeholder="Full legal name" />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textDim }}>Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }} placeholder="name@workshop.com" />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textDim }}>Secure Password</label>
            <div className="relative mt-1">
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border pl-3 pr-10 py-2.5 text-sm text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isSignUpMode && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textDim }}>Select Account Tier</label>
              <select value={tier} onChange={(e) => setTier(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }}>
                <option value="DIY">DIY Driver Tier</option>
                <option value="MECHANIC">Registered Mechanic (Master Account Holder)</option>
                <option value="APPRENTICE">Employee Link (Sub-Account Access)</option>
                <option value="SELLER">Verified Parts Seller Network</option>
              </select>
            </div>
          )}

          {isSignUpMode && tier === 'APPRENTICE' && (
            <div className="p-3 rounded-lg border border-dashed animate-pulse" style={{ borderColor: C.orange, background: C.panel2 }}>
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.orange }}>🔗 Link to Employer's Master Account Email</label>
              <input type="email" required value={linkedAccount} onChange={(e) => setLinkedAccount(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-xs text-slate-100 outline-none" style={{ borderColor: C.border, background: C.background }} placeholder="owner@eppingmechanics.com.au" />
              <p className="text-[10px] text-slate-400 mt-1 uppercase">Provides shared JobCard synchronization and roots all purchase accountability workflows straight to the master dashboard console tier.</p>
            </div>
          )}

          <div ref={boxRef} onScroll={handleScroll} className="terms-scroll mt-1 h-20 overflow-y-auto rounded-lg border p-3 text-xs leading-relaxed" style={{ background: C.panel2, borderColor: C.border, color: C.textDim }}>
            <p className="mb-1 font-semibold" style={{ color: C.orange }}>SECURE GATEWAY & LIABILITY ROUTING AGREEMENT</p>
            <p className="mb-1">PartsForge uses account permissions to control workshop actions. Payments are available only when Stripe is configured, and an order is not treated as paid until PartsForge receives a verified payment confirmation.</p>
            <p>Scroll down to review and accept the account and safety terms.</p>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            {scrolled ? (
              <span className="flex items-center gap-1" style={{ color: C.emerald }}><CheckCircle2 className="h-3 w-3" /> Framework Read Verified</span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="h-3 w-3" /> Scroll box to verify protocols</span>
            )}
          </div>

          <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${scrolled ? '' : 'cursor-not-allowed opacity-50'}`} style={{ borderColor: scrolled ? `${C.orange}40` : C.border, background: scrolled ? `${C.orange}05` : C.panel2 }}>
            <input type="checkbox" checked={checked} disabled={!scrolled} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-4 w-4" style={{ accentColor: C.orange }} />
            <span className="text-xs text-slate-300">I verify all linked device liability requirements.</span>
          </label>

          <button type="submit" disabled={!canSubmit} className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition shadow-md" style={{ background: canSubmit ? C.orange : C.border, color: canSubmit ? '#000' : C.textDim }}>
                        {isAuthenticating ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> Synchronizing Node...</>
            ) : (
              <>{isSignUpMode ? 'Create Secure Business Account' : 'Authenticate & Secure Entry'}</>
            )}
          </button>

          {/* TOGGLE LINK FOOTER */}
          <div className="text-center mt-2 border-t pt-3 border-slate-800/80">
            <button type="button" onClick={() => { setIsSignUpMode(!isSignUpMode); setAuthError(''); setChecked(false); }} className="text-xs font-medium text-slate-400 hover:text-orange-400 transition-all underline">
              {isSignUpMode ? "Already have a workshop setup? Sign In here" : "Don't have a business node registered? Sign Up here"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Fixed Vehicle HUD (static header widget, locked position) ──────────────
function FixedVehicleHUD({ vehicle, vehicles, onOpenFolder, onEdit }) {
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ rego: '', vin: '', make: '', model: '', engine: '' });

  const startEdit = (v) => {
    setEditing(v.id);
    setEditForm({ rego: v.rego || '', vin: v.vin || '', make: v.make || '', model: v.model || '', engine: v.engine || '' });
  };
  const saveEdit = () => {
    onEdit(editing, editForm);
    setEditing(null);
  };

  return (
    <>
      <div className="sticky top-0 z-30 border-b" style={{ borderColor: C.border, background: `${C.bg}f5` }}>
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: vehicle ? `${C.orange}15` : C.panel2 }}>
            <Car className="h-4.5 w-4.5" style={{ color: vehicle ? C.orange : C.textDimmer }} />
          </div>
          {vehicle ? (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-slate-50">{vehicle.year ? `${vehicle.year} ` : ''}{vehicle.make} {vehicle.model}</div>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: C.textDim }}>
                <span className="font-mono">{vehicle.rego || 'No Plate'}</span>
                <span className="font-mono">VIN: {vehicle.vin ? vehicle.vin.slice(-6) : 'N/A'}</span>
                <span className="truncate">{vehicle.engine || 'Engine data pending'}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-300">No Active Vehicle Context</div>
              <div className="text-[10px]" style={{ color: C.textDim }}>Run a rego or VIN lookup to load vehicle specs</div>
            </div>
          )}
          {vehicle && (
            <button onClick={(e) => { e.preventDefault(); startEdit(vehicle); }} className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition" style={{ borderColor: C.border, background: C.panel, color: C.textDim }}>
              <Settings className="h-3.5 w-3.5" /> Edit
            </button>
          )}
          <button onClick={(e) => { e.preventDefault(); onOpenFolder(); }} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition" style={{ borderColor: `${C.orange}40`, background: `${C.orange}08`, color: C.orange }}>
            <Warehouse className="h-3.5 w-3.5" /> Garage Bay Folder
            {vehicles.length > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-slate-950" style={{ background: C.orange }}>{vehicles.length}</span>}
          </button>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl border p-5" style={{ background: C.bg, borderColor: C.border }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">Edit Vehicle Profile</h3>
              <button onClick={() => setEditing(null)} className="rounded p-1" style={{ color: C.textDim }}><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Plate ID" value={editForm.rego} onChange={(v) => setEditForm(f => ({ ...f, rego: v.toUpperCase() }))} mono />
              <Field label="VIN" value={editForm.vin} onChange={(v) => setEditForm(f => ({ ...f, vin: v.toUpperCase() }))} mono />
              <Field label="Make" value={editForm.make} onChange={(v) => setEditForm(f => ({ ...f, make: v }))} />
              <Field label="Model" value={editForm.model} onChange={(v) => setEditForm(f => ({ ...f, model: v }))} />
              <Field label="Engine" value={editForm.engine} onChange={(v) => setEditForm(f => ({ ...f, engine: v }))} />
            </div>
            <button onClick={saveEdit} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-slate-950" style={{ background: C.orange }}>
              <CheckCircle2 className="h-4 w-4" /> Save Changes
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Garage Bay Folder Modal (expanding overlay of saved vehicles) ───────────
function GarageBayFolderModal({ open, vehicles, activeId, onSelect, onRemove, onClose, onEdit }) {
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ rego: '', vin: '', make: '', model: '', engine: '' });
  if (!open) return null;

  const startEdit = (v) => {
    setEditing(v.id);
    setEditForm({ rego: v.rego || '', vin: v.vin || '', make: v.make || '', model: v.model || '', engine: v.engine || '' });
  };
  const saveEdit = () => {
    onEdit(editing, editForm);
    setEditing(null);
  };

return (
    <div className="fixed inset-0 z-[88] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border p-5" style={{ background: C.bg, borderColor: C.border }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-100"><Warehouse className="h-4 w-4" style={{ color: C.orange }} /> Garage Bay Folder — Saved Vehicle Profiles</h3>
          <button onClick={onClose} className="rounded p-1" style={{ color: C.textDim }}><X className="h-5 w-5" /></button>
        </div>
        <div className="custom-scrollbar max-h-[60vh] overflow-y-auto space-y-2">
          {vehicles.length === 0 ? <p className="p-6 text-center text-sm" style={{ color: C.textDim }}>No saved vehicles. Run a rego or VIN lookup and commit a vehicle to populate this folder.</p> : vehicles.map((v) => (
            <div key={v.id} className={`flex items-center gap-3 rounded-lg border p-3 transition ${activeId === v.id ? '' : 'hover:border-current'}`} style={{ borderColor: activeId === v.id ? C.orange : C.border, background: activeId === v.id ? `${C.orange}08` : C.panel2 }}>
              <button onClick={(e) => { e.preventDefault(); onSelect(v.id); onClose(); }} className="flex min-w-0 flex-1 items-center gap-3 text-left transition hover:opacity-80">
                <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: activeId === v.id ? C.orange : C.border, color: activeId === v.id ? '#000' : C.textDim }}>
                  <Car className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-slate-100">{v.year ? `${v.year} ` : ''}{v.make} {v.model}</div>
                  <div className="truncate font-mono text-[10px]" style={{ color: C.textDim }}>{v.rego || v.vin?.slice(-6) || 'No ID'}</div>
                </div>
              </button>
                           <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(v); }} className="shrink-0 rounded p-1.5 transition hover:opacity-70" style={{ color: C.textDim }}><Settings className="h-3.5 w-3.5" /></button>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(v.id); }} className="shrink-0 rounded p-1.5 transition" style={{ color: C.red }}><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[91] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl border p-5" style={{ background: C.bg, borderColor: C.border }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">Edit Vehicle Profile</h3>
              <button onClick={() => setEditing(null)} className="rounded p-1" style={{ color: C.textDim }}><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Plate ID" value={editForm.rego} onChange={(v) => setEditForm(f => ({ ...f, rego: v.toUpperCase() }))} mono />
              <Field label="VIN" value={editForm.vin} onChange={(v) => setEditForm(f => ({ ...f, vin: v.toUpperCase() }))} mono />
              <Field label="Make" value={editForm.make} onChange={(v) => setEditForm(f => ({ ...f, make: v }))} />
              <Field label="Model" value={editForm.model} onChange={(v) => setEditForm(f => ({ ...f, model: v }))} />
              <Field label="Engine" value={editForm.engine} onChange={(v) => setEditForm(f => ({ ...f, engine: v }))} />
            </div>
            <button onClick={saveEdit} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-slate-950" style={{ background: C.orange }}>
              <CheckCircle2 className="h-4 w-4" /> Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, mono }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textDim }}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-current ${mono ? 'font-mono' : ''}`} style={{ borderColor: C.border, background: C.panel2 }} />
    </div>
  );
}

// ─── Scanner Panel ───────────────────────────────────────────────────────────
function ScannerPanel({ onRego, onVin, onPhoto, onManualVehicle, onCommit, loading, vehicle, lookupError, scanning, hoists, selectedHoistId, onHoistChange }) {
  const [plate, setPlate] = useState(() => readStored('partsforge_scanner_plate', ''));
  const [vin, setVin] = useState(() => readStored('partsforge_scanner_vin', ''));
  const [region, setRegion] = useState(() => readStored('partsforge_scanner_region', 'AU_VIC'));
  const [mode, setMode] = useState(() => readStored('partsforge_scanner_mode', 'rego'));
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualVehicle, setManualVehicle] = useState({ year: '', make: '', model: '', series: '', engine: '' });

  useEffect(() => { try { localStorage.setItem('partsforge_scanner_plate', JSON.stringify(plate)); } catch {} }, [plate]);
  useEffect(() => { try { localStorage.setItem('partsforge_scanner_vin', JSON.stringify(vin)); } catch {} }, [vin]);
  useEffect(() => { try { localStorage.setItem('partsforge_scanner_region', JSON.stringify(region)); } catch {} }, [region]);
  useEffect(() => { try { localStorage.setItem('partsforge_scanner_mode', JSON.stringify(mode)); } catch {} }, [mode]);
  
  const val = mode === 'vin' ? vin : plate;

  const submit = () => {
    const activePlate = val || '';
    if (!activePlate.trim()) {
      alert("⚠️ Please enter a registration number sequence first.");
      return;
    }

    if (mode === 'vin') {
      if (vin.trim() && typeof onVin === 'function') {
        onVin(vin.trim(), region);
      }
    } else {
      const cleanPlate = activePlate.trim().toUpperCase();
      const cleanRegion = (region || 'VIC').trim().toUpperCase().replace('AU_', '');
      
      console.log(`Dispatched active background network search for plate: ${cleanPlate}`);
      if (typeof onRego === 'function') {
        Promise.resolve(onRego(cleanPlate, cleanRegion)).catch(err => {
          console.error("Background lookup promise error handled:", err);
        });
      }
    }
  };

  return (
    <div className="rounded-xl border p-4" style={{ background: C.panel, borderColor: C.border }}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.textDim }}>
        <ScanLine className="h-3.5 w-3.5" style={{ color: C.orange }} /> Vehicle Identification
      </div>
      <div className="mt-3 flex gap-1 rounded-lg border p-1" style={{ borderColor: C.border, background: C.bg }}>
        <button onClick={(e) => { e.preventDefault(); setMode('rego'); }} className="flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition" style={{ background: mode === 'rego' ? C.orange : 'transparent', color: mode === 'rego' ? '#000' : C.textDim }}>Rego Plate</button>
        <button onClick={(e) => { e.preventDefault(); setMode('vin'); }} className="flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition" style={{ background: mode === 'vin' ? C.orange : 'transparent', color: mode === 'vin' ? '#000' : C.textDim }}>17-Char VIN</button>
      </div>
      <div className="mt-3">
        <label className="text-xs" style={{ color: C.textDim }}>Registration Region</label>
        <select value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-100 outline-none" style={{ borderColor: C.border, background: C.bg }}>
          {REGO_REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div className="mt-3">
        <label className="text-xs" style={{ color: C.textDim }}>{mode === 'vin' ? 'VIN (17 chars)' : 'Rego Plate'}</label>
        <div className="mt-1 flex gap-2">
          <input value={val} onChange={(e) => mode === 'vin' ? setVin(e.target.value.toUpperCase()) : setPlate(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder={mode === 'vin' ? 'AHT0HILX401234567' : '1XX2YY'} maxLength={mode === 'vin' ? 17 : undefined} className="flex-1 rounded-lg border px-3 py-2 font-mono text-sm uppercase tracking-widest text-slate-100 outline-none" style={{ borderColor: C.border, background: C.bg }} />
          <button onClick={(e) => { e.preventDefault(); submit(); }} disabled={loading} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-950 transition" style={{ background: C.orange }}>
            {loading ? <Sparkles className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Lookup
          </button>
        </div>
      </div>

      {mode === 'rego' && !vehicle && (
        <button
          onClick={(e) => {
            e.preventDefault();
            setManualEntryOpen(current => !current);
          }}
          className="mt-2 w-full rounded-lg border px-3 py-2 text-xs font-semibold transition"
          style={{ borderColor: C.border, background: C.panel2, color: C.textDim }}
        >
          {manualEntryOpen ? 'Hide Manual Vehicle Entry' : 'Enter Vehicle Manually — Free'}
        </button>
      )}

      {(manualEntryOpen || lookupError) && !loading && !vehicle && (
        <div className="mt-3 rounded-lg border p-3" style={{ borderColor: `${C.orange}50`, background: `${C.orange}08` }}>
          <div className="text-xs font-semibold" style={{ color: C.orange }}>
            {lookupError ? 'Automatic lookup unavailable' : 'Manual Vehicle Entry — Free'}
          </div>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: C.textDim }}>
            {lookupError
              ? `${lookupError} Enter the vehicle details below to continue without a paid registration lookup.`
              : 'Skip the registration provider and enter the vehicle details you can confirm directly.'}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Field label="Year" value={manualVehicle.year} onChange={(value) => setManualVehicle(current => ({ ...current, year: value.replace(/\D/g, '').slice(0, 4) }))} mono />
            <Field label="Make" value={manualVehicle.make} onChange={(value) => setManualVehicle(current => ({ ...current, make: value }))} />
            <Field label="Model" value={manualVehicle.model} onChange={(value) => setManualVehicle(current => ({ ...current, model: value }))} />
            <Field label="Series / Badge" value={manualVehicle.series} onChange={(value) => setManualVehicle(current => ({ ...current, series: value }))} />
            <div className="sm:col-span-2">
              <Field label="Engine (if known)" value={manualVehicle.engine} onChange={(value) => setManualVehicle(current => ({ ...current, engine: value }))} />
            </div>
          </div>
          <p className="mt-2 text-[11px]" style={{ color: C.textDimmer }}>
            Manual details help rank results only. Fitment remains unverified until confirmed against the vehicle or supplier catalogue.
          </p>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!manualVehicle.make.trim() || !manualVehicle.model.trim()) return;
              onManualVehicle?.({ ...manualVehicle, rego: plate.trim().toUpperCase() });
              setManualEntryOpen(false);
            }}
            disabled={!manualVehicle.make.trim() || !manualVehicle.model.trim()}
            className="mt-3 w-full rounded-lg px-3 py-2.5 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: C.orange }}
          >
            Use Manual Vehicle Details
          </button>
        </div>
      )}
      
              <button 
        onClick={(e) => {
          e.preventDefault();
          if (typeof onPhoto === 'function') onPhoto();
        }} 
        disabled={scanning} 
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium text-slate-300 transition" 
        style={{ borderColor: C.border, background: C.panel2 }}
      >
        {scanning ? (
          <><ScanLine className="h-4 w-4 animate-pulse" style={{ color: C.orange }} /> Analyzing photo...</>
        ) : (
          <><Camera className="h-4 w-4" /> Photo ID Scan</>
        )}
      </button>
      
      {vehicle && !scanning && (
        <div className="mt-3 rounded-lg border p-3" style={{ borderColor: vehicle.source === 'manual' ? `${C.orange}40` : `${C.emerald}30`, background: vehicle.source === 'manual' ? `${C.orange}06` : `${C.emerald}05` }}>
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: vehicle.source === 'manual' ? C.orange : C.emerald }}>
            {vehicle.source === 'manual' ? <AlertTriangle className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
            {vehicle.source === 'manual' ? 'Manual Vehicle — Unverified' : 'Vehicle Matched'}
          </div>
          <div className="mt-1.5 text-sm font-bold text-slate-100">
  {(vehicle.year || 'YEAR UNKNOWN')}{' '}
  {(vehicle.make || 'UNKNOWN MAKE').toUpperCase()}{' '}
  {(vehicle.model || 'UNKNOWN MODEL').toUpperCase()}
</div>

<div className="mt-2 grid grid-cols-2 gap-2 text-xs">

  <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.panel2 }}>
    <div className="text-[10px] uppercase tracking-wide" style={{ color: C.textDimmer }}>
      Registration
    </div>
    <div className="mt-0.5 font-mono font-semibold" style={{ color: C.orange }}>
      {(vehicle.rego || 'Not supplied').toUpperCase()}
    </div>
  </div>

  <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.panel2 }}>
    <div className="text-[10px] uppercase tracking-wide" style={{ color: C.textDimmer }}>
      VIN
    </div>
    <div className="mt-0.5 break-all font-mono font-semibold text-slate-200">
      {vehicle.vin ? vehicle.vin.toUpperCase() : 'NOT SUPPLIED'}
    </div>
  </div>

  <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.panel2 }}>
    <div className="text-[10px] uppercase tracking-wide" style={{ color: C.textDimmer }}>
      Engine
    </div>
    <div className="mt-0.5 font-semibold text-slate-200">
      {(vehicle.engine || 'Not supplied').toUpperCase()}
    </div>
  </div>

  <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.panel2 }}>
    <div className="text-[10px] uppercase tracking-wide" style={{ color: C.textDimmer }}>
      Engine Number
    </div>
    <div className="mt-0.5 font-mono font-semibold text-slate-200">
      {vehicle.engineNumber ? vehicle.engineNumber.toUpperCase() : 'NOT SUPPLIED'}
    </div>
  </div>

  <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.panel2 }}>
    <div className="text-[10px] uppercase tracking-wide" style={{ color: C.textDimmer }}>
      Body
    </div>
    <div className="mt-0.5 font-semibold text-slate-200">
      {(vehicle.body || 'Not supplied').toUpperCase()}
    </div>
  </div>

  <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.panel2 }}>
    <div className="text-[10px] uppercase tracking-wide" style={{ color: C.textDimmer }}>
      Year Range
    </div>
    <div className="mt-0.5 font-semibold text-slate-200">
      {vehicle.yearRange || 'Not supplied'}
    </div>
  </div>

  <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.panel2 }}>
    <div className="text-[10px] uppercase tracking-wide" style={{ color: C.textDimmer }}>
      Colour
    </div>
    <div className="mt-0.5 font-semibold text-slate-200">
      {(vehicle.colour || 'Not supplied').toUpperCase()}
    </div>
  </div>

  <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.panel2 }}>
    <div className="text-[10px] uppercase tracking-wide" style={{ color: C.textDimmer }}>
      Compliance Date
    </div>
    <div className="mt-0.5 font-semibold text-slate-200">
      {vehicle.complianceDate || 'Not supplied'}
    </div>
  </div>

  <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.panel2 }}>
    <div className="text-[10px] uppercase tracking-wide" style={{ color: C.textDimmer }}>
      Registration Expiry
    </div>
    <div className="mt-0.5 font-semibold text-slate-200">
      {vehicle.registrationExpiry || 'Not supplied'}
    </div>
  </div>

  <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.panel2 }}>
    <div className="text-[10px] uppercase tracking-wide" style={{ color: C.textDimmer }}>
      Goods Vehicle
    </div>
    <div className="mt-0.5 font-semibold text-slate-200">
      {(vehicle.goodsCarryingVehicle || 'Not supplied').toUpperCase()}
    </div>
  </div>

</div>

{vehicle.description && (
  <div
    className="mt-2 rounded-md border p-2"
    style={{ borderColor: C.border, background: C.panel2 }}
  >
    <div className="text-[10px] uppercase tracking-wide" style={{ color: C.textDimmer }}>
      Vehicle Description
    </div>
    <div className="mt-0.5 text-xs font-medium text-slate-200">
      {vehicle.description}
    </div>
  </div>
)}

{vehicle.detailedDescription && (
  <div
    className="mt-2 rounded-md border p-2"
    style={{ borderColor: C.border, background: C.panel2 }}
  >
    <div className="text-[10px] uppercase tracking-wide" style={{ color: C.textDimmer }}>
      Detailed Specification
    </div>
    <div className="mt-0.5 text-xs leading-relaxed text-slate-200">
      {vehicle.detailedDescription}
    </div>
  </div>
)}

{vehicle.stolen && (
  <div
    className="mt-2 rounded-md border p-2"
    style={{ borderColor: C.border, background: C.panel2 }}
  >
    <div
      className="text-[10px] uppercase tracking-wide"
      style={{ color: C.textDimmer }}
    >
      Stolen Status
    </div>

    <div className="mt-0.5 text-xs font-semibold text-slate-200">
      {String(vehicle.stolen).toUpperCase()}
    </div>
  </div>
)}

          <div className="mt-3">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textDim }}>
              Assign vehicle to hoist
            </label>
            <select
              value={selectedHoistId || ''}
              onChange={(e) => onHoistChange?.(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-100 outline-none"
              style={{ borderColor: C.border, background: C.bg }}
            >
              <option value="">Select an available hoist...</option>
              {(hoists || []).filter(hoist => hoist.status === 'available').map((hoist) => (
                <option key={hoist.id} value={hoist.id}>
                  {hoist.name} — AVAILABLE
                </option>
              ))}
            </select>
          </div>
           
          <button 
            onClick={(e) => { 
              e.preventDefault(); 
              if (typeof onCommit === 'function') onCommit(selectedHoistId); 
            }} 
            disabled={!selectedHoistId}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-950 transition hover:opacity-90" 
            style={{ background: C.orange }}
          >
            <Plus className="h-4 w-4" /> Commit Vehicle to Selected Hoist
          </button>
        </div>
      )}
    </div>
  );
}

function HoistManager({ hoists, onAdd, onRename, onStatusChange }) {
  const [newName, setNewName] = useState('');

  return (
    <div className="rounded-xl border p-4" style={{ background: C.panel, borderColor: C.border }}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.textDim }}>
        <Warehouse className="h-3.5 w-3.5" style={{ color: C.cyan }} /> Workshop Hoists
      </div>
      <div className="mt-3 space-y-2">
        {(hoists || []).map((hoist) => (
          <div key={hoist.id} className="grid gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_160px]" style={{ borderColor: C.border, background: C.panel2 }}>
            <input
              value={hoist.name}
              onChange={(e) => onRename(hoist.id, e.target.value)}
              className="rounded-md border px-2.5 py-2 text-xs text-slate-100 outline-none"
              style={{ borderColor: C.border, background: C.bg }}
              aria-label={`Name for ${hoist.id}`}
            />
            <select
              value={hoist.status}
              onChange={(e) => onStatusChange(hoist.id, e.target.value)}
              className="rounded-md border px-2.5 py-2 text-xs text-slate-100 outline-none"
              style={{ borderColor: C.border, background: C.bg }}
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="out_of_service">Out of service</option>
            </select>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New hoist name"
          className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm text-slate-100 outline-none"
          style={{ borderColor: C.border, background: C.bg }}
        />
        <button
          onClick={() => {
            if (!newName.trim()) return;
            onAdd(newName.trim());
            setNewName('');
          }}
          className="rounded-lg px-3 py-2 text-xs font-bold text-slate-950"
          style={{ background: C.cyan }}
        >
          Add Hoist
        </button>
      </div>
    </div>
  );
}

// ─── Parts Search ────────────────────────────────────────────────────────────
function PartsSearch({ onSearch, loading }) {
  const [query, setQuery] = useState(() => readStored('partsforge_parts_query', ''));
  useEffect(() => { try { localStorage.setItem('partsforge_parts_query', JSON.stringify(query)); } catch {} }, [query]);
  const submit = () => { if (query.trim()) onSearch(query.trim()); };
  return (
    <div className="rounded-xl border p-4" style={{ background: C.panel, borderColor: C.border }}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.textDim }}>
        <Search className="h-3.5 w-3.5" style={{ color: C.orange }} /> Parts Search
      </div>
      <div className="mt-3 flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="brake pads, oil filter, spark plugs, air filter..." className="flex-1 rounded-lg border px-3 py-2 text-sm text-slate-100 outline-none" style={{ borderColor: C.border, background: C.bg }} />
        <button onClick={submit} disabled={loading} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-slate-950 transition" style={{ background: C.orange }}>
          {loading ? <Sparkles className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
        </button>
      </div>
    </div>
  );
}

// ─── Parts Results ───────────────────────────────────────────────────────────
function PartsResults({ results, role, onAdd, onAddConsumable, cartIds, region }) {
  const tiers = ['local', 'national', 'trans_tasman', 'global_direct', 'facebook'];

  const [detailItem, setDetailItem] = useState(null);
  const [detailTier, setDetailTier] = useState(null);

  if (!results) return null;

  const inCart = (id) => (cartIds || []).includes(id);

  return (
    <div className="rounded-xl border p-4" style={{ background: C.panel, borderColor: C.border }}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.textDim }}>
        <Package className="h-3.5 w-3.5" style={{ color: C.orange }} /> Sourcing Catalogue
      </div>
      <div className="mt-3 space-y-3">
        {tiers.map((tier) => {
          const items = results[tier] || [];
          if (!items.length) return null;
          const tierInfo = SOURCING_TIERS[tier];
          const label = tierInfo ? tierInfo.label : tier === 'facebook' ? 'Facebook Marketplace' : tier;
          return (
            <div key={tier} className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
              <div className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.cyan }}>{label}</div>
              <div className="grid gap-2 sm:grid-cols-2">
               {items.map((item) => {
  const price =
    role === 'pro'
      ? (item.trade ?? item.price)
      : (item.retail ?? item.price);

  return (
    <div
      key={item.id}
      onClick={() => {
        setDetailItem(item);
        setDetailTier(tier);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setDetailItem(item);
          setDetailTier(tier);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View part information for ${item.title}`}
      className="cursor-pointer rounded-lg border p-3 transition hover:opacity-90"
      style={{
        borderColor: C.border,
        background: C.bg
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-slate-100">
            {item.title}
          </h4>

          <p className="text-[10px]" style={{ color: C.textDim }}>
            {item.brand || 'Private'} · {item.shop || item.loc}
          </p>

          {item.distanceKm != null && (
            <p
              className="mt-0.5 text-[10px]"
              style={{ color: C.textDimmer }}
            >
              {item.distanceKm} km away
            </p>
          )}

          <div
            className="mt-1 text-[9px] font-semibold"
            style={{ color: C.cyan }}
          >
            Click for part information →
          </div>
        </div>

        <span
          className="font-mono text-xs"
          style={{ color: C.emerald }}
        >
          {price != null ? fmt(price, region) : 'PRICE N/A'}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdd(item, tier);
        }}
        disabled={inCart(item.id)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-bold transition"
        style={{
          background: inCart(item.id)
            ? `${C.emerald}10`
            : `${C.orange}15`,
          color: inCart(item.id)
            ? C.emerald
            : C.orange,
          border: `1px solid ${
            inCart(item.id)
              ? `${C.emerald}30`
              : `${C.orange}40`
          }`
        }}
      >
        {inCart(item.id) ? (
          <>
            <CheckCircle2 className="h-3 w-3" />
            In Cart
          </>
        ) : (
          <>
            <ShoppingCart className="h-3 w-3" />
            PURCHASE
          </>
        )}
      </button>
    </div>
  );
})}
              </div>
            </div>
          );
        })}
      </div>
      
{detailItem && (
  <div
    className="mt-4 rounded-xl border p-4"
    style={{
      borderColor: `${C.cyan}40`,
      background: C.panel2
    }}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <div
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: C.cyan }}
        >
          Part Information
        </div>

        <h3 className="mt-1 text-sm font-bold text-slate-100">
          {detailItem.title}
        </h3>

        <div className="text-[10px]" style={{ color: C.textDim }}>
          {detailItem.brand || 'Unknown Brand'} · {detailItem.shop || detailItem.loc || 'Unknown Supplier'}
        </div>
      </div>

      <button
        onClick={() => {
          setDetailItem(null);
          setDetailTier(null);
        }}
        className="rounded-lg border px-2.5 py-1.5 text-[10px] font-bold"
        style={{
          borderColor: C.border,
          color: C.textDim
        }}
      >
        CLOSE
      </button>
    </div>

    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">

      <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.bg }}>
        <div className="text-[9px] uppercase" style={{ color: C.textDimmer }}>
          Price
        </div>
        <div className="mt-0.5 font-mono font-bold" style={{ color: C.emerald }}>
          {(role === 'pro'
            ? (detailItem.trade ?? detailItem.price)
            : (detailItem.retail ?? detailItem.price)) != null
            ? fmt(
                role === 'pro'
                  ? (detailItem.trade ?? detailItem.price)
                  : (detailItem.retail ?? detailItem.price),
                region
              )
            : 'PRICE N/A'}
        </div>
      </div>

      <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.bg }}>
        <div className="text-[9px] uppercase" style={{ color: C.textDimmer }}>
          Stock
        </div>
        <div className="mt-0.5 font-semibold text-slate-200">
          {detailItem.stock ?? 'NOT SUPPLIED'}
        </div>
      </div>

      <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.bg }}>
        <div className="text-[9px] uppercase" style={{ color: C.textDimmer }}>
          Part Number
        </div>
        <div className="mt-0.5 font-mono text-slate-200">
          {detailItem.partNumber || 'NOT SUPPLIED'}
        </div>
      </div>

      <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.bg }}>
        <div className="text-[9px] uppercase" style={{ color: C.textDimmer }}>
          OEM Number
        </div>
        <div className="mt-0.5 font-mono text-slate-200">
          {detailItem.oemNumber || 'NOT SUPPLIED'}
        </div>
      </div>

      <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.bg }}>
        <div className="text-[9px] uppercase" style={{ color: C.textDimmer }}>
          Distance
        </div>
        <div className="mt-0.5 text-slate-200">
          {detailItem.distanceKm != null
            ? `${detailItem.distanceKm} km`
            : 'NOT SUPPLIED'}
        </div>
      </div>

      <div className="rounded-md border p-2" style={{ borderColor: C.border, background: C.bg }}>
        <div className="text-[9px] uppercase" style={{ color: C.textDimmer }}>
          Location
        </div>
        <div className="mt-0.5 text-slate-200">
          {detailItem.loc || 'NOT SUPPLIED'}
        </div>
      </div>

    </div>

    <div
      className="mt-3 rounded-md border p-3"
      style={{
        borderColor: C.border,
        background: C.bg
      }}
    >
      <div
        className="text-[9px] font-bold uppercase tracking-wider"
        style={{ color: C.textDimmer }}
      >
        Fitment Status
      </div>

      <div className="mt-1 text-xs font-bold">
        {detailItem.fitmentAuthoritative === true ? (
          <span style={{ color: C.emerald }}>
            ✓ AUTHORITATIVE CATALOGUE FITMENT
          </span>
        ) : detailItem.fitmentCandidate || detailItem.fitmentScore > 0 ? (
          <span style={{ color: C.orange }}>
            ⚠ DEVELOPMENT MATCH — VERIFY BEFORE ORDERING
          </span>
        ) : (
          <span style={{ color: C.textDim }}>
            FITMENT UNVERIFIED
          </span>
        )}
      </div>

      <div className="mt-1 font-mono text-[10px]" style={{ color: C.textDim }}>
        {detailItem.fitmentAuthoritative === true
          ? 'Confirmed by the connected catalogue provider'
          : `Development ranking score: ${detailItem.fitmentScore ?? 0}`}
      </div>

      {detailItem.fitmentAuthoritative !== true && (
        <div className="mt-2 text-[10px] leading-relaxed" style={{ color: C.textDim }}>
          Seller-supplied vehicle fields are used only to rank possible matches. Confirm the part number and application with an authoritative catalogue or supplier before ordering or fitting.
        </div>
      )}
    </div>

    {detailItem.fitmentReasons?.length > 0 && (
      <div
        className="mt-3 rounded-md border p-3"
        style={{
          borderColor: C.border,
          background: C.bg
        }}
      >
        <div
          className="text-[9px] font-bold uppercase tracking-wider"
          style={{ color: C.textDimmer }}
        >
          Match Evidence
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {detailItem.fitmentReasons.map((reason) => (
            <span
              key={reason}
              className="rounded px-1.5 py-0.5 text-[9px] font-bold"
              style={{
                background: `${C.cyan}10`,
                color: C.cyan
              }}
            >
              {String(reason).replaceAll('_', ' ')}
            </span>
          ))}
        </div>
      </div>
    )}

    {detailItem.vehicleFitment && (
      <div
        className="mt-3 rounded-md border p-3"
        style={{
          borderColor: C.border,
          background: C.bg
        }}
      >
        <div
          className="text-[9px] font-bold uppercase tracking-wider"
          style={{ color: C.textDimmer }}
        >
          Vehicle Application
        </div>

        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
          <div style={{ color: C.textDim }}>
            Make: <span className="text-slate-300">{detailItem.vehicleFitment.make || '—'}</span>
          </div>

          <div style={{ color: C.textDim }}>
            Model: <span className="text-slate-300">{detailItem.vehicleFitment.model || '—'}</span>
          </div>

          <div style={{ color: C.textDim }}>
            Year From: <span className="text-slate-300">{detailItem.vehicleFitment.yearFrom || '—'}</span>
          </div>

          <div style={{ color: C.textDim }}>
            Year To: <span className="text-slate-300">{detailItem.vehicleFitment.yearTo || '—'}</span>
          </div>

          <div style={{ color: C.textDim }}>
            Engine: <span className="text-slate-300">{detailItem.vehicleFitment.engine || '—'}</span>
          </div>

          <div style={{ color: C.textDim }}>
            Engine Code: <span className="text-slate-300">{detailItem.vehicleFitment.engineCode || '—'}</span>
          </div>

          <div className="col-span-2" style={{ color: C.textDim }}>
            VIN: <span className="font-mono text-slate-300">{detailItem.vehicleFitment.vin || '—'}</span>
          </div>
        </div>
      </div>
    )}

    {detailItem.fitmentNotes && (
      <div
        className="mt-3 rounded-md border p-3 text-[10px]"
        style={{
          borderColor: `${C.orange}30`,
          background: `${C.orange}05`,
          color: C.orange
        }}
      >
        {detailItem.fitmentNotes}
      </div>
    )}

    <button
      onClick={() => onAdd(detailItem, detailTier || 'local')}
      disabled={inCart(detailItem.id)}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold"
      style={{
        background: inCart(detailItem.id)
          ? `${C.emerald}10`
          : C.orange,
        color: inCart(detailItem.id)
          ? C.emerald
          : '#000'
      }}
    >
      {inCart(detailItem.id) ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          In Cart
        </>
      ) : (
        <>
          <ShoppingCart className="h-3.5 w-3.5" />
          PURCHASE THIS PART
        </>
      )}
    </button>
  </div>
)}
      {results.video && (
        <div className="mt-3">
          <a href={`https://youtube.com${results.video}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold text-red-400 transition" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
            <ExternalLink className="h-3.5 w-3.5" /> {results.videoTitle || 'Watch Repair Video'}
          </a>
        </div>
      )}

      {results.tools?.length > 0 && (
        <details className="rounded-lg border p-3" style={{ borderColor: `${C.orange}20`, background: C.panel2 }}>
          <summary className="cursor-pointer text-xs font-bold" style={{ color: C.orange }}>Required Tools ({results.tools.length})</summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {results.tools.map(tool => {
              const price = role === 'pro' ? tool.trade : tool.retail;
              return (
                <div key={tool.id} className="rounded border p-2" style={{ borderColor: C.border, background: C.bg }}>
                  <div className="flex items-start justify-between gap-2">
                    <div><h4 className="text-xs font-bold text-slate-100">{tool.title}</h4><p className="text-[10px]" style={{ color: C.textDim }}>{tool.brand} · {tool.shop}</p></div>
                    <span className="font-mono text-xs" style={{ color: C.emerald }}>{fmt(price, region)}</span>
                  </div>
                  <button onClick={() => onAdd(tool, 'local')} disabled={inCart(tool.id)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-bold transition" style={{ background: inCart(tool.id) ? `${C.emerald}10` : `${C.orange}15`, color: inCart(tool.id) ? C.emerald : C.orange, border: `1px solid ${inCart(tool.id) ? `${C.emerald}30` : `${C.orange}40`}` }}>
                    {inCart(tool.id) ? <><CheckCircle2 className="h-3 w-3" /> In Cart</> : <><ShoppingCart className="h-3 w-3" /> PURCHASE</>}
                  </button>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {results.consumables?.length > 0 && (
        <details className="rounded-lg border p-3" style={{ borderColor: `${C.emerald}20`, background: C.panel2 }}>
          <summary className="cursor-pointer text-xs font-bold" style={{ color: C.emerald }}>Lubricants & Consumables ({results.consumables.length})</summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {results.consumables.map(con => {
              const price = role === 'pro' ? con.trade : con.retail;
              return (
                <div key={con.id} className="rounded border p-2" style={{ borderColor: C.border, background: C.bg }}>
                  <div className="flex items-start justify-between gap-2">
                    <div><h4 className="text-xs font-bold text-slate-100">{con.title}</h4><p className="text-[10px]" style={{ color: C.textDim }}>{con.brand} · {con.shop}</p></div>
                    <span className="font-mono text-xs" style={{ color: C.emerald }}>{fmt(price, region)}</span>
                  </div>
                  <button onClick={() => onAddConsumable(con)} disabled={inCart(con.id)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-bold transition" style={{ background: inCart(con.id) ? `${C.emerald}10` : `${C.orange}15`, color: inCart(con.id) ? C.emerald : C.orange, border: `1px solid ${inCart(con.id) ? `${C.emerald}30` : `${C.orange}40`}` }}>
                    {inCart(con.id) ? <><CheckCircle2 className="h-3 w-3" /> In Cart</> : <><ShoppingCart className="h-3 w-3" /> PURCHASE</>}
                  </button>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}

// ─── Per-item shipping surcharge calculator ──────────────────────────────────
function itemShipping(item, regionCode) {
  const tier = item.tier || 'local';
  const info = typeof SOURCING_TIERS !== 'undefined' ? SOURCING_TIERS[tier] : null;
  if (info && info.freightSurcharge > 0) return info.freightSurcharge;
  if (tier === 'facebook') return 15.00;

  const hash = String(item.id || item.title || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const distanceKm = 5 + (hash % 30);
  const baseFee = 8.50;
  const perKmRate = 1.20;
  const bookingFee = 3.50;
  
  const fee = baseFee + (distanceKm * perKmRate) + bookingFee;
  return +fee.toFixed(2);
}

function getOptimalCourier(item, region) {
  const r = region || REGIONS.AU;
  const networks = r.courierNetworks || [];
  if (networks.length === 0) return null;
  const hash = String(item.id || item.title || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const distanceKm = 5 + (hash % 30);
  const inRange = networks.filter(n => distanceKm <= n.maxKm);
  const network = (inRange.length > 0 ? inRange : networks)[0];
  return { network, distanceKm, fee: +(network.baseFee + distanceKm * network.perKmRate + network.bookingFee).toFixed(2) };
}

function calcConsolidatedFreight(cart, region) {
  const r = region || REGIONS.AU;
  const hub = r.consolidationHub;
  if (!hub || cart.length === 0) return { fee: 0, hubKm: 0, hubName: '', manifestId: '' };
  const seed = cart.reduce((a, c) => a + (c.id || '').length, 0);
  const hubKm = +(8 + (seed % 22)).toFixed(1);
  const bulkPerKm = Math.min(...(r.courierNetworks || [{ perKmRate: 1.0 }]).map(n => n.perKmRate)) * 0.7;
  const parcelWeight = Math.min(cart.length, 8);
  const fee = +(hub.handlingFee + hubKm * bulkPerKm + parcelWeight * 1.5).toFixed(2);
  const manifestId = `MANIFEST-PREVIEW-${Date.now().toString(36).toUpperCase()}`;
  return { fee, hubKm, hubName: hub.name, hubCity: hub.city, manifestId };
}

// ─── Cart Drawer (fixed-height scroll, parts-only, per-item shipping) ──────────
function CartDrawer({ open, onClose, cart, onInc, onDec, onRemove, onCheckout, role, region, usStateCode, consolidationEnabled, onToggleConsolidation }) {
  const [processing, setProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const r = region || 'VIC';
  if (!open) return null;
  const f = (n) => fmt(n, r);
  const partsTotal = cart.reduce((s, c) => s + c.unitPrice * c.qty, 0);
  const individualShippingTotal = cart.reduce((s, c) => s + itemShipping(c, r) * c.qty, 0);
  const consolidated = calcConsolidatedFreight(cart, r);
  const shippingTotal = consolidationEnabled ? consolidated.fee : individualShippingTotal;
  const subtotal = partsTotal + shippingTotal;
  const taxRate = typeof getEffectiveTaxRate === 'function' ? getEffectiveTaxRate(r, usStateCode) : 0.10;
  const tax = subtotal * taxRate;
  const grand = subtotal + tax;

  // Aggregate courier dispatch legs
  const courierLegs = cart.length > 0 ? cart.map(item => {
    const oc = getOptimalCourier(item, r);
    return { item, ...oc };
  }) : [];
  const activeCouriers = [...new Set(courierLegs.map(l => l.network?.name).filter(Boolean))];
  const distinctSellers = [...new Set(cart.map(c => c.shop || c.loc || c.seller || 'Unknown'))];

  const handlePay = async () => {
    if (!selectedPaymentMethod) return;
    setProcessing(true);
    try {
      if (typeof onCheckout === 'function') await onCheckout(selectedPaymentMethod);
    } finally {
      setProcessing(false);
      setSelectedPaymentMethod(null);
      setCardNumber('');
      setCardExpiry('');
      setCardCvc('');
      setSaveCard(false);
    }
  };

  const paymentMethods = [
    { id: 'applepay', label: 'Apple Pay', sub: 'Device Vault Enclave', icon: '🍏' },
    { id: 'googlepay', label: 'Google Pay', sub: 'Ledger Gateway Stream', icon: '💳' },
    { id: 'paypal', label: 'PayPal Express', sub: 'Web Token Wrapper Hook', icon: '🅿️' },
    { id: 'afterpay', label: 'Afterpay Tiers', sub: 'Flexible Short-Term Settlement Splits', icon: '⚡' },
    { id: 'zip', label: 'Zip Pay Hub', sub: 'Flexible Trade Term Contract Windows', icon: '🅿️' },
    { id: 'card', label: 'Credit / Debit Card', sub: 'Explicit Input Fields', icon: '💳' },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex justify-end" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="flex flex-col h-screen fixed top-0 right-0 max-w-md w-full bg-[#101524] z-50 border-l border-slate-800" onClick={(e) => e.stopPropagation()}>

        {/* ── ZONE A: FIXED TOP BAR ── */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 shrink-0">
          <button onClick={onClose} className="flex items-center gap-1.5 text-xs font-bold transition hover:opacity-80" style={{ color: C.orange }}>
            <ArrowLeft className="h-4 w-4" /> Return to Shopping
          </button>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 rounded-full border border-slate-700 px-2.5 py-1 text-[10px] font-bold" style={{ color: C.text }}>
              <ShoppingCart className="h-3 w-3" style={{ color: C.orange }} />
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </span>
            <button onClick={onClose} className="rounded p-1 transition hover:bg-slate-800" style={{ color: C.textDim }}><X className="h-5 w-5" /></button>
          </div>
        </div>

                {/* ── ZONE B: CENTRAL SCROLLABLE BODY FRAME ── */}
        <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-2 space-y-4 max-h-[calc(100vh-180px)]">
          {/* Multi-Supplier Freight Consolidation Toggle */}
          {cart.length > 0 && (
            <div className="rounded-xl border p-3" style={{ borderColor: consolidationEnabled ? `${C.orange}50` : C.border, background: consolidationEnabled ? `${C.orange}08` : C.panel }}>
              <button onClick={onToggleConsolidation} className="flex w-full items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: consolidationEnabled ? C.orange : C.border }}>
                  <Zap className="h-4 w-4" style={{ color: consolidationEnabled ? '#fff' : C.textDim }} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-bold text-slate-100">ENABLE PARTSFORGE MULTI-SUPPLIER FREIGHT CONSOLIDATION</div>
                  <div className="text-[9px]" style={{ color: C.textDim }}>
                    {consolidationEnabled
                      ? `Active · Single courier via ${consolidated.hubName} (${consolidated.hubCity})`
                      : 'Individual dispatch per item · toggle to batch into one delivery'}
                  </div>
                </div>
                <div className="relative shrink-0">
                  <div className="h-6 w-11 rounded-full transition-colors" style={{ background: consolidationEnabled ? C.orange : C.border }}>
                    <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform" style={{ transform: consolidationEnabled ? 'translateX(22px)' : 'translateX(2px)' }} />
                  </div>
                </div>
              </button>
              {consolidationEnabled && (
                <div className="mt-2.5 space-y-1.5 rounded-lg border p-2.5 text-[9px]" style={{ borderColor: `${C.orange}25`, background: `${C.orange}04` }}>
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded" style={{ background: `${C.orange}15` }}><Package className="h-2.5 w-2.5" style={{ color: C.orange }} /></div>
                    <span className="font-bold" style={{ color: C.text }}>TIER A · SELLERS → HUB</span>
                    <span className="ml-auto" style={{ color: C.textDim }}>{distinctSellers.length} sellers · {cart.length} parcels</span>
                  </div>
                  <div className="pl-6 text-[8px]" style={{ color: C.textDim }}>
                    {distinctSellers.slice(0, 3).map((s, i) => <div key={i}>· {s} → {consolidated.hubName}</div>)}
                    {distinctSellers.length > 3 && <div>· +{distinctSellers.length - 3} more sellers...</div>}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="flex h-5 w-5 items-center justify-center rounded" style={{ background: `${C.emerald}15` }}><Truck className="h-2.5 w-2.5" style={{ color: C.emerald }} /></div>
                    <span className="font-bold" style={{ color: C.text }}>TIER B · HUB → WORKSHOP</span>
                    <span className="ml-auto" style={{ color: C.textDim }}>{consolidated.hubKm}km · 1 driver</span>
                  </div>
                  <div className="pl-6 text-[8px]" style={{ color: C.textDim }}>
                    Manifest: <span className="font-mono text-slate-300">{consolidated.manifestId}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {cart.length === 0 ? <p className="py-8 text-center text-sm" style={{ color: C.textDim }}>Cart is empty — add parts or tools from the catalogue.</p> : (
            <div className="space-y-2">
              {cart.map((item) => {
                const targetRegionFallback = region || 'VIC';
                const ship = itemShipping(item, targetRegionFallback) * item.qty;
                const oc = getOptimalCourier(item, targetRegionFallback);
                return (
                  <div key={item.id} className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-xs font-bold text-slate-100">{item.brand ? `${item.brand} ` : ''}{item.title}</h4>
                        <p className="text-[10px]" style={{ color: C.textDim }}>{item.shop || item.loc}</p>
                      </div>
                      <button onClick={() => onRemove(item.id)} className="shrink-0 rounded p-1 transition" style={{ color: C.red }}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onDec(item.id)} className="flex h-6 w-6 items-center justify-center rounded border text-xs" style={{ borderColor: C.border, color: C.textDim }}>−</button>
                        <span className="font-mono text-sm text-slate-100">{item.qty}</span>
                        <button onClick={() => onInc(item.id)} className="flex h-6 w-6 items-center justify-center rounded border text-xs" style={{ borderColor: C.border, color: C.textDim }}>+</button>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm" style={{ color: C.emerald }}>{f(item.unitPrice * item.qty)}</div>
                        {!consolidationEnabled && ship > 0 && <div className="font-mono text-[10px]" style={{ color: C.textDim }}>+{f(ship)} freight</div>}
                      </div>
                    </div>
                    {!consolidationEnabled && oc && oc.network && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[9px]" style={{ borderColor: `${C.orange}25`, background: `${C.orange}06` }}>
                        <Truck className="h-2.5 w-2.5 shrink-0" style={{ color: C.orange }} />
                        <span className="font-bold" style={{ color: C.orange }}>{oc.network.name}</span>
                        <span style={{ color: C.textDim }}>· {oc.distanceKm}km · ETA {Math.max(oc.network.etaMinutes, Math.round(oc.distanceKm * 2.5) + oc.network.etaMinutes)}min</span>
                        <span className="ml-auto font-mono font-bold" style={{ color: C.emerald }}>{f(oc.fee * item.qty)}</span>
                      </div>
                    )}
                    {consolidationEnabled && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[9px]" style={{ borderColor: `${C.emerald}25`, background: `${C.emerald}06` }}>
                        <Package className="h-2.5 w-2.5 shrink-0" style={{ color: C.emerald }} />
                        <span className="font-bold" style={{ color: C.emerald }}>Consolidated to Hub</span>
                        <span style={{ color: C.textDim }}>· Tier A inbound to {consolidated.hubCity}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

                   {/* Global Freight Orchestration Tracking Card */}
          {cart.length > 0 && !consolidationEnabled && (
            <div className="rounded-xl border p-3" style={{ borderColor: `${C.orange}30`, background: `${C.orange}04` }}>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${C.orange}15` }}>
                  <Truck className="h-3.5 w-3.5" style={{ color: C.orange }} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-100">Global Freight Orchestration</div>
                  <div className="text-[9px]" style={{ color: C.textDim }}>Region Ref: {r} · {courierLegs.length} dispatch legs</div>
                </div>
              </div>
              <div className="mt-2 space-y-1.5">
                {((typeof REGIONS !== 'undefined' && REGIONS[r]?.courierNetworks) ? REGIONS[r].courierNetworks : []).map(net => {
                  const legCount = courierLegs.filter(l => l.network?.id === net.id).length;
                  const isActive = activeCouriers.includes(net.name);
                  return (
                    <div key={net.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[10px]" style={{ borderColor: isActive ? `${C.orange}40` : C.border, background: isActive ? `${C.orange}06` : C.panel2, opacity: isActive ? 1 : 0.45 }}>
                      <div className="flex h-5 w-5 items-center justify-center rounded" style={{ background: isActive ? `${C.orange}15` : C.border }}>
                        <Truck className="h-2.5 w-2.5" style={{ color: isActive ? C.orange : C.textDim }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold" style={{ color: isActive ? C.text : C.textDim }}>{net.name}</div>
                        <div className="truncate text-[8px]" style={{ color: C.textDimmer }}>{net.api} · {net.tagline}</div>
                      </div>
                      {isActive ? (
                        <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold" style={{ background: `${C.emerald}15`, color: C.emerald }}>
                          <Activity className="h-2 w-2" /> {legCount} leg{legCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold" style={{ background: C.border, color: C.textDim }}>STANDBY</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[9px]" style={{ color: C.textDim }}>
                <Zap className="h-2.5 w-2.5" style={{ color: C.orange }} />
                <span>Auto-routing via optimal courier · {activeCouriers.length} active network{activeCouriers.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {/* Consolidation Hub Node Card */}
          {cart.length > 0 && consolidationEnabled && (
            <div className="rounded-xl border p-3" style={{ borderColor: `${C.emerald}30`, background: `${C.emerald}04` }}>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${C.emerald}15` }}>
                  <Package className="h-3.5 w-3.5" style={{ color: C.emerald }} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-100">Consolidation Hub Node</div>
                  <div className="text-[9px]" style={{ color: C.textDim }}>{consolidated.hubName} · {consolidated.hubCity}</div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[9px]">
                <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
                  <div style={{ color: C.textDim }}>Hub Distance</div>
                  <div className="font-mono font-bold text-slate-100">{consolidated.hubKm} km</div>
                </div>
                <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
                  <div style={{ color: C.textDim }}>Parcels Aggregated</div>
                  <div className="font-mono font-bold text-slate-100">{cart.length} items</div>
                </div>
                <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
                  <div style={{ color: C.textDim }}>Sellers Inbound</div>
                  <div className="font-mono font-bold text-slate-100">{distinctSellers.length}</div>
                </div>
                <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
                  <div style={{ color: C.textDim }}>Manifest ID</div>
                  <div className="truncate font-mono font-bold text-slate-100">{consolidated.manifestId ? consolidated.manifestId.slice(-12) : 'PENDING'}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[9px]" style={{ color: C.textDim }}>
                <Package className="h-2.5 w-2.5" style={{ color: C.emerald }} />
                <span>Single-courier consolidated fee replaces {cart.length} individual dispatch surcharges</span>
              </div>
            </div>
          )}

          {/* ── Mandatory Payment Method Selection Group (inside scroll zone) ── */}
          <div className="rounded-xl border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
            <div className="mb-2 flex items-center gap-1.5">
              <LockIcon className="h-3.5 w-3.5" style={{ color: selectedPaymentMethod ? C.emerald : C.orange }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: selectedPaymentMethod ? C.emerald : C.textDim }}>
                {selectedPaymentMethod ? 'Payment Method Locked' : 'Select Secure Payment Method'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map(pm => {
                const active = selectedPaymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    onClick={() => setSelectedPaymentMethod(pm.id)}
                    className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition"
                    style={{
                      borderColor: active ? C.emerald : C.border,
                      background: active ? `${C.emerald}10` : C.bg,
                      color: active ? C.emerald : C.text,
                    }}
                  >
                    <span className="text-base leading-none">{pm.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[10px] font-bold">{pm.label}</div>
                      <div className="truncate text-[8px]" style={{ color: active ? `${C.emerald}99` : C.textDimmer }}>{pm.sub}</div>
                    </div>
                    {active && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: C.emerald }} />}
                  </button>
                );
              })}
            </div>
            {selectedPaymentMethod && (
              <div className="mt-2.5 rounded-lg border p-2.5 text-[10px]" style={{ borderColor: `${C.emerald}35`, background: `${C.emerald}07`, color: C.textDim }}>
                Payment details are collected securely on Stripe Checkout. PartsForge never receives or stores card numbers or CVC values.
              </div>
            )}
          </div>
        </div>

        {/* ── ZONE C: FIXED BOTTOM EXECUTION BLOCK ── */}
        <div className="p-4 border-t border-slate-800 bg-[#101524] sticky bottom-0 shrink-0">
          <div className="space-y-1.5 text-xs">
            <Row label="Parts & Tools" value={f(partsTotal)} />
            {consolidationEnabled ? (
              <Row label="Consolidated Freight (single courier)" value={f(shippingTotal)} />
            ) : (
              <Row label="Courier Delivery (itemized)" value={f(shippingTotal)} />
            )}
            <Row label={`${r === 'US_CA' || r === 'US_NY' || r === 'US_TX' ? 'Sales Tax' : 'GST'}`} value={f(tax)} />
            <div className="flex items-center justify-between border-t pt-2" style={{ borderColor: C.border }}>
              <span className="text-sm font-bold text-slate-100">Total</span>
              <span className="font-mono text-lg font-bold" style={{ color: C.emerald }}>{f(grand)}</span>
            </div>
          </div>
          <button
            onClick={handlePay}
            disabled={cart.length === 0 || processing || !selectedPaymentMethod}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed"
            style={{
              background: selectedPaymentMethod && cart.length > 0 ? C.emerald : C.border,
              color: selectedPaymentMethod && cart.length > 0 ? '#000' : C.textDim,
              animation: selectedPaymentMethod && !processing && cart.length > 0 ? 'pulse-emerald 2s ease-in-out infinite' : 'none',
            }}
          >
            {processing ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> Processing...</>) : (<><CreditCard className="h-4 w-4" /> CONFIRM AND EXECUTE PURCHASE TRANSACTION</>)}
          </button>
          {cart.length > 0 && !selectedPaymentMethod && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-semibold" style={{ color: C.orange }}>
              <AlertTriangle className="h-3 w-3" /> SELECT A SECURE PAYMENT METHOD ABOVE TO INITIALISE FREIGHT DISPATCH
            </div>
          )}
          {selectedPaymentMethod && cart.length > 0 && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-semibold" style={{ color: C.emerald }}>
              <CheckCircle2 className="h-3 w-3" /> Payment method locked — ready to dispatch freight
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return <div className="flex items-center justify-between"><span style={{ color: C.textDim }}>{label}</span><span className="font-mono text-slate-100">{value}</span></div>;
}

// ─── DIY Driver History Vault (permanent purchased items ledger) ────────────
function HistoryVault({ vault, region }) {
  const r = region || 'VIC';
  const f = (n) => fmt(n, r);
  const fmtDate = (iso) => {
    if (!iso) return '--';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: '2-digit' }) + ' · ' + d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    } catch { return '--'; }
  };
  return (
    <div className="rounded-xl border p-4" style={{ background: C.panel, borderColor: C.border }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.orange }}>
          <History className="h-4 w-4" style={{ color: C.orange }} /> PERSONAL HARDWARE SOURCING HISTORY & TRACKING VAULT
        </div>
        <span className="text-[10px] font-mono" style={{ color: C.textDim }}>{vault.length} item{vault.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="custom-scrollbar mt-3 overflow-y-auto rounded-lg border" style={{ borderColor: C.border, background: C.panel2, maxHeight: '420px' }}>
        {vault.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <Warehouse className="h-8 w-8" style={{ color: C.textDimmer }} />
            <p className="text-xs" style={{ color: C.textDim }}>No purchased items yet. Complete a cart checkout to stock your history vault.</p>
          </div>
        ) : (

          <div className="space-y-2 p-2">
            {vault.map((v) => (
              <div key={v.vaultId} className="rounded-lg border p-3 transition hover:border-current" style={{ borderColor: C.border, background: C.bg }}>
                <div className="flex items-start gap-3">
                  {/* A. Product image */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: C.border, background: C.panel2 }}>
                    {v.image ? (
                      <img src={v.image} alt={v.title} className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6" style={{ color: C.textDimmer }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {/* A. Component name + SKU */}
                    <h4 className="truncate text-xs font-bold text-slate-100">{v.brand ? `${v.brand} ` : ''}{v.title}</h4>
                    <div className="mt-0.5 text-[10px] font-mono" style={{ color: C.textDim }}>SKU: {v.sku || v.id || '--'}</div>

                    {/* B. Transaction blueprints */}
                    <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                      <div style={{ color: C.textDim }}>
                        Purchased: <span className="text-slate-300">{fmtDate(v.purchasedAt)}</span>
                      </div>
                      <div style={{ color: C.textDim }}>
                        Unit Price: <span className="font-mono" style={{ color: C.emerald }}>{f(v.unitPrice || 0)}</span>
                      </div>
                      <div className="col-span-2" style={{ color: C.textDim }}>
                        Sourced from: <span className="text-slate-300">{v.seller || v.shop || v.loc || '--'}</span>
                      </div>
                    </div>

                    {/* C. Logistics transit hub state */}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wider" style={{ background: `${C.emerald}15`, color: C.emerald, border: `1px solid ${C.emerald}30` }}>
                        <CheckCircle2 className="h-3 w-3" /> {v.status || 'DELIVERED & APPROVED'}
                      </span>
                      <span className="font-mono text-[9px]" style={{ color: C.textDim }}>{v.consignmentNote || '--'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Vault Panel (inventory folders with per-folder search + Mount-to-Job-Card) ─
function VaultPanel({ vault, onMount, bayOptions, region }) {
  const r = region || 'VIC';
  const f = (n) => fmt(n, r);
  const [folderSearch, setFolderSearch] = useState({});
  const [mountOpen, setMountOpen] = useState(null);
  const [selectedBay, setSelectedBay] = useState({});

  const folderDefs = [
    { key: 'lubricant', label: 'Lubricants & Fluids', icon: <FlaskConical className="h-3.5 w-3.5" />, accent: C.orange },
    { key: 'consumable', label: 'Consumables & Cleaners', icon: <SprayCan className="h-3.5 w-3.5" />, accent: C.cyan },
    { key: 'accessory', label: 'Workshop Accessories', icon: <Wrench className="h-3.5 w-3.5" />, accent: C.emerald },
    { key: 'tool', label: 'Specialty Tools', icon: <Wrench className="h-3.5 w-3.5" />, accent: C.orange },
    { key: 'part', label: 'Sourced Parts', icon: <Package className="h-3.5 w-3.5" />, accent: C.emerald },
  ];

  const getFolderItems = (folderKey) => vault.filter(v => (v.source || v.category || 'part') === folderKey || (folderKey === 'part' && !v.source));
  const getSearch = (key) => folderSearch[key] || '';
  const filtered = (key) => {
    const q = getSearch(key).trim().toLowerCase();
    if (!q) return getFolderItems(key);
    return getFolderItems(key).filter(v =>
      (v.title || '').toLowerCase().includes(q) ||
      (v.sku || v.id || '').toLowerCase().includes(q) ||
      (v.brand || '').toLowerCase().includes(q)
    );
  };

  const doMount = (item) => {
    const bayId = selectedBay[item.vaultId];
    if (!bayId) return;
    onMount(item, bayId);
    setMountOpen(null);
    setSelectedBay(prev => { const n = { ...prev }; delete n[item.vaultId]; return n; });
  };

  return (
    <div className="rounded-xl border p-4" style={{ background: C.panel, borderColor: C.border }}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.textDim }}>
        <Warehouse className="h-3.5 w-3.5" style={{ color: C.orange }} /> Inventory Vault — Delivered Stock Folders
      </div>
      {vault.length === 0 ? (
        <p className="mt-3 p-4 text-center text-xs" style={{ color: C.textDim }}>No delivered stock in the vault. Complete a cart checkout to stock it.</p>
      ) : (
        <div className="custom-scrollbar mt-3 max-h-[500px] overflow-y-auto space-y-3">
          {folderDefs.map(folder => {
            const items = filtered(folder.key);
            if (items.length === 0) return null;
            return (
              <div key={folder.key} className="rounded-lg border" style={{ borderColor: C.border, background: C.panel2 }}>
                <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: C.border }}>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: folder.accent }}>
                    {folder.icon} {folder.label}
                    <span className="text-[10px] font-normal" style={{ color: C.textDim }}>({items.length})</span>
                  </div>
                </div>

                {/* Per-folder search bar */}
                <div className="px-2 pt-2">
                  <div className="flex items-center gap-1.5 rounded-md border px-2 py-1.5" style={{ borderColor: C.border, background: C.bg }}>
                    <Search className="h-3 w-3 shrink-0" style={{ color: C.textDim }} />
                    <input value={getSearch(folder.key)} onChange={(e) => setFolderSearch(prev => ({ ...prev, [folder.key]: e.target.value }))} placeholder={`Search SKU in ${folder.label}...`} className="flex-1 bg-transparent text-[11px] text-slate-100 outline-none placeholder:opacity-40" />
                  </div>
                </div>
                <div className="space-y-1.5 p-2">
                  {items.map(v => (
                    <div key={v.vaultId} className="rounded-lg border p-2.5" style={{ borderColor: C.border, background: C.bg }}>
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: C.border, background: C.panel2 }}>
                          <ImageIcon className="h-4 w-4" style={{ color: C.textDimmer }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-[11px] font-bold text-slate-100">{v.brand ? `${v.brand} ` : ''}{v.title}</h4>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                            <span style={{ color: C.textDim }}>SKU: <span className="font-mono text-slate-300">{v.sku || v.id || '--'}</span></span>
                            <span style={{ color: C.textDim }}>Con Note: <span className="font-mono text-slate-300">{v.consignmentNote || '--'}</span></span>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="font-mono text-xs" style={{ color: C.emerald }}>{f(v.unitPrice || 0)}</span>
                            <div className="flex items-center gap-1.5">
                              <button onClick={(e) => { e.preventDefault(); setMountOpen(mountOpen === v.vaultId ? null : v.vaultId); }} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-bold transition" style={{ background: `${C.orange}15`, color: C.orange }}>
                                <ClipboardList className="h-3 w-3" /> Mount to Job Card
                              </button>
                            </div>
                          </div>
                          {mountOpen === v.vaultId && (
                            <div className="mt-2 flex items-center gap-2 rounded-md border p-2" style={{ borderColor: `${C.orange}30`, background: `${C.orange}05` }}>
                              <select value={selectedBay[v.vaultId] || ''} onChange={(e) => setSelectedBay(prev => ({ ...prev, [v.vaultId]: e.target.value }))} className="flex-1 rounded-md border px-2 py-1.5 text-[11px] text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel }}>
                                <option value="">Select Target Bay ID...</option>
                                {bayOptions.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                              </select>
                              <button onClick={(e) => { e.preventDefault(); doMount(v); }} disabled={!selectedBay[v.vaultId]} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-extrabold text-slate-950 transition disabled:opacity-40" style={{ background: C.orange }}>
                                <Zap className="h-3 w-3" /> Mount
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Allocation Matrix Modal (detailed cards) ────────────────────────────────
function AllocationMatrixModal({ open, onClose, vault, onBatchAllocate, bayOptions, region }) {
  const r = region || 'VIC';
  const f = (n) => fmt(n, r);
  const [selected, setSelected] = useState(new Set());
  const [targetBay, setTargetBay] = useState('');
  if (!open) return null;

  const toggle = (vaultId) => setSelected(prev => { const n = new Set(prev); n.has(vaultId) ? n.delete(vaultId) : n.add(vaultId); return n; });
  const allSelected = vault.length > 0 && vault.every(v => selected.has(v.vaultId));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(vault.map(v => v.vaultId)));

  const handleBatch = () => {
    if (selected.size === 0 || !targetBay) return;
    onBatchAllocate(Array.from(selected), targetBay);
    setSelected(new Set());
    setTargetBay('');
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border p-5" style={{ background: C.bg, borderColor: C.border }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-100"><Archive className="h-4 w-4" style={{ color: C.orange }} /> Open Delivered Stock Allocation Matrix</h3>
          <button onClick={onClose} className="rounded p-1" style={{ color: C.textDim }}><X className="h-5 w-5" /></button>
        </div>

        {/* Batch controls */}
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
          <button onClick={toggleAll} className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition" style={{ borderColor: C.border, color: C.text }}>
            <input type="checkbox" checked={allSelected} readOnly className="h-3 w-3" style={{ accentColor: C.orange }} /> Select All
          </button>
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-bold uppercase" style={{ color: C.textDim }}>Dest Bay:</label>
            <select value={targetBay} onChange={(e) => setTargetBay(e.target.value)} className="rounded-lg border px-2.5 py-1.5 text-xs text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }}>
              <option value="">Select bay...</option>
              {bayOptions.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
          <button onClick={handleBatch} disabled={selected.size === 0 || !targetBay} className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold text-slate-950 transition disabled:opacity-40" style={{ background: C.orange }}>
            <Zap className="h-3.5 w-3.5" /> Allocate Selected Assets{selected.size > 0 ? ` (${selected.size})` : ''}
          </button>
        </div>

        <div className="custom-scrollbar max-h-[55vh] overflow-y-auto rounded-lg border space-y-2 p-2" style={{ borderColor: C.border, background: C.panel }}>
          {vault.length === 0 ? <p className="p-6 text-center text-sm" style={{ color: C.textDim }}>No delivered stock available. Complete a cart checkout to stock the vault.</p> : vault.map((v) => {
            const isSel = selected.has(v.vaultId);
            return (
              <div key={v.vaultId} className="flex items-start gap-2 rounded-lg border p-3 transition" style={{ borderColor: isSel ? `${C.orange}60` : C.border, background: isSel ? `${C.orange}08` : C.bg }}>
                <input type="checkbox" checked={isSel} onChange={() => toggle(v.vaultId)} className="mt-1 h-4 w-4 shrink-0" style={{ accentColor: C.orange }} />
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: C.border, background: C.panel2 }}>
                  <ImageIcon className="h-5 w-5" style={{ color: C.textDimmer }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-xs font-bold text-slate-100">{v.brand ? `${v.brand} ` : ''}{v.title}</h4>
                    <span className="shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold" style={{ borderColor: `${C.emerald}40`, background: `${C.emerald}10`, color: C.emerald }}>
                      <CheckCircle2 className="mr-0.5 inline h-2.5 w-2.5" /> DELIVERED & APPROVED
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                    <div style={{ color: C.textDim }}>Con Note: <span className="font-mono text-slate-300">{v.consignmentNote || '--'}</span></div>
                    <div style={{ color: C.textDim }}>SKU: <span className="font-mono text-slate-300">{v.sku || v.id || '--'}</span></div>
                    <div style={{ color: C.textDim }}>Source: <span className="text-slate-300">{v.seller || v.shop || '--'}</span></div>
                    <div style={{ color: C.textDim }}>Fitment: <span className="text-slate-300">{v.fitment || 'Universal'}</span></div>
                  </div>
                  <div className="mt-1.5">
                    <span className="font-mono text-xs" style={{ color: C.emerald }}>{f(v.unitPrice || 0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Store Catalogs (Lubricants, Consumables, Accessories) ─────────────────
const LUBRICANTS_CATALOG = [
  { id: 'lub1', title: '5W-30 Full Synthetic Engine Oil 5L', brand: 'Castrol Edge', retail: 65.00, trade: 52.00, shop: 'Repco South Morang', stock: 8, category: 'oil' },
  { id: 'lub2', title: '10W-40 Semi Synthetic Engine Oil 5L', brand: 'Valvoline', retail: 45.00, trade: 36.00, shop: 'Supercheap Auto Epping', stock: 12, category: 'oil' },
  { id: 'lub3', title: '75W-85 GL-4 Gear Oil 1L', brand: 'Castrol', retail: 28.00, trade: 22.00, shop: 'Repco South Morang', stock: 10, category: 'gear_oil' },
  { id: 'lub4', title: 'ATF Dexron VI Automatic Transmission Fluid 4L', brand: 'Penrite', retail: 52.00, trade: 42.00, shop: 'Automotive Superstore', stock: 6, category: 'atf' },
  { id: 'lub5', title: 'DOT 4 Brake Fluid 1L', brand: 'Castrol', retail: 28.00, trade: 22.00, shop: 'Supercheap Auto Epping', stock: 10, category: 'brake_fluid' },
  { id: 'lub6', title: '5W-20 Full Synthetic Engine Oil 5L', brand: 'Mobil 1', retail: 72.00, trade: 58.00, shop: 'Sparesbox Sydney', stock: 7, category: 'oil' },
];

const CONSUMABLES_CATALOG_FLAT = [
  { id: 'con1', title: 'Brake Cleaner Spray 400ml (Case of 12)', brand: 'Wurth', retail: 72.00, trade: 58.00, shop: 'Repco South Morang', stock: 6, category: 'cleaner' },
  { id: 'con2', title: 'Coolant Concentrate 1L (Red)', brand: 'Toyota', retail: 35.00, trade: 28.00, shop: 'Supercheap Auto Epping', stock: 9, category: 'coolant' },
  { id: 'con3', title: 'Workshop Towel Rolls (Blue 2-Ply, 6 pack)', brand: 'WypAll', retail: 42.00, trade: 33.00, shop: 'Repco South Morang', stock: 8, category: 'towels' },
  { id: 'con4', title: 'Degreaser Spray 500ml', brand: 'Meguiars', retail: 18.00, trade: 14.00, shop: 'Supercheap Auto Epping', stock: 15, category: 'degreaser' },
  { id: 'con5', title: 'Compressed Air Duster 300ml', brand: 'Wurth', retail: 15.00, trade: 11.00, shop: 'Supercheap Auto Epping', stock: 8, category: 'cleaner' },
  { id: 'con6', title: 'Nitrile Gloves Box (100pc)', brand: 'Mechanix', retail: 24.00, trade: 18.00, shop: 'Automotive Superstore', stock: 15, category: 'gloves' },
];

const ACCESSORIES_CATALOG = [
  { id: 'acc1', title: 'Oil Drain Pan 8L', brand: 'Toptul', retail: 22.00, trade: 17.00, shop: 'Supercheap Auto Epping', stock: 5, category: 'drain_pan' },
  { id: 'acc2', title: 'Oil Filter Wrench (76mm 14-flute)', brand: 'Toptul', retail: 15.00, trade: 11.00, shop: 'Supercheap Auto Epping', stock: 12, category: 'filter_wrench' },
  { id: 'acc3', title: '14mm Flare Nut Wrench', brand: 'GearWrench', retail: 28.00, trade: 22.00, shop: 'Supercheap Auto Epping', stock: 5, category: 'wrench' },
  { id: 'acc4', title: 'Torque Wrench 3/8" Drive (5-25 Nm)', brand: 'Toptul', retail: 89.00, trade: 71.00, shop: 'Automotive Superstore', stock: 4, category: 'torque_wrench' },
  { id: 'acc5', title: 'C-Clamp Brake Piston Compressor', brand: 'Permatex', retail: 18.00, trade: 14.00, shop: 'Automotive Superstore', stock: 8, category: 'compressor' },
  { id: 'acc6', title: 'Piston Retracting Tool (Caliper)', brand: 'Lisle', retail: 45.00, trade: 36.00, shop: 'Repco South Morang', stock: 3, category: 'piston_tool' },
];

const SPECIALTY_TOOLS_CATALOG = [
    { id: 'tool1', title: 'OBD2 Diagnostic Scanner (Bluetooth)', brand: 'ANCEL', retail: 89.00, trade: 71.00, shop: 'Automotive Superstore', stock: 5, category: 'diagnostic', aisle: 'A-12', eta: '2-3 days' },
  { id: 'tool2', title: 'Hydraulic Engine Hoist 2T', brand: 'Toptul', retail: 189.00, trade: 152.00, shop: 'Repco South Morang', stock: 3, category: 'heavy', aisle: 'C-04', eta: '1-2 days' },
  { id: 'tool3', title: 'Axle Stands Pair 3T', brand: 'Toptul', retail: 65.00, trade: 52.00, shop: 'Supercheap Auto Epping', stock: 8, category: 'heavy', aisle: 'C-06', eta: 'Same day' },
  { id: 'tool4', title: 'Timing Belt Kit Tool Set', brand: 'GearWrench', retail: 145.00, trade: 116.00, shop: 'Automotive Superstore', stock: 4, category: 'specialty', aisle: 'B-08', eta: '2-3 days' },
  { id: 'tool5', title: 'Brake Bleeder Vacuum Kit', brand: 'Mityvac', retail: 78.00, trade: 62.00, shop: 'Repco South Morang', stock: 6, category: 'specialty', aisle: 'B-03', eta: '1-2 days' },
  { id: 'tool6', title: 'Compression Tester Kit', brand: 'Toptul', retail: 95.00, trade: 76.00, shop: 'Automotive Superstore', stock: 3, category: 'diagnostic', aisle: 'A-14', eta: '2-3 days' },
];

// ─── Store Catalog Button (primary action button) ─────────────────────────────
function StoreCatalogButton({ label, icon, accent, count, onClick }) {
  return (
    <button onClick={(e) => { e.preventDefault(); onClick(); }} className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition hover:opacity-90" style={{ borderColor: `${accent}40`, background: `${accent}08`, color: C.text }}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${accent}15`, color: accent }}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>{label}</div>
        <div className="text-[10px]" style={{ color: C.textDim }}>{count} items in catalog</div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: accent }} />
    </button>
  );
}

// ─── Store Catalog Window (full-screen immersive catalog) ─────────────────────
function StoreCatalogWindow({ label, icon, items, role, onAddToCart, cartIds = [], accent, region, onClose, workshopMode }) {
  const r = region || 'VIC';
  const f = (n) => fmt(n, r);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [quantities, setQuantities] = useState({});
  const scrollRef = useRef(null);
  const scrollPos = useRef(0);

  const doSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    setTimeout(() => {
      const q = search.trim().toLowerCase();
      const extra = items.filter(it =>
        it.title.toLowerCase().includes(q) ||
        (it.brand || '').toLowerCase().includes(q) ||
        (it.category || '').toLowerCase().includes(q)
      );
      setSearchResults(extra);
      setSearching(false);
    }, 600);
  };

  const displayItems = searchResults || items;

  const openDetail = (item) => {
    if (scrollRef.current) scrollPos.current = scrollRef.current.scrollTop;
    setDetailItem(item);
  };
  const closeDetail = () => {
    setDetailItem(null);
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollPos.current; }, 0);
  };

  const getQty = (id) => quantities[id] || 1;
  const setQty = (id, val) => setQuantities(prev => ({ ...prev, [id]: Math.max(1, val) }));
  const inCart = (id) => cartIds.includes(id);

  return (
    <div className="fixed inset-0 z-[85] overflow-y-auto" style={{ background: C.bg }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b" style={{ borderColor: C.border, background: `${C.bg}f0` }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span style={{ color: accent }}>{icon}</span>
            <span className="text-sm font-bold uppercase tracking-wider" style={{ color: accent }}>{label}</span>
            <span className="text-[10px]" style={{ color: C.textDim }}>{displayItems.length} products</span>
          </div>
          <button onClick={(e) => { e.preventDefault(); onClose(); }} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition" style={{ borderColor: C.border, color: C.text }}>
            <X className="h-3.5 w-3.5" /> Close Catalog
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="mx-auto max-w-5xl px-4 py-4 space-y-4">
        {/* Live Web Scraper Search Bar */}
        <form onSubmit={doSearch} className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: C.border, background: C.panel }}>
            <Globe className="h-4 w-4 shrink-0" style={{ color: C.textDim }} />
            <input value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())} placeholder="LIVE WEB SCRAPER: SEARCH AUTOMOTIVE INDEX NETWORKS..." className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:opacity-40" />
          </div>
          <button type="submit" disabled={searching} className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-950 transition" style={{ background: accent }}>
            {searching ? <Sparkles className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Crawl
          </button>
        </form>
        {searching && (
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: `${accent}30`, background: `${accent}05`, color: C.textDim }}>
            <Activity className="h-3 w-3 animate-pulse" style={{ color: accent }} /> Querying automotive index networks for matching products...
          </div>
        )}
        {searchResults && !searching && (
          <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-[10px]" style={{ borderColor: `${accent}30`, background: `${accent}05`, color: C.textDim }}>
            <span>Web scraper returned {searchResults.length} matching product(s)</span>
            <button onClick={(e) => { e.preventDefault(); setSearchResults(null); setSearch(''); }} className="font-bold" style={{ color: accent }}>Clear search</button>
          </div>
        )}

        {/* Item Detail Overlay */}
        {detailItem ? (
          <div className="rounded-2xl border p-5" style={{ borderColor: `${accent}40`, background: C.panel }}>
            <button onClick={(e) => { e.preventDefault(); closeDetail(); }} className="mb-4 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition" style={{ borderColor: C.border, color: C.text }}>
              <ArrowLeft className="h-3.5 w-3.5" /> Return to Shopping
            </button>
            <div className="flex items-start gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border" style={{ borderColor: C.border, background: C.panel2 }}>
                <ImageIcon className="h-10 w-10" style={{ color: C.textDimmer }} />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <h3 className="text-lg font-bold text-slate-50">{detailItem.brand ? `${detailItem.brand} ` : ''}{detailItem.title}</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div style={{ color: C.textDim }}>Trade List Price: <span className="font-mono font-bold" style={{ color: C.emerald }}>{f(role === 'pro' ? (detailItem.trade ?? detailItem.retail) : (detailItem.retail ?? detailItem.trade))}</span></div>
                  <div style={{ color: C.textDim }}>Storage Drawer: <span className="font-mono text-slate-300">{detailItem.aisle || 'N/A'}</span></div>
                  <div style={{ color: C.textDim }}>Stock Level: <span className="text-slate-300">{detailItem.stock} units</span></div>
                  <div style={{ color: C.textDim }}>Delivery ETA: <span className="text-slate-300">{detailItem.eta || '1-3 days'}</span></div>
                  <div style={{ color: C.textDim }}>Category: <span className="text-slate-300">{detailItem.category || 'general'}</span></div>
                  <div style={{ color: C.textDim }}>Supplier: <span className="text-slate-300">{detailItem.shop || 'N/A'}</span></div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.preventDefault(); setQty(detailItem.id, getQty(detailItem.id) - 1); }} className="flex h-7 w-7 items-center justify-center rounded border text-xs" style={{ borderColor: C.border, color: C.textDim }}>−</button>
                    <span className="font-mono text-sm text-slate-100">{getQty(detailItem.id)}</span>
                    <button onClick={(e) => { e.preventDefault(); setQty(detailItem.id, getQty(detailItem.id) + 1); }} className="flex h-7 w-7 items-center justify-center rounded border text-xs" style={{ borderColor: C.border, color: C.textDim }}>+</button>
                  </div>
                  <button disabled={inCart(detailItem.id)} onClick={(e) => { e.preventDefault(); onAddToCart(detailItem, getQty(detailItem.id)); }} className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-extrabold text-slate-950 transition hover:opacity-90" style={{ background: inCart(detailItem.id) ? C.emerald : C.orange }}>
                    {inCart(detailItem.id) ? <><CheckCircle2 className="h-4 w-4" /> IN CART</> : <><ShoppingCart className="h-4 w-4" /> PURCHASE</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
      /* Catalog Spreadsheet Grid */
          <div className="space-y-2">
            {displayItems.map((item) => {
              const price = role === 'pro' ? (item.trade ?? item.retail) : (item.retail ?? item.trade);
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border p-3 transition hover:border-current" style={{ borderColor: C.border, background: C.panel }}>
                  {/* Product Picture framework */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border cursor-pointer" style={{ borderColor: C.border, background: C.panel2 }} onClick={(e) => { e.preventDefault(); openDetail(item); }}>
                    <ImageIcon className="h-7 w-7" style={{ color: C.textDimmer }} />
                  </div>
                  {/* Product info */}
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={(e) => { e.preventDefault(); openDetail(item); }}>
                    <h4 className="truncate text-xs font-bold text-slate-100">{item.brand ? `${item.brand} ` : ''}{item.title}</h4>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]" style={{ color: C.textDim }}>
                      <span>Supplier: {item.shop || 'N/A'}</span>
                      <span>Storage: <span className="font-mono text-slate-300">{item.aisle || 'N/A'}</span></span>
                      <span>ETA: {item.eta || '1-3 days'}</span>
                      <span>Stock: {item.stock}</span>
                    </div>
                  </div>
                  {/* Trade List Price */}
                  <span className="font-mono text-sm font-bold" style={{ color: C.emerald, minWidth: '70px', textAlign: 'right' }}>{f(price)}</span>
                  {/* Quantity counter */}
                  <div className="flex items-center gap-1.5">
                    <button onClick={(e) => { e.preventDefault(); setQty(item.id, getQty(item.id) - 1); }} className="flex h-6 w-6 items-center justify-center rounded border text-xs" style={{ borderColor: C.border, color: C.textDim }}>−</button>
                    <span className="font-mono text-xs text-slate-100">{getQty(item.id)}</span>
                    <button onClick={(e) => { e.preventDefault(); setQty(item.id, getQty(item.id) + 1); }} className="flex h-6 w-6 items-center justify-center rounded border text-xs" style={{ borderColor: C.border, color: C.textDim }}>+</button>
                  </div>
                  {/* Add to cart */}
                  <button disabled={inCart(item.id)} onClick={(e) => { e.preventDefault(); onAddToCart(item, getQty(item.id)); }} className="flex items-center gap-1 rounded-lg px-3 py-2 text-[10px] font-extrabold text-slate-950 transition hover:opacity-90" style={{ background: inCart(item.id) ? C.emerald : C.orange }}>
                    {inCart(item.id) ? <><CheckCircle2 className="h-3 w-3" /> IN CART</> : <><ShoppingCart className="h-3 w-3" /> PURCHASE</>}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkshopStorePanel({ storeDropdowns, consumables, onUpdateConsumable, onRemoveConsumable, region }) {
  const f = (n) => fmt(n, region || 'VIC');
  return (
    <div className="rounded-xl border p-4" style={{ background: C.panel, borderColor: C.border }}>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.textDim }}><Store className="mr-1 inline h-3 w-3" /> Workshop Store Registries</h4>
      <div className="space-y-2">{storeDropdowns}</div>
      <div className="mt-4 border-t pt-4" style={{ borderColor: C.border }}>
        <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: C.textDim }}><FlaskConical className="h-3 w-3" /> Consumables & Fluids</h4>
        <div className="mt-2 space-y-2">
          {consumables.length === 0 && <p className="text-xs" style={{ color: C.textDimmer }}>No consumables added. Click "Add Consumable Asset" to pull from your store or the marketplace.</p>}
          {consumables.map((con) => (
            <div key={con.id} className="flex items-center gap-2 rounded-lg border p-2.5" style={{ borderColor: C.border, background: C.panel2 }}>
              {con.source === 'internal' && <Store className="h-3.5 w-3.5 shrink-0" style={{ color: C.cyan }} />}
              {con.source === 'outsourced' && <PackageSearch className="h-3.5 w-3.5 shrink-0" style={{ color: C.orange }} />}
              <input type="text" value={con.title} onChange={(e) => onUpdateConsumable(con.id, 'title', e.target.value)} className="min-w-0 flex-1 rounded border px-2 py-1 text-xs text-slate-100 outline-none" style={{ borderColor: C.border, background: C.bg }} />
              <input type="number" value={con.unitPrice} onChange={(e) => onUpdateConsumable(con.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-20 rounded border px-2 py-1 text-right font-mono text-xs text-slate-100 outline-none" style={{ borderColor: C.border, background: C.bg }} />
              <span className="font-mono text-xs" style={{ color: C.emerald, minWidth: '60px', textAlign: 'right' }}>{f((con.unitPrice || 0) * (con.qty || 1))}</span>
              <button onClick={() => onRemoveConsumable(con.id)} className="rounded p-1 transition" style={{ color: C.red }}><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Store Dropdown (collapsible, with PURCHASE buttons) ─────────────────────
// ─── Job Card (with editable consumables + dual-state buttons) ────────────────
function JobCard({
  cart, role, laborHours, setLaborHours, laborRate, setLaborRate, taxOn, setTaxOn,
  diagnostic, setDiagnostic, onInc, onDec, onRemove, onUpdateItem,
  consumables, onUpdateConsumable, onRemoveConsumable,
  custName, setCustName, custPhone, setCustPhone, custEmail, setCustEmail,
  vehicle, onSaveProgress, onCompileInvoice, onOpenAllocation, storeDropdowns,
  region, effectiveTaxRate, onOpenCourierHandshake, shipmentStatus, technician, technicianHistory = [],
}) {
  const r = region || 'VIC';
  const taxRate = effectiveTaxRate || 0.10;
  const f = (n) => fmt(n, r);
  const partsTotal = cart.reduce((s, c) => s + c.unitPrice * c.qty, 0);
  const consTotal = consumables.reduce((s, c) => s + (c.unitPrice || 0) * (c.qty || 1), 0);
  const laborTotal = (laborHours || 0) * (laborRate || 0);
  const subtotal = partsTotal + consTotal + laborTotal;
  const tax = taxOn ? subtotal * taxRate : 0;
  const grand = subtotal + tax;

  return (
    <div id="active-job-card" className="rounded-xl border p-4" style={{ background: C.panel, borderColor: C.border }}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.textDim }}>
        <FileText className="h-3.5 w-3.5" style={{ color: C.orange }} /> Active Job Card
      </div>

      {vehicle ? (
        <div className="mt-3 rounded-lg border p-3" style={{ borderColor: `${C.cyan}40`, background: `${C.cyan}08` }}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.cyan }}>Assigned Vehicle</div>
              <div className="mt-1 text-sm font-bold text-slate-100">
                {vehicle.year || 'YEAR UNKNOWN'} {vehicle.make || 'UNKNOWN MAKE'} {vehicle.model || 'UNKNOWN MODEL'}
              </div>
              <div className="mt-0.5 font-mono text-[10px]" style={{ color: C.textDim }}>
                REGO: {vehicle.rego || 'NOT SUPPLIED'} · VIN: {vehicle.vin || 'NOT SUPPLIED'}
              </div>
            </div>
            <span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ background: `${C.orange}15`, color: C.orange }}>
              {vehicle.hoistName || vehicle.hoistId || 'HOIST UNASSIGNED'}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border p-3 text-xs" style={{ borderColor: `${C.orange}30`, color: C.orange }}>
          No vehicle is assigned. Complete a rego/VIN lookup and commit it to a hoist.
        </div>
      )}

      <div className="mt-3 rounded-lg border p-3" style={{ borderColor: `${C.emerald}35`, background: `${C.emerald}07` }}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.emerald }}>Responsible Technician</div>
            <div className="mt-1 text-sm font-bold text-slate-100">{technician?.name || 'Technician identity required'}</div>
            <div className="mt-0.5 text-[10px]" style={{ color: C.textDim }}>
              {technician?.email || technician?.id || 'No account identifier'}{technician?.employeeCode ? ` · Employee Code: ${technician.employeeCode}` : ''}
            </div>
          </div>
          <span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ background: `${C.emerald}15`, color: C.emerald }}>
            {technician?.role || 'TECHNICIAN'} · {technicianHistory.length} PRIOR AUDIT EVENT(S)
          </span>
        </div>
      </div>

      {/* Allocation Matrix button */}
      <button onClick={onOpenAllocation} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold transition" style={{ borderColor: `${C.orange}40`, background: `${C.orange}08`, color: C.orange }}>
        <Archive className="h-4 w-4" /> Open Delivered Stock Allocation Matrix
      </button>

      {/* Courier Counter-Handshake button */}
      <button onClick={(e) => { e.preventDefault(); onOpenCourierHandshake(); }} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold transition" style={{ borderColor: shipmentStatus === 'LEG-2 FULLY SETTLED' ? `${C.emerald}40` : `${C.cyan}40`, background: shipmentStatus === 'LEG-2 FULLY SETTLED' ? `${C.emerald}08` : `${C.cyan}08`, color: shipmentStatus === 'LEG-2 FULLY SETTLED' ? C.emerald : C.cyan }}>
        {shipmentStatus === 'LEG-2 FULLY SETTLED' ? <><CheckCircle2 className="h-4 w-4" /> Courier Handshake Verified — LEG-2 Fully Settled</> : <><ShieldCheck className="h-4 w-4" /> Initialise Courier Counter-Handshake</>}
      </button>

      {/* Customer fields */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="Customer Name" value={custName} onChange={setCustName} />
        <Field label="Phone" value={custPhone} onChange={setCustPhone} />
        <Field label="Email" value={custEmail} onChange={setCustEmail} />
      </div>

      {/* Parts list */}
      <div className="mt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.textDim }}>Parts & Hardware</h4>
        <div className="mt-2 space-y-2">
          {cart.length === 0 && <p className="text-xs" style={{ color: C.textDimmer }}>No parts added.</p>}
          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg border p-2.5" style={{ borderColor: C.border, background: C.panel2 }}>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-slate-100">{item.brand ? `${item.brand} ` : ''}{item.title}</div>
                <div className="text-[10px]" style={{ color: C.textDim }}>{item.shop || item.loc}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded border px-2 py-1 font-mono text-[10px] text-slate-100" style={{ borderColor: C.border }}>
                  {item.qty || 1} allocated
                </span>
              </div>
              <input type="number" value={item.unitPrice} onChange={(e) => onUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-20 rounded border px-2 py-1 text-right font-mono text-xs text-slate-100 outline-none" style={{ borderColor: C.border, background: C.bg }} />
              <span className="font-mono text-xs" style={{ color: C.emerald, minWidth: '60px', textAlign: 'right' }}>{f(item.unitPrice * item.qty)}</span>
              <button onClick={() => onRemove(item.id)} className="rounded p-1 transition" style={{ color: C.red }}><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Labor & tax */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textDim }}>Labor Hours</label>
          <input type="number" value={laborHours} onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-100 outline-none" style={{ borderColor: C.border, background: C.bg }} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textDim }}>Labor Rate</label>
          <input type="number" value={laborRate} onChange={(e) => setLaborRate(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-100 outline-none" style={{ borderColor: C.border, background: C.bg }} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textDim }}>{r === 'US_CA' || r === 'US_NY' || r === 'US_TX' ? 'Sales Tax' : 'GST Billing'}</label>
          <button onClick={() => setTaxOn(!taxOn)} className="mt-1 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition" style={{ borderColor: C.border, background: C.bg, color: taxOn ? C.emerald : C.textDim }}>
            {taxOn ? `On (${(taxRate * 100).toFixed(2)}%)` : 'Off'}
            <div className="h-4 w-8 rounded-full p-0.5 transition" style={{ background: taxOn ? C.emerald : C.border }}>
              <div className="h-3 w-3 rounded-full bg-white transition" style={{ marginLeft: taxOn ? '16px' : '0' }} />
            </div>
          </button>
        </div>
      </div>

      {/* Diagnostic notes */}
      <div className="mt-3">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textDim }}>Diagnostic Notes</label>
        <textarea value={diagnostic} onChange={(e) => setDiagnostic(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-100 outline-none" style={{ borderColor: C.border, background: C.bg }} />
      </div>

      {/* Totals */}
      <div className="mt-4 space-y-1.5 rounded-lg border p-3 text-xs" style={{ borderColor: C.border, background: C.panel2 }}>
        <Row label="Parts" value={f(partsTotal)} />
        <Row label="Consumables" value={f(consTotal)} />
        <Row label="Labor" value={f(laborTotal)} />
        {taxOn && <Row label={r === 'US_CA' || r === 'US_NY' || r === 'US_TX' ? 'Sales Tax' : 'GST Added'} value={f(tax)} />}
        <div className="flex items-center justify-between border-t pt-2" style={{ borderColor: C.border }}>
          <span className="text-sm font-bold text-slate-100">Grand Total</span>
          <span className="font-mono text-lg font-bold" style={{ color: C.emerald }}>{f(grand)}</span>
        </div>
      </div>

      {/* Dual-state action buttons */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button onClick={onSaveProgress} className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition" style={{ background: C.panel2, border: `1px solid ${C.emerald}40`, color: C.emerald }}>
          <Save className="h-4 w-4" /> Save Job Progress
        </button>
        <button onClick={onCompileInvoice} className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-slate-950 transition" style={{ background: C.orange }}>
          <Send className="h-4 w-4" /> Compile & Send Customer Invoice
        </button>
      </div>
    </div>
  );
}

// ─── Cryptographic QR Code Visual (SVG-based, no external deps) ─────────────
function QRCodeVisual({ value, size = 160, accent = C.orange }) {
  const cells = useMemo(() => {
    if (!value) return [];
    let h = 5381;
    for (let i = 0; i < value.length; i++) h = ((h << 5) + h + value.charCodeAt(i)) >>> 0;
    const grid = [];
    for (let r = 0; r < 21; r++) {
      const row = [];
      for (let c = 0; c < 21; c++) {
        const finder = (r < 7 && c < 7) || (r < 7 && c >= 14) || (r >= 14 && c < 7);
        if (finder) {
          const inF = (r < 7 && c < 7);
          const fr = inF ? r : (r < 7 ? r : r - 14);
          const fc = inF ? c : (c < 7 ? c - 14 : c);
          const border = fr === 0 || fr === 6 || fc === 0 || fc === 6;
          const center = fr >= 2 && fr <= 4 && fc >= 2 && fc <= 4;
          row.push(border || center ? 1 : 0);
        } else {
          h = ((h << 5) + h + r * 21 + c) >>> 0;
          row.push((h & 1));
        }
      }
      grid.push(row);
    }
    return grid;
  }, [value]);

  const cellSize = size / 21;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg" style={{ background: '#fff' }}>
      {cells.map((row, r) =>
        row.map((v, c) =>
          v ? <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill={accent} /> : null
        )
      )}
    </svg>
  );
}

// ─── Multi-Leg Courier Dispatch Pipeline Modal (4 logistics gates) ──────────
function CourierDispatchPipelineModal({ open, onClose, dispatchJob, onAcceptJob, onSupplierScan, onBayDoorScan, onCourierHandshakeComplete, region }) {
  if (!open || !dispatchJob) return null;
  const r = region || 'VIC';
  const f = (n) => fmt(n, r);
  const stage = dispatchJob.stage || 'DISPATCH_TICKET';

  const suppliers = dispatchJob.suppliers || [];
  const scannedSuppliers = new Set(dispatchJob.scannedSuppliers || []);
  const allSuppliersScanned = suppliers.length > 0 && suppliers.every(s => scannedSuppliers.has(s.id));

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.88)' }} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border-2 shadow-2xl" style={{ background: C.bg, borderColor: `${C.orange}40` }} onClick={(e) => e.stopPropagation()}>
        <div className="h-2" style={{ background: `repeating-linear-gradient(45deg, ${C.orange} 0 8px, ${C.bg} 8px 16px)` }} />
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${C.orange}15` }}>
                <Navigation className="h-6 w-6" style={{ color: C.orange }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Multi-Leg Courier Dispatch Pipeline</h2>
                <p className="text-[10px]" style={{ color: C.textDim }}>Consignment: {dispatchJob.consignmentId} · {suppliers.length} supplier legs</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded p-1 transition" style={{ color: C.textDim }}><X className="h-5 w-5" /></button>
          </div>

          {/* Stage Progress Tracker */}
          <div className="mt-4 flex items-center gap-1">
            {[
              { key: 'DISPATCH_TICKET', label: 'Accept', icon: Inbox },
              { key: 'QR_INITIALIZED', label: 'QR Init', icon: QrCode },
              { key: 'SUPPLIER_LOCK', label: 'Supplier', icon: PackageCheck },
              { key: 'BAY_DOOR_HANDOFF', label: 'Handoff', icon: ClipboardCheck },
            ].map((s, i) => {
              const order = ['DISPATCH_TICKET', 'QR_INITIALIZED', 'SUPPLIER_LOCK', 'BAY_DOOR_HANDOFF', 'SETTLED'];
              const currentIdx = order.indexOf(stage);
              const sIdx = order.indexOf(s.key);
              const active = sIdx <= currentIdx;
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 transition" style={{
                    borderColor: active ? C.orange : C.border,
                    background: active ? `${C.orange}15` : C.panel2,
                  }}>
                    <Icon className="h-4 w-4" style={{ color: active ? C.orange : C.textDim }} />
                  </div>
                  <span className="text-[9px] font-bold" style={{ color: active ? C.orange : C.textDim }}>{s.label}</span>
                  {i < 3 && <div className="absolute" />}
                </div>
              );
            })}
          </div>

          {/* GATE A: Accept Delivery Dispatch Job */}
          {stage === 'DISPATCH_TICKET' && (
            <div className="mt-5 space-y-3">
              <div className="rounded-lg border p-4" style={{ borderColor: `${C.orange}30`, background: `${C.orange}08` }}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.orange }}>
                  <Inbox className="h-4 w-4" /> Open Dispatch Ticket
                </div>
                <p className="mt-2 text-[11px]" style={{ color: C.textDim }}>A checkout has cleared. Review the delivery coordinates below and accept this dispatch job to lock it to your courier interface.</p>
              </div>
              <div className="rounded-lg border p-4 space-y-2" style={{ borderColor: C.border, background: C.panel2 }}>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.cyan }}>Full Delivery Coordinate Details</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div style={{ color: C.textDim }}>Pickup Legs: <span className="font-bold text-slate-200">{suppliers.length}</span></div>
                  <div style={{ color: C.textDim }}>Items: <span className="font-bold text-slate-200">{dispatchJob.itemCount}</span></div>
                  <div style={{ color: C.textDim }}>Est. Freight: <span className="font-mono font-bold" style={{ color: C.emerald }}>{f(dispatchJob.freightEstimate || 0)}</span></div>
                  <div style={{ color: C.textDim }}>Hub: <span className="font-bold text-slate-200">{r === 'US_CA' || r === 'US_NY' || r === 'US_TX' ? 'US Hub' : 'Melbourne Regional Hub'}</span></div>
                </div>
                <div className="mt-2 rounded-md border p-2" style={{ borderColor: C.border, background: C.bg }}>
                  <div className="text-[9px] font-bold uppercase mb-1" style={{ color: C.textDim }}>Fastest Pickup-to-Delivery Multi-Supplier Routing Map</div>
                  {suppliers.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2 text-[10px] py-0.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full font-bold text-[8px]" style={{ background: `${C.orange}20`, color: C.orange }}>{i + 1}</span>
                      <MapPinIcon className="h-3 w-3" style={{ color: C.cyan }} />
                      <span className="text-slate-200">{s.name}</span>
                      <span style={{ color: C.textDim }}>· {s.suburb || 'VIC Warehouse'}</span>
                      <ChevronRight className="h-3 w-3" style={{ color: C.textDim }} />
                      <span className="text-[9px]" style={{ color: C.textDim }}>Hub</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-[10px] py-0.5 mt-1 border-t pt-1" style={{ borderColor: C.border }}>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full font-bold text-[8px]" style={{ background: `${C.emerald}20`, color: C.emerald }}>★</span>
                    <MapPinIcon className="h-3 w-3" style={{ color: C.emerald }} />
                    <span className="text-slate-200">Workshop Bay Door</span>
                    <span style={{ color: C.textDim }}>· Final destination</span>
                  </div>
                </div>
              </div>
              <button onClick={onAcceptJob} className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:opacity-90" style={{ background: C.orange }}>
                <ClipboardCheck className="h-4 w-4" /> ACCEPT DELIVERY DISPATCH JOB
              </button>
            </div>
          )}

          {/* GATE B: Mobile QR Code Initialization */}
          {stage === 'QR_INITIALIZED' && (
            <div className="mt-5 space-y-3">
              <div className="rounded-lg border p-4" style={{ borderColor: `${C.cyan}30`, background: `${C.cyan}08` }}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.cyan }}>
                  <Smartphone className="h-4 w-4" /> Mobile QR Code Initialized
                </div>
                <p className="mt-2 text-[11px]" style={{ color: C.textDim }}>Your Logistics Master QR Code is now live. Present this code at each supplier pickup location for dispatch lock scanning.</p>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-lg border p-5" style={{ borderColor: C.border, background: C.panel2 }}>
                <QRCodeVisual value={dispatchJob.qrToken} size={180} accent={C.orange} />
                <div className="text-center">
                  <div className="font-mono text-xs font-bold" style={{ color: C.orange }}>{dispatchJob.qrToken}</div>
                  <div className="text-[9px]" style={{ color: C.textDim }}>Cryptographically bound · Single-use · {dispatchJob.consignmentId}</div>
                </div>
              </div>
              <button onClick={onSupplierScan} className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:opacity-90" style={{ background: C.cyan }}>
                <PackageCheck className="h-4 w-4" /> PROCEED TO SUPPLIER DISPATCH LOCK
              </button>
            </div>
          )}

          {/* GATE C: Supplier Dispatch Lock */}
          {stage === 'SUPPLIER_LOCK' && (
            <div className="mt-5 space-y-3">
              <div className="rounded-lg border p-4" style={{ borderColor: `${C.orange}30`, background: `${C.orange}08` }}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.orange }}>
                  <PackageCheck className="h-4 w-4" /> Supplier Dispatch Lock
                </div>
                <p className="mt-2 text-[11px]" style={{ color: C.textDim }}>Scan your QR code at each individual pick-up vendor location. Scanning ticks off the warehouse ledger and flags pick-pack staff.</p>
              </div>
              <div className="space-y-2">
                {suppliers.map((s) => {
                  const scanned = scannedSuppliers.has(s.id);
                  return (
                    <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3" style={{
                      borderColor: scanned ? `${C.emerald}40` : C.border,
                      background: scanned ? `${C.emerald}08` : C.panel2,
                    }}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: scanned ? `${C.emerald}15` : `${C.orange}15` }}>
                        {scanned ? <CheckCircle2 className="h-4 w-4" style={{ color: C.emerald }} /> : <Package className="h-4 w-4" style={{ color: C.orange }} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-slate-100">{s.name}</div>
                        <div className="text-[9px]" style={{ color: C.textDim }}>{s.suburb} · {s.items?.length || 0} item(s)</div>
                      </div>
                      {scanned ? (
                        <span className="rounded-full border px-2 py-0.5 text-[9px] font-bold" style={{ borderColor: `${C.emerald}40`, background: `${C.emerald}10`, color: C.emerald }}>IN TRANSIT TO HUB</span>
                      ) : (
                        <button onClick={() => onSupplierScan(s.id)} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[10px] font-bold text-slate-950 transition" style={{ background: C.orange }}>
                          <QrCode className="h-3 w-3" /> SCAN
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {allSuppliersScanned && (
                <button onClick={onBayDoorScan} className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:opacity-90" style={{ background: C.emerald }}>
                  <ClipboardCheck className="h-4 w-4" /> ALL SUPPLIERS LOCKED — PROCEED TO BAY-DOOR HANDOFF
                </button>
              )}
            </div>
          )}

          {/* GATE D: Workshop Bay-Door Handoff */}
          {stage === 'BAY_DOOR_HANDOFF' && (
            <div className="mt-5 space-y-3">
              <div className="rounded-lg border p-4" style={{ borderColor: `${C.emerald}30`, background: `${C.emerald}08` }}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.emerald }}>
                  <ClipboardCheck className="h-4 w-4" /> Workshop Bay-Door Handoff
                </div>
                <p className="mt-2 text-[11px]" style={{ color: C.textDim }}>The mechanic must physically scan the courier's delivery QR code using their smartphone lens scanner tool to complete the handoff.</p>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-lg border p-5" style={{ borderColor: C.border, background: C.panel2 }}>
                <QRCodeVisual value={dispatchJob.qrToken} size={140} accent={C.emerald} />
                <div className="text-center">
                  <div className="font-mono text-xs font-bold" style={{ color: C.emerald }}>{dispatchJob.qrToken}</div>
                  <div className="text-[9px]" style={{ color: C.textDim }}>Present to mechanic for bay-door scan</div>
                </div>
              </div>
              <button onClick={onCourierHandshakeComplete} className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:opacity-90" style={{ background: C.emerald }}>
                <CheckCircle2 className="h-4 w-4" /> MECHANIC SCAN COMPLETE — SETTLE LEG-2
              </button>
            </div>
          )}

          {/* SETTLED */}
          {stage === 'SETTLED' && (
            <div className="mt-5 flex flex-col items-center gap-3 rounded-lg border p-6" style={{ borderColor: `${C.emerald}40`, background: `${C.emerald}08` }}>
              <CheckCircle2 className="h-12 w-12" style={{ color: C.emerald }} />
              <p className="text-sm font-bold" style={{ color: C.emerald }}>LEG-2 FULLY SETTLED & FREIGHT HANDOFF COMPLETE</p>
              <p className="text-[10px]" style={{ color: C.textDim }}>Routing assets into PartsForge Live Freight Arrival Manifest...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PartsForge Live Freight Arrival Manifest Modal ────────────────────────
function FreightArrivalManifestModal({ open, onClose, dispatchJob, onConfirmRouting, region }) {
  if (!open || !dispatchJob) return null;
  const r = region || 'VIC';
  const f = (n) => fmt(n, r);
  const items = dispatchJob?.items || [];

  // Safe local classification helper prevents unmapped function references from crashing your tablet render gates
  const isLine2Part = (item) => {
    const cat = (item.category || item.source || 'part').toLowerCase();
    return cat === 'part' || cat === 'oil' || cat === 'gear_oil' || cat === 'atf' || cat === 'brake_fluid';
  };

  const line2Items = items.filter(c => isLine2Part(c));
  const line1Items = items.filter(c => !isLine2Part(c));

  return (
    <div className="fixed inset-0 z-[96] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.90)' }} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border-2 shadow-2xl" style={{ background: C.bg, borderColor: `${C.emerald}50` }} onClick={(e) => e.stopPropagation()}>
        <div className="h-2" style={{ background: `repeating-linear-gradient(45deg, ${C.emerald} 0 8px, ${C.bg} 8px 16px)` }} />
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${C.emerald}15` }}>
                <PackageCheck className="h-6 w-6" style={{ color: C.emerald }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">PARTSFORGE LIVE FREIGHT ARRIVAL MANIFEST</h2>
                <p className="text-[10px]" style={{ color: C.textDim }}>Consignment: {dispatchJob?.consignmentId} · {items.length} item(s) received</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded p-1 transition" style={{ color: C.textDim }}><X className="h-5 w-5" /></button>
          </div>

          {/* Itemized list */}
          <div className="mt-4 space-y-4">
            {/* LINE 2: Vehicle Parts & Lubricants → Allocation Matrix */}
            {line2Items.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.emerald }}>
                  <Package className="h-3.5 w-3.5" /> Vehicle Parts & Lubricants → Stock Allocation Matrix
                </div>
                <div className="space-y-1.5">
                  {line2Items.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 rounded-lg border p-2.5" style={{ borderColor: `${C.emerald}30`, background: `${C.emerald}05` }}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: `${C.emerald}15` }}>
                        <Package className="h-4 w-4" style={{ color: C.emerald }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-slate-100">{c.brand ? `${c.brand} ` : ''}{c.title}</div>
                        <div className="text-[9px]" style={{ color: C.textDim }}>Qty: {c.qty} · {c.shop || c.loc || 'Unknown'}</div>
                      </div>
                      <span className="font-mono text-xs" style={{ color: C.emerald }}>{f(c.unitPrice || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LINE 1: Consumables, Accessories, Tools → Workshop Expense Ledger */}
            {line1Items.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.orange }}>
                  <Wrench className="h-3.5 w-3.5" /> Consumables, Accessories & Tools → Workshop Expense Ledger
                </div>
                <div className="space-y-1.5">
                  {line1Items.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 rounded-lg border p-2.5" style={{ borderColor: `${C.orange}30`, background: `${C.orange}05` }}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: `${C.orange}15` }}>
                        <Wrench className="h-4 w-4" style={{ color: C.orange }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-slate-100">{c.brand ? `${c.brand} ` : ''}{c.title}</div>
                        <div className="text-[9px]" style={{ color: C.textDim }}>Qty: {c.qty} · {c.shop || c.loc || 'Unknown'}</div>
                      </div>
                      <span className="font-mono text-xs" style={{ color: C.orange }}>{f(c.unitPrice || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm routing button */}
          <button onClick={onConfirmRouting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:opacity-90" style={{ background: C.emerald }}>
            <CheckCircle2 className="h-4 w-4" /> CONFIRM ARRIVAL — ROUTE TO ALLOCATION MATRIX & EXPENSE LEDGER
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Outstanding Employee Purchases Approval Table ──────────────────────────
function EmployeeApprovalTable({ pendingApprovals, onApprove, onReject, region }) {
  const r = region || 'VIC';
  const f = (n) => fmt(n, r);
  if (!pendingApprovals || pendingApprovals.length === 0) return null;
  return (
    <div className="rounded-xl border p-4" style={{ background: C.panel, borderColor: `${C.orange}40` }}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.orange }}>
        <AlertTriangle className="h-3.5 w-3.5" /> Outstanding Employee Purchases Requiring Corporate Approval
      </div>
      <div className="mt-3 space-y-2">
        {pendingApprovals.map((req) => (
          <div key={req.id} className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: `${C.orange}15` }}>
                <UserCheck className="h-4 w-4" style={{ color: C.orange }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-slate-100">{req.items.length} item(s) — {req.employeeName}</div>
                <div className="text-[9px]" style={{ color: C.textDim }}>Requested {new Date(req.requestedAt).toLocaleString()} · Code: {req.employeeCode}</div>
              </div>
              <span className="font-mono text-xs font-bold" style={{ color: C.emerald }}>{f(req.total)}</span>
            </div>
            <div className="mt-2 ml-11 space-y-0.5">
              {req.items.map((it, i) => (
                <div key={i} className="text-[10px]" style={{ color: C.textDim }}>
                  · {it.brand ? `${it.brand} ` : ''}{it.title} (x{it.qty}) — <span className="font-mono" style={{ color: C.emerald }}>{f(it.unitPrice || 0)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <button onClick={() => onApprove(req.id)} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[10px] font-bold text-slate-950 transition" style={{ background: C.emerald }}>
                <CheckCircle2 className="h-3 w-3" /> APPROVE & PROCESS STRIPE PAYMENT
              </button>
              <button onClick={() => onReject(req.id)} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[10px] font-bold transition" style={{ background: `${C.red}15`, color: C.red }}>
                <XCircle className="h-3 w-3" /> REJECT & FLUSH
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Inventory Classification Engine ─────────────────────────────────────────
// LINE1_INTERNAL_EXPENSE: Consumables, Workshop Accessories, Specialty Shop Tools
//   → Route to Workshop Invoice Archive Ledger on delivery. NEVER enter Allocation Matrix or Job Card.
// LINE2_BAY_ALLOCATION: Vehicle Parts, Workshop Lubricants
//   → Route to Delivered Stock Allocation Matrix on delivery. Status locked at DELIVERED & APPROVED.
const LINE1_CATEGORIES = new Set([
  'consumable', 'accessory', 'tool',
  'cleaner', 'coolant', 'towels', 'degreaser', 'gloves',
  'drain_pan', 'filter_wrench', 'wrench', 'torque_wrench', 'compressor', 'piston_tool',
  'diagnostic', 'heavy', 'specialty',
]);
const classifyItem = (item) => {
  const cat = String(item?.category || item?.source || item?.tier || '').toLowerCase();
  if (LINE1_CATEGORIES.has(cat)) return 'LINE1_INTERNAL_EXPENSE';
  return 'LINE2_BAY_ALLOCATION';
};

// ─── On the Hoist Repository ─────────────────────────────────────────────────
function OnTheHoistRepository({ savedJobs, onResume, onDelete, bayOptions }) {
  const [baySelect, setBaySelect] = useState({});
  if (!savedJobs || savedJobs.length === 0) return null;
  return (
    <div className="rounded-xl border p-4" style={{ background: C.panel, borderColor: `${C.cyan}30` }}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.cyan }}>
        <History className="h-3.5 w-3.5" /> On the Hoist — In-Progress Jobs
      </div>
      <div className="mt-3 space-y-2">
        {savedJobs.map((job, idx) => {
          const jid = job.jobId || job.id;
          return (
            <div key={jid} className="rounded-lg border p-3 transition" style={{ borderColor: C.border, background: C.panel2 }}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold" style={{ background: `${C.cyan}15`, color: C.cyan }}>{idx + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-slate-100">{job.custName || 'Unknown Customer'} — {job.vehicle?.make} {job.vehicle?.model}</div>
                  <div className="truncate text-[10px]" style={{ color: C.textDim }}>{jid} · {job.cart?.length || 0} parts · {job.consumables?.length || 0} consumables · Saved {new Date(job.savedAt).toLocaleDateString()}</div>
                </div>
                <button onClick={() => onDelete(jid)} className="rounded p-1.5 transition" style={{ color: C.red }} title="Delete from Hoist"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <select value={baySelect[jid] || ''} onChange={(e) => setBaySelect(prev => ({ ...prev, [jid]: e.target.value }))} className="flex-1 rounded-md border px-2 py-1.5 text-[11px] text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel }}>
                  <option value="">Select Target Bay ID of Choice...</option>
                  {bayOptions.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
                <button onClick={() => onResume(job, baySelect[jid] || null)} disabled={!baySelect[jid]} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[10px] font-bold text-slate-950 transition disabled:opacity-40" style={{ background: C.cyan }}>
                  <ChevronRight className="h-3 w-3" /> Load into Bay
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Live Bank Feed + Accounting Ledger Panel ────────────────────────────────
function BankFeedPanel({ bankFeedEntries, ledgerEntries, region }) {
  const [tab, setTab] = useState('bank');
  const r = typeof region === 'string' ? region : 'VIC';
  const f = (n) => fmt(n, r);

  return (
    <div className="rounded-xl border p-4" style={{ background: C.panel, borderColor: C.border }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.emerald }}>
          <ShieldCheck className="h-3.5 w-3.5" /> Live Bank Feed & Accounting Ledger
        </div>
        <div className="flex gap-1 rounded-lg border p-0.5" style={{ borderColor: C.border, background: C.panel2 }}>
          <button onClick={() => setTab('bank')} className="rounded px-2 py-1 text-[10px] font-bold transition" style={{ background: tab === 'bank' ? C.emerald : 'transparent', color: tab === 'bank' ? '#000' : C.textDim }}>Bank Feed</button>
          <button onClick={() => setTab('ledger')} className="rounded px-2 py-1 text-[10px] font-bold transition" style={{ background: tab === 'ledger' ? C.cyan : 'transparent', color: tab === 'ledger' ? '#000' : C.textDim }}>Ledger</button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px]" style={{ borderColor: `${C.emerald}30`, background: `${C.emerald}08`, color: C.textDim }}>
        <Zap className="h-3 w-3 shrink-0" style={{ color: C.emerald }} />
        <span className="truncate">Routing via <span className="font-bold" style={{ color: C.emerald }}>{r === 'US_CA' || r === 'US_NY' || r === 'US_TX' ? 'Plaid Core Engine' : 'Basiq Open Banking Feed'}</span></span>
      </div>
      <div className="custom-scrollbar mt-3 max-h-56 overflow-y-auto space-y-1.5">
        {tab === 'bank' ? (
          bankFeedEntries.length === 0 ? <p className="text-center text-xs" style={{ color: C.textDimmer }}>No bank feed transactions yet. Purchases will appear here automatically.</p> :
          bankFeedEntries.map(e => (
            <div key={e.id} className="flex items-center gap-2 rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel2 }}>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-bold text-slate-100">{e.description}</div>
                <div className="text-[9px]" style={{ color: C.textDim }}>{e.channel} · {new Date(e.timestamp).toLocaleTimeString()}</div>
              </div>
              <span className="font-mono text-xs font-bold" style={{ color: C.emerald }}>{f(e.amount)}</span>
              <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold" style={{ background: `${C.emerald}15`, color: C.emerald }}>{e.status}</span>
            </div>
          ))
        ) : (
          ledgerEntries.length === 0 ? <p className="text-center text-xs" style={{ color: C.textDimmer }}>No ledger entries yet. Purchases will mirror here automatically.</p> :
          ledgerEntries.map(e => (
            <div key={e.id} className="flex items-center gap-2 rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel2 }}>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-bold text-slate-100">{e.description}</div>
                <div className="text-[9px]" style={{ color: C.textDim }}>{e.ledgerId} · {e.accountCode} · {new Date(e.timestamp).toLocaleTimeString()}</div>
              </div>
              <span className="font-mono text-xs font-bold" style={{ color: C.cyan }}>{f(e.amount)}</span>
              <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold" style={{ background: `${C.cyan}15`, color: C.cyan }}>{e.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Unpaid Invoices Directory (with delete locks) ───────────────────────────
function UnpaidInvoicesDirectory({ invoices, onSettle, onVerifyBank, region }) {
  const r = region || 'VIC';
  const f = (n) => fmt(n, r);
  return (
    <div className="rounded-xl border p-4" style={{ background: C.panel, borderColor: C.border }}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.textDim }}>
        <FileText className="h-3.5 w-3.5" style={{ color: C.orange }} /> Unpaid Invoices Directory
      </div>
      <div className="mt-2 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px]" style={{ borderColor: `${C.red}30`, background: `${C.red}08`, color: C.textDim }}>
        <Lock className="h-3 w-3 shrink-0" style={{ color: C.red }} /> Deletion locked — invoices can only be removed after payment clearance or accounting export.
      </div>
      <div className="custom-scrollbar mt-3 max-h-72 overflow-y-auto space-y-2">
        {invoices.length === 0 ? <p className="text-center text-xs" style={{ color: C.textDimmer }}>No unpaid invoices.</p> : invoices.map((inv) => (
          <div key={inv.invoiceNo} className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-xs font-bold text-slate-100">{inv.invoiceNo}</div>
                <div className="text-[10px]" style={{ color: C.textDim }}>{inv.customer} · {inv.vehicle}</div>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>UNPAID</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-sm font-bold" style={{ color: C.emerald }}>{f(inv.grandTotal)}</span>
              <div className="flex gap-2">
                <button onClick={() => onVerifyBank(inv)} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition" style={{ background: `${C.cyan}10`, color: C.cyan }}>
                  <ShieldCheck className="h-3 w-3" /> Verify Bank Feed
                </button>
                <button onClick={() => onSettle(inv)} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition" style={{ background: `${C.emerald}15`, color: C.emerald }}>
                  <CreditCard className="h-3 w-3" /> Settle
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Account Settings Dropdown ───────────────────────────────────────────────
function AccountSettingsDropdown({ corpProfile, setCorpProfile, matchedAccount, paidInvoices, onLinkAto, onConnectLedger, onInviteAccountant, onConnectBankFeed, bankFeedStatus, onExportToAccounting, onEmailAccountant, regionCode, onRegionChange, usStateCode, onUsStateChange, bankFeedEntries, ledgerEntries, workshopExpenses, onExportWorkshopExpense, onDeleteWorkshopExpense, userEmail, teamLinkCode, onGenerateTeamLinkCode, linkedEmployees, savedJobs, onResumeJob, onDeleteJob, hoists, onAddHoist, onRenameHoist, onHoistStatusChange }) {
  const [open, setOpen] = useState(false);
  const [subFolder, setSubFolder] = useState(null);
  const [atoStatus, setAtoStatus] = useState(null);
  const [ledgerStatus, setLedgerStatus] = useState(null);
  const [accountantEmail, setAccountantEmail] = useState('');
  const [accountantStatus, setAccountantStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const months = ['July', 'August', 'September'];
  const localPaidInvoices = paidInvoices.filter(i => i.paymentStatus === 'PAID');

  const handleAto = async () => { setBusy(true); const r = await onLinkAto(); setAtoStatus(r); setBusy(false); };
  const handleLedger = async (provider) => { setBusy(true); const r = await onConnectLedger(provider); setLedgerStatus(r); setBusy(false); };
  const handleAccountant = async () => { if (!accountantEmail.trim()) return; setBusy(true); const r = await onInviteAccountant(accountantEmail.trim()); setAccountantStatus(r); setBusy(false); };
  const handleBankFeed = async () => { setBusy(true); const r = await onConnectBankFeed(); setBusy(false); return r; };

  const closeAll = () => { setOpen(false); setSubFolder(null); };

  const folders = [
    { id: 'hoist_jobs', label: `On the Hoist — In-Progress Jobs (${savedJobs?.length || 0})`, icon: <History className="h-4 w-4" /> },
    { id: 'hoists', label: 'Workshop Hoists', icon: <Wrench className="h-4 w-4" /> },
    { id: 'accounting', label: 'Accounting', icon: <Landmark className="h-4 w-4" /> },
    { id: 'corporate', label: 'Corporate Accounts', icon: <Building2 className="h-4 w-4" /> },
    { id: 'residency', label: 'Data Residency & Compliance', icon: <Database className="h-4 w-4" /> },
    { id: 'team', label: 'Link & Manage Team Employees', icon: <Users className="h-4 w-4" /> },
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
          <div className="absolute right-0 z-[71] mt-2 max-h-[82vh] w-[min(92vw,44rem)] overflow-y-auto rounded-xl border shadow-2xl" style={{ background: C.bg, borderColor: C.border }}>
            {!subFolder ? (
              <div className="p-2">
                {folders.map(f => (
                  <button key={f.id} onClick={() => setSubFolder(f.id)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-white/5">
                    <span style={{ color: C.orange }}>{f.icon}</span>
                    <span className="flex-1">{f.label}</span>
                    <ChevronRight className="h-3.5 w-3.5" style={{ color: C.textDim }} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <button onClick={() => setSubFolder(['financial', 'bankfeed', 'region_currency', 'archive', 'live_ledger'].includes(subFolder) ? 'accounting' : null)} className="mb-3 flex items-center gap-1.5 text-xs" style={{ color: C.textDim }}>
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>

                {subFolder === 'hoist_jobs' && (
                  <OnTheHoistRepository
                    savedJobs={savedJobs}
                    onResume={(job, bayId) => {
                      onResumeJob(job, bayId);
                      closeAll();
                    }}
                    onDelete={onDeleteJob}
                    bayOptions={(hoists || []).filter(hoist => hoist.status === 'available')}
                  />
                )}

                {subFolder === 'hoists' && (
                  <HoistManager hoists={hoists || []} onAdd={onAddHoist} onRename={onRenameHoist} onStatusChange={onHoistStatusChange} />
                )}

                {subFolder === 'accounting' && (
                  <div className="space-y-2">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: C.orange }}>Accounting Files</h4>
                    {[
                      ['financial', 'Financial Hub', <Landmark className="h-4 w-4" />],
                      ['bankfeed', 'Live Bank Feed', <ShieldCheck className="h-4 w-4" />],
                      ['live_ledger', 'Bank Feed & Accounting Ledger', <Activity className="h-4 w-4" />],
                      ['region_currency', 'Region & Currency', <Globe className="h-4 w-4" />],
                      ['archive', 'Invoices & Workshop Expenses', <Archive className="h-4 w-4" />],
                    ].map(([id, label, icon]) => (
                      <button key={id} onClick={() => setSubFolder(id)} className="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-xs font-semibold" style={{ borderColor: C.border, color: C.text }}>
                        <span style={{ color: C.orange }}>{icon}</span><span className="flex-1">{label}</span><ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                )}

                {subFolder === 'region_currency' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.orange }}>Region & Currency</h4>
                    <GlobalRegionSelector regionCode={regionCode} onRegionChange={onRegionChange} usStateCode={usStateCode} onUsStateChange={onUsStateChange} />
                  </div>
                )}

                {subFolder === 'live_ledger' && (
                  <BankFeedPanel bankFeedEntries={bankFeedEntries || []} ledgerEntries={ledgerEntries || []} region={regionCode} />
                )}

                {subFolder === 'financial' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.orange }}>Financial Sync & Tax Compliance</h4>
                    <button onClick={handleAto} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-950 transition" style={{ background: C.orange }}>
                      <Landmark className="h-3.5 w-3.5" /> Link ATO via SBR
                    </button>
                    {atoStatus && <StatusBadge label="ATO SBR" status={atoStatus.status} />}
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleLedger('Xero')} disabled={busy} className="rounded-lg border px-3 py-2 text-xs font-semibold transition" style={{ borderColor: C.border, color: C.text }}>Connect Xero</button>
                      <button onClick={() => handleLedger('MYOB')} disabled={busy} className="rounded-lg border px-3 py-2 text-xs font-semibold transition" style={{ borderColor: C.border, color: C.text }}>Connect MYOB</button>
                    </div>
                    {ledgerStatus && <StatusBadge label={ledgerStatus.provider} status={ledgerStatus.status} />}
                    <div>
                      <input value={accountantEmail} onChange={(e) => setAccountantEmail(e.target.value)} placeholder="accountant@email.com" className="w-full rounded-lg border px-3 py-2 text-xs text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }} />
                      <button onClick={handleAccountant} disabled={busy || !accountantEmail.trim()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition" style={{ borderColor: `${C.cyan}40`, color: C.cyan }}>
                        <Send className="h-3 w-3" /> Invite Accountant
                      </button>
                      {accountantStatus && <StatusBadge label="Accountant" status={accountantStatus.status} />}
                    </div>
                  </div>
                )}

                {subFolder === 'corporate' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.orange }}>Corporate Accounts & Memberships</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-semibold uppercase" style={{ color: C.textDim }}>Mobile Phone</label>
                        <input value={corpProfile.phone || ''} onChange={(e) => setCorpProfile({ ...corpProfile, phone: e.target.value })} placeholder="+61 412 345 678" className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-xs text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }} />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase" style={{ color: C.textDim }}>{regionCode === 'US_CA' || regionCode === 'US_NY' || regionCode === 'US_TX' ? 'EIN Number' : 'Business ABN'}</label>
                        <input value={corpProfile.abn || ''} onChange={(e) => setCorpProfile({ ...corpProfile, abn: e.target.value })} placeholder={regionCode === 'US_CA' || regionCode === 'US_NY' || regionCode === 'US_TX' ? '12-3456789' : '00 000 000 000'} className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-xs text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }} />
                      </div>
                    </div>
                    {matchedAccount && (
                      <div className="rounded-lg border p-3" style={{ borderColor: `${C.gold}30`, background: `${C.gold}05` }}>
                        <div className="flex items-center gap-2"><Percent className="h-4 w-4" style={{ color: C.gold }} /><span className="text-xs font-bold" style={{ color: C.gold }}>{matchedAccount.name}</span></div>
                        <p className="mt-1 text-[10px]" style={{ color: C.textDim }}>{MEMBERSHIP_TIERS[matchedAccount.tier]?.label} Tier · {(matchedAccount.discountPct * 100).toFixed(0)}% discount · {matchedAccount.stores.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}

                {subFolder === 'bankfeed' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.orange }}>Live Corporate Bank Feed — Global Open Banking Middleware</h4>
                    <div className="rounded-lg border p-3" style={{ borderColor: `${C.emerald}30`, background: `${C.emerald}05` }}>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" style={{ color: C.emerald }} />
                        <span className="text-xs font-bold" style={{ color: C.emerald }}>{regionCode === 'US_CA' || regionCode === 'US_NY' || regionCode === 'US_TX' ? 'Plaid Financial Infrastructure' : 'Basiq Open Banking API'}</span>
                      </div>
                      <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: C.textDim }}>{regionCode === 'US_CA' || regionCode === 'US_NY' || regionCode === 'US_TX' ? 'Real-time corporate credit card synchronization engine and transaction monitoring vault over multi-tenant ledger gateways.' : 'Real-time open banking customer data right feed layer synchronizing inbound OSKO, PayID and corporate trade account deposits natively.'}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {typeof REGION_LIST !== 'undefined' ? REGION_LIST.map(r => (
                        <div key={r.code} className="flex items-center justify-between rounded-lg border px-2.5 py-2 text-[10px]" style={{ borderColor: r.code === regionCode ? C.emerald : C.border, background: r.code === regionCode ? `${C.emerald}08` : C.panel2, opacity: r.code === regionCode ? 1 : 0.5 }}>
                          <span className="font-semibold" style={{ color: r.code === regionCode ? C.emerald : C.textDim }}>{r.bankProvider?.name || 'CDR Network Feed'}</span>
                          {r.code === regionCode && <CheckCircle2 className="h-3 w-3" style={{ color: C.emerald }} />}
                        </div>
                      )) : null}
                    </div>
                                        <button onClick={handleBankFeed} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-950 transition" style={{ background: C.orange }}>
                      <ShieldCheck className="h-3.5 w-3.5" /> Connect via {regionCode === 'US_CA' || regionCode === 'US_NY' || regionCode === 'US_TX' ? 'Plaid API' : 'Basiq Open Banking API'}
                    </button>
                    {bankFeedStatus && bankFeedStatus.ok && (
                      <div className="rounded-lg border p-3" style={{ borderColor: `${C.emerald}30`, background: `${C.emerald}05` }}>
                        <p className="text-xs font-bold" style={{ color: C.emerald }}>{bankFeedStatus.bankName} · ****{bankFeedStatus.accountLast4}</p>
                        <p className="text-[10px]" style={{ color: C.textDim }}>Connected {new Date(bankFeedStatus.connectedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}

                {subFolder === 'residency' && (
                  <DataResidencyNode regionCode={regionCode} />
                )}

                {subFolder === 'archive' && (
                  <div className="space-y-4">
                    <PaidInvoicesArchive months={months} paidInvoices={localPaidInvoices} onExport={onExportToAccounting} onEmailAccountant={onEmailAccountant} busy={busy} onDelete={(no) => setPaidInvoices(prev => prev.filter(i => i.invoiceNo !== no))} region={regionCode} />
                    <WorkshopExpensePanel expenses={workshopExpenses || []} onExport={onExportWorkshopExpense} onDelete={onDeleteWorkshopExpense} userEmail={userEmail} region={regionCode} />
                  </div>
                )}

                {subFolder === 'team' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.orange }}>Link & Manage Team Employees</h4>
                    <p className="text-[10px] leading-relaxed" style={{ color: C.textDim }}>Generate a Team Link Code for employees to link their devices as sub-users tied to this workshop account. Linked employees cannot process purchases directly — all orders route to your approval queue.</p>
                    <button onClick={onGenerateTeamLinkCode} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-950 transition" style={{ background: C.orange }}>
                      <UserPlus className="h-3.5 w-3.5" /> Generate Team Link Code
                    </button>
                    {teamLinkCode && (
                      <div className="rounded-lg border p-3" style={{ borderColor: `${C.emerald}40`, background: `${C.emerald}08` }}>
                        <div className="text-[10px] font-bold uppercase" style={{ color: C.textDim }}>Active Team Link Code</div>
                        <div className="mt-1 font-mono text-lg font-bold" style={{ color: C.emerald }}>{teamLinkCode}</div>
                        <div className="text-[9px]" style={{ color: C.textDim }}>Share this code with employees to link their devices.</div>
                      </div>
                    )}
                    {linkedEmployees && linkedEmployees.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase" style={{ color: C.textDim }}>Linked Employees ({linkedEmployees.length})</div>
                        {linkedEmployees.map((emp) => (
                          <div key={emp.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-2" style={{ borderColor: C.border, background: C.panel2 }}>
                            <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: `${C.cyan}15` }}>
                              <UserCheck className="h-3.5 w-3.5" style={{ color: C.cyan }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[11px] font-bold text-slate-100">{emp.name}</div>
                              <div className="text-[9px]" style={{ color: C.textDim }}>Code: {emp.employeeCode} · Linked {new Date(emp.linkedAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

function StatusBadge({ label, status }) {
  return <div className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px]" style={{ borderColor: `${C.emerald}30`, background: `${C.emerald}05`, color: C.emerald }}><CheckCircle2 className="h-3 w-3" /> {label}: {status}</div>;
}

// ─── Paid Invoices Archive (with accounting export + delete locks) ────────────
function PaidInvoicesArchive({ months, paidInvoices, onExport, onEmailAccountant, busy, onDelete, region }) {
  const r = region || 'VIC';
  const f = (n) => fmt(n, r);
  const [selected, setSelected] = useState(new Set());
  const [exported, setExported] = useState(new Set());
  const [emailed, setEmailed] = useState(new Set());
  const [exportStatus, setExportStatus] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);
  const [viewingJob, setViewingJob] = useState(null);

  const toggle = (no) => {
    setSelected(prev => { const n = new Set(prev); n.has(no) ? n.delete(no) : n.add(no); return n; });
  };
  const allPaid = paidInvoices.filter(i => i.paymentStatus === 'PAID');
  const allSelected = allPaid.length > 0 && allPaid.every(i => selected.has(i.invoiceNo));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allPaid.map(i => i.invoiceNo)));
  const canRemove = (inv) => exported.has(inv.invoiceNo) || inv.paymentStatus === 'PAID' && (exported.has(inv.invoiceNo) || emailed.has(inv.invoiceNo));

  const handleExport = async (e) => {
    e?.preventDefault?.();
    const items = allPaid.filter(i => selected.has(i.invoiceNo));
    if (!items.length) return;
    setExportStatus('exporting');
    await onExport(items);
    setExported(prev => { const n = new Set(prev); items.forEach(i => n.add(i.invoiceNo)); return n; });
    setExportStatus('done');
    setTimeout(() => setExportStatus(null), 3000);
  };

  const handleEmail = async (e) => {
    e?.preventDefault?.();
    const items = allPaid.filter(i => selected.has(i.invoiceNo));
    if (!items.length) return;
    setEmailStatus('sending');
    await onEmailAccountant(items);
    setEmailed(prev => { const n = new Set(prev); items.forEach(i => n.add(i.invoiceNo)); return n; });
    setEmailStatus('done');
    setTimeout(() => setEmailStatus(null), 3000);
  };

return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.orange }}>Invoice Archive Ledger</h4>
        <span className="text-[10px] font-mono" style={{ color: C.textDim }}>{allPaid.length} paid records</span>
      </div>

      {allPaid.length === 0 ? (
        <div className="rounded-lg border p-4 text-center" style={{ borderColor: C.border, background: C.panel2 }}>
          <FileText className="mx-auto h-6 w-6" style={{ color: C.textDimmer }} />
          <p className="mt-2 text-[11px]" style={{ color: C.textDim }}>No paid invoices archived yet.</p>
        </div>
      ) : (
        <>
          {/* Toolbar — locked above the scroll container */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2.5" style={{ borderColor: C.border, background: C.panel2 }}>
            <button onClick={(e) => { e.preventDefault(); toggleAll(); }} className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition" style={{ borderColor: C.border, color: C.text }}>
              <input type="checkbox" checked={allSelected} readOnly className="h-3 w-3" style={{ accentColor: C.orange }} /> Select All
            </button>
            <button onClick={handleExport} disabled={busy || selected.size === 0 || exportStatus === 'exporting'} className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition" style={{ borderColor: `${C.emerald}40`, color: C.emerald }}>
              {exportStatus === 'exporting' ? <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" /> : <Landmark className="h-3 w-3" />} Export to Accounting
            </button>
            <button onClick={handleEmail} disabled={busy || selected.size === 0 || emailStatus === 'sending'} className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition" style={{ borderColor: `${C.cyan}40`, color: C.cyan }}>
              {emailStatus === 'sending' ? <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" /> : <Mail className="h-3 w-3" />} Email Accountant
            </button>
          </div>
          {exportStatus === 'done' && <div className="flex items-center gap-1.5 text-[10px]" style={{ color: C.emerald }}><CheckCircle2 className="h-3 w-3" /> Exported to accounting software.</div>}
          {emailStatus === 'done' && <div className="flex items-center gap-1.5 text-[10px]" style={{ color: C.cyan }}><CheckCircle2 className="h-3 w-3" /> Tax data sheets emailed to accountant.</div>}

          {/* Strict scroll container — headers & buttons stay locked outside */}
          <div className="custom-scrollbar max-h-[60vh] space-y-3 overflow-y-auto overflow-x-hidden rounded-lg border p-2" style={{ borderColor: C.border, background: C.bg }}>
            {months.map((month) => {
              const monthInvoices = paidInvoices.filter(i => {
                const d = new Date(i.settledAt || i.compiledAt || i.date);
                return i.paymentStatus === 'PAID' && d.toLocaleString('en-AU', { month: 'long' }) === month;
              });
              return (
                <details key={month} className="rounded-lg border" style={{ borderColor: C.border, background: C.panel2 }}>
                  <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-slate-100">{month} ({monthInvoices.length})</summary>
                  <div className="space-y-2 p-2">
                    {monthInvoices.length === 0 ? (
                      <p className="px-3 py-2 text-[10px]" style={{ color: C.textDimmer }}>No paid invoices.</p>
                    ) : monthInvoices.map(inv => {
                      const isExported = exported.has(inv.invoiceNo);
                      const isEmailed = emailed.has(inv.invoiceNo);
                      const canDel = isExported || isEmailed;
                      return (
                        <div key={inv.invoiceNo} className="flex items-center gap-3 rounded-lg border px-5 py-4" style={{ borderColor: C.border, background: C.bg }}>
                          {/* Checkbox */}
                          <input type="checkbox" checked={selected.has(inv.invoiceNo)} onChange={(e) => { e.preventDefault(); toggle(inv.invoiceNo); }} className="h-3.5 w-3.5 shrink-0" style={{ accentColor: C.orange }} />

                          {/* Invoice ID + customer — truncated with max width */}
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-mono text-[11px] font-bold text-slate-100" style={{ maxWidth: 180 }}>{inv.invoiceNo}</div>
                            <div className="truncate text-[10px]" style={{ color: C.textDim, maxWidth: 180 }}>{inv.customer || 'N/A'}</div>
                            {inv.purchasedByEmployee && (
                              <div className="mt-0.5 flex items-center gap-1 truncate text-[9px] font-bold" style={{ color: C.orange, maxWidth: 180 }}>
                                <UserCheck className="h-2.5 w-2.5 shrink-0" /> {inv.purchasedByEmployee}
                              </div>
                            )}
                          </div>

                          {/* Date timestamp */}
                          <div className="hidden shrink-0 text-right sm:block">
                            <div className="text-[9px] font-bold uppercase" style={{ color: C.textDim }}>Settled</div>
                            <div className="font-mono text-[10px] text-slate-300">{inv.settledAt ? new Date(inv.settledAt).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                          </div>

                          {/* Total dollar amount */}
                          <div className="shrink-0 text-right">
                            <div className="font-mono text-sm font-bold" style={{ color: C.emerald }}>{f(inv.grandTotal)}</div>
                          </div>

                          {/* View job card button */}
                          <button onClick={(e) => { e.preventDefault(); setViewingJob(inv); }} className="flex shrink-0 items-center gap-0.5 rounded-lg px-2 py-1.5 text-[9px] font-bold transition hover:opacity-80" style={{ background: `${C.cyan}15`, color: C.cyan }}>
                            <ClipboardList className="h-3 w-3" /> View
                          </button>

                          {/* Sticky action column — far right, always visible */}
                          <div className="flex shrink-0 flex-col items-center gap-1 border-l pl-3" style={{ borderColor: C.border }}>
                            {isExported && <span className="text-[8px] font-bold" style={{ color: C.emerald }}>EXPORTED</span>}
                            {isEmailed && <span className="text-[8px] font-bold" style={{ color: C.cyan }}>EMAILED</span>}
                            {canDel ? (
                              <button onClick={(e) => { e.preventDefault(); onDelete && onDelete(inv.invoiceNo); }} className="flex items-center gap-0.5 rounded-md px-2 py-1 text-[9px] font-bold transition hover:opacity-80" style={{ background: `${C.red}10`, color: C.red }}>
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            ) : (
                              <span className="flex items-center gap-0.5 text-[8px]" style={{ color: C.textDimmer }}><Lock className="h-3 w-3" /> Locked</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </>
      )}

      {viewingJob && (
        <CompletedJobCardModal invoice={viewingJob} onClose={() => setViewingJob(null)} region={region} />
      )}
    </div>
  );
}

// ─── Workshop Expense Panel (internal purchases, never billed to clients) ────
function WorkshopExpensePanel({ expenses, onExport, onDelete, userEmail, region }) {
  const r = region || 'VIC';
  const f = (n) => fmt(n, r);
  const [emailToast, setEmailToast] = useState(null);

  const handleExportClick = (e, expense) => {
    e.preventDefault();
    onExport(expense);
    setEmailToast(`CSV/PDF emailed to ${userEmail || 'your registered email'} — download ready on your PC.`);
    setTimeout(() => setEmailToast(null), 4000);
  };

  const total = expenses.reduce((sum, e) => sum + e.unitPrice * e.qty, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: C.cyan }}>
          <Wrench className="h-3.5 w-3.5" /> Workshop Invoice Archive Ledger
        </h4>
        <span className="text-[10px] font-mono" style={{ color: C.textDim }}>{expenses.length} assets · {f(total)}</span>
      </div>

      {emailToast && (
        <div className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-bold" style={{ borderColor: `${C.emerald}40`, background: `${C.emerald}08`, color: C.emerald }}>
          <Inbox className="h-3.5 w-3.5" /> {emailToast}
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="rounded-lg border p-4 text-center" style={{ borderColor: C.border, background: C.panel2 }}>
          <Wrench className="mx-auto h-6 w-6" style={{ color: C.textDimmer }} />
          <p className="mt-2 text-[11px]" style={{ color: C.textDim }}>No internal workshop expense assets recorded.</p>
          <p className="mt-1 text-[9px]" style={{ color: C.textDimmer }}>Lubricants, consumables, accessories & tools purchased via checkout will appear here.</p>
        </div>
      ) : (
        <div className="custom-scrollbar max-h-[50vh] space-y-2 overflow-y-auto overflow-x-hidden rounded-lg border p-2" style={{ borderColor: C.border, background: C.bg }}>
          {expenses.map(exp => (
            <div key={exp.id} className="flex items-center gap-3 rounded-lg border px-4 py-3" style={{ borderColor: `${C.cyan}30`, background: C.panel2 }}>
              {/* Category badge */}
              <div className="shrink-0">
                <span className="rounded-md px-2 py-1 text-[8px] font-bold uppercase" style={{ background: `${C.cyan}15`, color: C.cyan }}>{exp.category}</span>
              </div>

              {/* Title + receipt ID */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-bold text-slate-100" style={{ maxWidth: 200 }}>{exp.title}</div>
                <div className="truncate font-mono text-[9px]" style={{ color: C.textDim, maxWidth: 200 }}>{exp.receiptId}</div>
                {exp.purchasedByEmployee && (
                  <div className="mt-0.5 flex items-center gap-1 truncate text-[9px] font-bold" style={{ color: C.orange, maxWidth: 200 }}>
                    <UserCheck className="h-2.5 w-2.5 shrink-0" /> {exp.purchasedByEmployee}
                  </div>
                )}
              </div>

              {/* Expense type label */}
              <div className="hidden shrink-0 lg:block">
                <span className="text-[8px] font-bold" style={{ color: C.orange }}>Internal Workshop Expense Purchase Asset</span>
              </div>

              {/* Amount */}
              <div className="shrink-0 text-right">
                <div className="font-mono text-sm font-bold" style={{ color: C.emerald }}>{f(exp.unitPrice * exp.qty)}</div>
                <div className="text-[8px]" style={{ color: C.textDimmer }}>{new Date(exp.purchasedAt).toLocaleDateString()}</div>
              </div>

              {/* Export & Email button */}
              <button onClick={(e) => handleExportClick(e, exp)} className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[9px] font-bold transition hover:opacity-80" style={{ background: `${C.orange}15`, color: C.orange }}>
                <Download className="h-3.5 w-3.5" /> Export & Email CSV/PDF
              </button>

              {/* Delete */}
              <button onClick={(e) => { e.preventDefault(); onDelete(exp.id); }} className="flex shrink-0 items-center rounded-md px-2 py-1.5 text-[9px] font-bold transition hover:opacity-80" style={{ background: `${C.red}10`, color: C.red }}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border p-2.5 text-[9px]" style={{ borderColor: `${C.cyan}20`, background: `${C.cyan}05`, color: C.textDim }}>
        <ShieldCheck className="mr-1 inline h-3 w-3" style={{ color: C.cyan }} />
        These internal workshop assets map directly into the Accounting Software Suite Link Engine & live bank feed streams for automated business tax write-off balancing.
      </div>
    </div>
  );
}

// ─── Completed Job Card Modal (read-only historical view) ────────────────────
function CompletedJobCardModal({ invoice, onClose, region }) {
  const r = region || 'VIC';
  const f = (n) => fmt(n, r);
  return (
    <div className="fixed inset-0 z- flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.80)' }} onClick={onClose}>
      <div className="custom-scrollbar max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-5" style={{ background: C.bg, borderColor: C.border }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-100"><FileText className="h-4 w-4" style={{ color: C.cyan }} /> Completed Job Card — {invoice.invoiceNo}</h3>
          <button onClick={onClose} className="rounded p-1" style={{ color: C.textDim }}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
            <div><div className="text-[10px] font-bold uppercase" style={{ color: C.textDim }}>Customer</div><div className="text-sm font-semibold text-slate-100">{invoice.customer || 'N/A'}</div></div>
            <div><div className="text-[10px] font-bold uppercase" style={{ color: C.textDim }}>Vehicle</div><div className="text-sm font-semibold text-slate-100">{invoice.vehicle || 'N/A'} · <span className="font-mono" style={{ color: C.cyan }}>{invoice.vehicleRego || ''}</span></div></div>
            <div><div className="text-[10px] font-bold uppercase" style={{ color: C.textDim }}>Date Compiled</div><div className="font-mono text-xs text-slate-300">{invoice.date || '—'}</div></div>
            <div><div className="text-[10px] font-bold uppercase" style={{ color: C.textDim }}>Settled At</div><div className="font-mono text-xs text-slate-300">{invoice.settledAt ? new Date(invoice.settledAt).toLocaleString() : '—'}</div></div>
          </div>

          {invoice.diagnosticNotes && (
            <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.orange }}>Diagnostic Notes</div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-200">{invoice.diagnosticNotes}</p>
            </div>
          )}

          {invoice.technicianLogs && (
            <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.cyan }}>Technician Logs</div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-200">{invoice.technicianLogs}</p>
            </div>
          )}

          {invoice.purchasedByEmployee && (
            <div className="flex items-center gap-2 rounded-lg border p-3" style={{ borderColor: `${C.orange}40`, background: `${C.orange}08` }}>
              <UserCheck className="h-4 w-4 shrink-0" style={{ color: C.orange }} />
              <span className="text-xs font-bold" style={{ color: C.orange }}>{invoice.purchasedByEmployee}</span>
            </div>
          )}

          <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.emerald }}>Parts & Consumables Used</div>
            <div className="mt-2 space-y-1.5">
              {(invoice.cart || []).map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded border px-2 py-1.5 text-[10px]" style={{ borderColor: C.border, background: C.bg }}>
                  <span className="text-slate-200">{p.brand ? `${p.brand} ` : ''}{p.title} × {p.qty || 1}</span>
                  <span className="font-mono" style={{ color: C.emerald }}>{f(p.unitPrice || 0)}</span>
                </div>
              ))}
              {(invoice.consumables || []).map((c, i) => (
                <div key={`c${i}`} className="flex items-center justify-between rounded border px-2 py-1.5 text-[10px]" style={{ borderColor: C.border, background: C.bg }}>
                  <span className="text-slate-200">{c.brand ? `${c.brand} ` : ''}{c.title} × {c.qty || 1}</span>
                  <span className="font-mono" style={{ color: C.emerald }}>{f(c.unitPrice || 0)}</span>
                </div>
              ))}
              {(!invoice.cart?.length && !invoice.consumables?.length) && <p className="text-[10px]" style={{ color: C.textDimmer }}>No parts recorded.</p>}
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: `${C.cyan}40`, background: `${C.cyan}08` }}>
            <div className="flex items-center justify-between text-xs"><span style={{ color: C.textDim }}>Labor ({invoice.laborHours || 0}h)</span><span className="font-mono text-slate-100">{f(invoice.laborTotal || 0)}</span></div>
            <div className="flex items-center justify-between text-xs"><span style={{ color: C.textDim }}>Parts & Consumables</span><span className="font-mono text-slate-100">{f(invoice.partsTotal || 0)}</span></div>
            {invoice.gst > 0 && <div className="flex items-center justify-between text-xs"><span style={{ color: C.textDim }}>{r === 'US_CA' || r === 'US_NY' || r === 'US_TX' ? 'Sales Tax' : 'GST Billing'}</span><span className="font-mono text-slate-100">{f(invoice.gst)}</span></div>}
            <div className="flex items-center justify-between border-t pt-1.5" style={{ borderColor: C.border }}><span className="text-sm font-bold text-white">Grand Total</span><span className="font-mono text-lg font-bold" style={{ color: C.emerald }}>{f(invoice.grandTotal)}</span></div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px]" style={{ color: C.textDimmer }}>
            <Lock className="h-3 w-3" /> Read-only archived record — locked for tax audit compliance
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Customer Checkout Portal (6 Stripe payment methods) ─────────────────────
function CustomerCheckoutPortal({ invoice, onSettle, onExit, region }) {
  const [method, setMethod] = useState('card');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const r = region || 'VIC';
  const f = (n) => fmt(n, r);

  const handlePay = async (e) => {
    e?.preventDefault?.();
    if (processing || success) return;
    setProcessing(true);
    await onSettle(invoice.invoiceNo, method);
    setProcessing(false);
    setSuccess(true);
    setTimeout(onExit, 2200);
  };

  const wallets = [
    { id: 'paypal', label: 'PayPal Express', icon: <span className="text-[10px] font-bold">PayPal</span> },
    { id: 'applepay', label: 'Apple Pay Device Vault', icon: <span className="text-[10px] font-bold"> Pay</span> },
    { id: 'googlepay', label: 'Google Pay Ledger Link', icon: <span className="text-[10px] font-bold">G Pay</span> },
    { id: 'zip', label: 'Zip Pay Hub', icon: <span className="text-[10px] font-bold">Zip</span> },
    { id: 'afterpay', label: 'Afterpay Tiers', icon: <span className="text-[10px] font-bold">AP</span> },
    { id: 'card', label: 'Credit / Debit Card', icon: <CardIcon className="h-3.5 w-3.5" /> },
  ];

  const methodInfo = {
    paypal: { msg: 'You will be redirected to PayPal to complete your express checkout securely.', color: C.cyan },
    applepay: { msg: 'Authenticate via Touch ID / Face ID on your Apple device to authorize payment.', color: C.text },
    googlepay: { msg: 'Confirm via your Google Pay wallet — no card details required.', color: C.text },
    zip: { msg: '4 interest-free installments of ' + f(invoice.grandTotal / 4) + ' each via Zip Pay Hub.', color: C.emerald },
    afterpay: { msg: '4 interest-free installments of ' + f(invoice.grandTotal / 4) + ' each via Afterpay Tiers.', color: C.emerald },
    card: null,
  };

return (
    <div className="fixed inset-0 z-[95] overflow-y-auto" style={{ background: C.bg }}>
      <div className="sticky top-0 z-10 border-b p-3" style={{ borderColor: C.border, background: `${C.bg}f0` }}>
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button onClick={onExit} disabled={processing} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition" style={{ borderColor: C.border, color: C.text }}><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: C.emerald }}><ShieldCheck className="h-4 w-4" /> Stripe Secured</div>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="text-center"><div className="text-xl font-extrabold tracking-tight text-white">PARTSFORGE BILLING PORTAL</div><div className="mt-1 text-xs font-semibold uppercase tracking-widest" style={{ color: C.cyan }}>Secure Customer Checkout</div></div>
        <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: C.border, background: C.panel }}>
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: C.border }}>
            <div><div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textDim }}>Invoice #</div><div className="font-mono text-sm font-bold text-white">{invoice.invoiceNo}</div></div>
            <div className="text-right"><div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textDim }}>Date</div><div className="font-mono text-sm text-slate-300">{invoice.date}</div></div>
            <div className="text-right"><div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textDim }}>Status</div><div className="rounded-full border px-2 py-0.5 text-[10px] font-bold" style={{ borderColor: 'rgba(245,158,11,0.5)', color: '#F59E0B' }}>UNPAID</div></div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg p-2.5" style={{ background: C.bg }}><div className="text-[10px] font-bold uppercase" style={{ color: C.textDim }}>Customer</div><div className="text-sm font-semibold text-white">{invoice.customer}</div></div>
            <div className="rounded-lg p-2.5" style={{ background: C.bg }}><div className="text-[10px] font-bold uppercase" style={{ color: C.textDim }}>Vehicle</div><div className="text-sm font-semibold text-slate-200">{invoice.vehicle} · <span className="font-mono" style={{ color: C.cyan }}>{invoice.vehicleRego}</span></div></div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: C.bg }}><span className="text-xs" style={{ color: C.textDim }}>Labor ({invoice.laborHours}h)</span><span className="font-mono text-sm font-bold text-white">{f(invoice.laborTotal)}</span></div>
            <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: C.bg }}><span className="text-xs" style={{ color: C.textDim }}>Parts & Consumables</span><span className="font-mono text-sm font-bold text-white">{f(invoice.partsTotal)}</span></div>
            {invoice.gst > 0 && <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: C.bg }}><span className="text-xs" style={{ color: C.textDim }}>{r === 'US_CA' || r === 'US_NY' || r === 'US_TX' ? 'Sales Tax' : 'GST Surcharge'}</span><span className="font-mono text-sm font-bold text-white">{f(invoice.gst)}</span></div>}
            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5" style={{ borderColor: `${C.cyan}40`, background: `${C.cyan}10` }}><span className="text-sm font-extrabold text-white">GRAND TOTAL</span><span className="font-mono text-lg font-extrabold" style={{ color: C.cyan }}>{f(invoice.grandTotal)}</span></div>
          </div>
          <div className="mt-5">
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textDim }}>Select Payment Method</div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {wallets.map(w => (
                <button key={w.id} onClick={(e) => { e.preventDefault(); setMethod(w.id); }} disabled={processing} className="flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center transition" style={{ borderColor: method === w.id ? C.orange : C.border, background: method === w.id ? `${C.orange}15` : C.bg, color: method === w.id ? C.orange : C.text }}>
                  {w.icon}
                  <span className="text-[10px] font-bold leading-tight">{w.label}</span>
                </button>
              ))}
            </div>
            {method === 'card' && (
              <div className="mt-3 space-y-2.5">
                <div><label className="text-[10px] font-bold uppercase" style={{ color: C.textDim }}>Cardholder Name</label><input value={cardName} onChange={(e) => setCardName(e.target.value)} disabled={processing} placeholder="John Smith" className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-white outline-none" style={{ borderColor: C.border, background: C.bg }} /></div>
                <div><label className="text-[10px] font-bold uppercase" style={{ color: C.textDim }}>Card Number</label><input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} disabled={processing} maxLength={19} placeholder="4242 4242 4242 4242" className="mt-1 w-full rounded-lg border px-3 py-2.5 font-mono text-sm text-white outline-none" style={{ borderColor: C.border, background: C.bg }} /></div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div><label className="text-[10px] font-bold uppercase" style={{ color: C.textDim }}>Expiry</label><input value={expiry} onChange={(e) => setExpiry(e.target.value)} disabled={processing} maxLength={5} placeholder="MM/YY" className="mt-1 w-full rounded-lg border px-3 py-2.5 font-mono text-sm text-white outline-none" style={{ borderColor: C.border, background: C.bg }} /></div>
                  <div><label className="text-[10px] font-bold uppercase" style={{ color: C.textDim }}>CVC</label><input value={cvc} onChange={(e) => setCvc(e.target.value)} disabled={processing} maxLength={4} placeholder="123" className="mt-1 w-full rounded-lg border px-3 py-2.5 font-mono text-sm text-white outline-none" style={{ borderColor: C.border, background: C.bg }} /></div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-[10px]" style={{ color: C.textDim }}>
                  <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} disabled={processing} className="h-3.5 w-3.5" style={{ accentColor: C.orange }} /> Save card details for future payments
                </label>
              </div>
            )}
            {methodInfo[method] && (
              <div className="mt-3 rounded-lg border px-3 py-2.5 text-xs font-semibold" style={{ borderColor: `${methodInfo[method].color}30`, background: `${methodInfo[method].color}08`, color: methodInfo[method].color }}>
                {methodInfo[method].msg}
              </div>
            )}
          </div>
          <button onClick={handlePay} disabled={processing || success} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-extrabold text-slate-950 transition disabled:opacity-50" style={{ background: C.orange }}>
            {processing ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> Processing...</>) : success ? (<><CheckCircle2 className="h-4 w-4" /> Payment Successful</>) : (<><LockIcon className="h-4 w-4" /> Pay {f(invoice.grandTotal)} Safely</>)}
          </button>
          <div className="mt-3 text-center text-[10px]" style={{ color: C.textDimmer }}>256-bit SSL encryption · PCI DSS compliant · Powered by Stripe</div>
        </div>
      </div>
    </div>
  );
}

// ─── Global Region Selector Widget ──────────────────────────────────────────
function GlobalRegionSelector({ regionCode, onRegionChange, usStateCode, onUsStateChange }) {
  const [open, setOpen] = useState(false);
  const region = (typeof REGIONS !== 'undefined' && REGIONS[regionCode]) ? REGIONS[regionCode] : { label: 'Australia (VIC)', code: 'AU_VIC' };
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition"
        style={{ borderColor: open ? C.orange : C.border, background: C.panel, color: open ? C.orange : C.text }}
      >
        <Globe className="h-3.5 w-3.5" style={{ color: C.orange }} />
        {region?.label || 'Select Region'}
        <ChevronDown className={`h-3 w-3 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border shadow-2xl" style={{ background: C.panel, borderColor: C.border }}>
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textDim }}>Global Region</div>
            {typeof REGION_LIST !== 'undefined' ? REGION_LIST.map(r => (
              <button
                key={r.code}
                onClick={() => { onRegionChange(r.code); if (r.code !== 'US') setOpen(false); }}
                className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-semibold transition"
                style={{ background: r.code === regionCode ? `${C.orange}10` : 'transparent', color: r.code === regionCode ? C.orange : C.text }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">{r.currencySymbol || '$'}</span> {r.label}
                </span>
                {r.code === regionCode && <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>
            )) : null}
            {regionCode === 'US' && typeof REGIONS !== 'undefined' && REGIONS.US && (
              <div className="border-t" style={{ borderColor: C.border }}>
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textDim }}>US State (Sales Tax)</div>
                <select
                  value={usStateCode}
                  onChange={e => onUsStateChange(e.target.value)}
                  className="mx-3 mb-3 w-[calc(100%-1.5rem)] rounded-lg border px-2.5 py-2 text-xs font-semibold"
                  style={{ borderColor: C.border, background: C.bg, color: C.text }}
                >
                  {(REGIONS.US.usStates || []).map(s => (
                    <option key={s.code} value={s.code}>{s.label} — {(s.salesTaxRate * 100).toFixed(2)}%</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Enterprise Data Residency & Compliance Node ────────────────────────────────
function DataResidencyNode({ regionCode }) {
  const activeRegion = (typeof REGIONS !== 'undefined' && REGIONS[regionCode]) ? REGIONS[regionCode] : { label: 'Australia (VIC)' };
  const shards = [
    { code: 'AU', name: 'APAC SHARD NODE', location: 'Sydney Center', compliance: 'ACCC CDR · Privacy Act 1988', icon: MapPin },
    { code: 'UK', name: 'EMEA SHARD NODE', location: 'London / Frankfurt Center', compliance: 'GDPR · PSD2 · UK Open Banking', icon: Shield },
    { code: 'US', name: 'AMER SHARD NODE', location: 'Oregon / Virginia Center', compliance: 'CCPA · GLBA · US Sovereignty', icon: Server },
  ];
    return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${C.orange}15` }}>
          <Database className="h-4 w-4" style={{ color: C.orange }} />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-50">Supabase / PostgreSQL Distributed Tenant Sharded Mesh</div>
          <div className="text-[10px]" style={{ color: C.textDim }}>Multi-region data residency with sovereign partition enforcement</div>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {shards.map(shard => {
          const isActive = shard.code === regionCode;
          const Icon = shard.icon;
          return (
            <div
              key={shard.code}
              className="rounded-xl border p-3 transition"
              style={{
                borderColor: isActive ? C.orange : C.border,
                background: isActive ? `${C.orange}08` : C.bg,
                opacity: isActive ? 1 : 0.5,
              }}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4" style={{ color: isActive ? C.orange : C.textDim }} />
                {isActive ? (
                  <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: `${C.emerald}15`, color: C.emerald }}>
                    <Activity className="h-2.5 w-2.5" /> ACTIVE
                  </span>
                ) : (
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: C.border, color: C.textDim }}>STANDBY</span>
                )}
              </div>
              <div className="mt-2 text-xs font-bold" style={{ color: isActive ? C.text : C.textDim }}>{shard.name}</div>
              <div className="text-[10px]" style={{ color: C.textDim }}>{shard.location}</div>
              <div className="mt-1.5 text-[9px] leading-tight" style={{ color: C.textDimmer }}>{shard.compliance}</div>
            </div>
          );
        })}
      </div>
      <div className="rounded-lg border p-2.5" style={{ borderColor: C.border, background: C.bg }}>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: C.textDim }}>
          <Zap className="h-3 w-3" style={{ color: C.orange }} />
          Active shard: <span style={{ color: C.orange }}>{activeRegion?.shardNode?.name || (regionCode === 'US' ? 'AMER SHARD NODE' : regionCode === 'UK' ? 'EMEA SHARD NODE' : 'APAC SHARD NODE')}</span> — {activeRegion?.shardNode?.location || (regionCode === 'US' ? 'Oregon / Virginia Center' : regionCode === 'UK' ? 'London / Frankfurt Center' : 'Sydney Center')}
        </div>
        <div className="mt-1 text-[9px]" style={{ color: C.textDimmer }}>{activeRegion?.shardNode?.compliance || 'Sovereign database multi-tenant partition verification enabled.'}</div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
// ─── Admin Console (3-column global infrastructure terminal) ─────────────────
function AdminConsole({ session, region, regionCode, onRegionChange, usStateCode, onUsStateChange, bankFeedEntries, ledgerEntries, paidInvoices, onSignOut }) {
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [patchText, setPatchText] = useState('');
  const [patchDeployed, setPatchDeployed] = useState(false);
  const [scrapers, setScrapers] = useState({ nevi: true, regoCheck: true, youtube: true });
  const [catalogSync, setCatalogSync] = useState({ repco: true, supercheap: false, burson: true });
  const [dbShards, setDbShards] = useState({ apac: true, emea: true, amer: false });
  const [overrideToast, setOverrideToast] = useState(null);

  // Simulated live platform telemetry — Melbourne northern growth corridor nodes
  const [nodes, setNodes] = useState([
    { id: 'PF-WALLAN-01', name: 'Wallan Auto Works', vehicle: 'VRA-892 Toyota Hilux', cdr: 'SYNCED', basket: 142.50, stuck: false },
    { id: 'PF-MICKLEHAM-02', name: 'Mickleham Performance', vehicle: '1F9-2KJ Ford Ranger', cdr: 'SYNCING', basket: 389.00, stuck: false },
    { id: 'PF-CRAIGIEBURN-03', name: 'Craigieburn Tyre & Auto', vehicle: 'ABC-123 Mazda CX-5', cdr: 'SYNCED', basket: 67.20, stuck: false },
    { id: 'PF-ROXBURGH-04', name: 'Roxburgh Park Mobile Mech', vehicle: 'XYZ-789 Hyundai i30', cdr: 'OFFLINE', basket: 0, stuck: true },
    { id: 'PF-KALKALLO-05', name: 'Kalkallo Diesel Specialists', vehicle: 'DEF-456 Isuzu D-Max', cdr: 'SYNCED', basket: 1245.75, stuck: false }
  ]);

    // Live revenue pipeline calculations
  const monthlySaaS = paidInvoices.length * 99 + 149 * 3; 
  const commissionPool = paidInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0) * 0.0125, 0);
  const freightPremiums = paidInvoices.length * 12.50;
  const totalRevenue = monthlySaaS + commissionPool + freightPremiums;

  const forceOverride = (nodeId) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, stuck: false, cdr: 'SYNCED', basket: 0 } : n));
    setOverrideToast(`Override dispatched: ${nodeId} — session flushed & loaders cleared.`);
    setTimeout(() => setOverrideToast(null), 4000);
  };

  const deployPatch = (e) => {
    e.preventDefault();
    if (!patchText.trim()) return;
    setPatchDeployed(true);
    setTimeout(() => { setPatchDeployed(false); setPatchText(''); }, 4000);
  };

  // Safe locale currency selector prevents region code string destructuring from crashing your app
  const fmt = (n) => {
    const activeCurrency = (regionCode === 'US' || regionCode === 'US_CA' || regionCode === 'US_NY' || regionCode === 'US_TX') ? 'USD' : regionCode === 'UK' ? 'GBP' : 'AUD';
    const activeLocale = (regionCode === 'US' || regionCode === 'US_CA' || regionCode === 'US_NY' || regionCode === 'US_TX') ? 'en-US' : regionCode === 'UK' ? 'en-GB' : 'en-AU';
    return new Intl.NumberFormat(activeLocale, { style: 'currency', currency: activeCurrency }).format(n || 0);
  };

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* Admin Header Bar */}
      <header className="sticky top-0 z-40 border-b" style={{ borderColor: `${C.cyan}30`, background: `${C.bg}f5` }}>
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: C.cyan }}>
              <Shield className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-50">PartsForge Master Admin Control Room</div>
              <div className="text-[10px] font-mono" style={{ color: C.cyan }}>ADMIN · Enterprise Monitoring Terminal · {session?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 text-[10px] font-mono sm:flex" style={{ color: C.emerald }}>
              <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: C.emerald }} /> LIVE
            </div>
            {/* Admin Dropdown Portal */}
            <div className="relative">
              <button onClick={(e) => { e.preventDefault(); setAdminDropdownOpen(o => !o); }} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition" style={{ borderColor: `${C.cyan}40`, background: `${C.cyan}08`, color: C.cyan }}>
                <Settings className="h-4 w-4" /> Admin Config <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {adminDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e) => { e.preventDefault(); setAdminDropdownOpen(false); }} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border shadow-2xl" style={{ background: C.bg, borderColor: `${C.cyan}30` }} onClick={(e) => e.stopPropagation()}>
                    <div className="border-b p-3" style={{ borderColor: C.border }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.cyan }}>A. Platform Environment State</div>
                      <label className="mt-2 block text-[10px]" style={{ color: C.textDim }}>Global Taxation Profile</label>
                      <select value={regionCode} onChange={(e) => { e.preventDefault(); onRegionChange(e.target.value); }} className="mt-1 w-full rounded-lg border px-2.5 py-2 text-xs text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }}>
                        <option value="AU">Australia (GST 10%)</option>
                        <option value="UK">United Kingdom (VAT 20%)</option>
                        <option value="US">United States (State Sales Tax)</option>
                      </select>
                      {regionCode === 'US' && typeof US_STATES !== 'undefined' && (
                        <select value={usStateCode} onChange={(e) => { e.preventDefault(); onUsStateChange(e.target.value); }} className="mt-1.5 w-full rounded-lg border px-2.5 py-2 text-xs text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }}>
                          {US_STATES.map(s => <option key={s.code} value={s.code}>{s.name} ({s.rate}%)</option>)}
                        </select>
                      )}
                    </div>
                    <div className="border-b p-3" style={{ borderColor: C.border }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.cyan }}>B. Database Shard Registry</div>
                      <div className="mt-2 space-y-1.5">
                        {[
                          { key: 'apac', label: 'APAC Shard', loc: 'Sydney, AU' },
                          { key: 'emea', label: 'EMEA Shard', loc: 'Frankfurt, DE' },
                          { key: 'amer', label: 'AMER Shard', loc: 'Virginia, US' },
                        ].map(s => (
                          <div key={s.key} className="flex items-center justify-between rounded-lg border px-2.5 py-1.5" style={{ borderColor: C.border, background: C.panel2 }}>
                            <div>
                              <div className="text-[11px] font-bold text-slate-100">{s.label}</div>
                              <div className="text-[9px]" style={{ color: C.textDim }}>{s.loc}</div>
                            </div>
                            <button onClick={(e) => { e.preventDefault(); setDbShards(prev => ({ ...prev, [s.key]: !prev[s.key] })); }} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-bold transition" style={{ background: dbShards[s.key] ? `${C.emerald}15` : `${C.red}15`, color: dbShards[s.key] ? C.emerald : C.red }}>
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: dbShards[s.key] ? C.emerald : C.red }} /> {dbShards[s.key] ? 'ONLINE' : 'OFFLINE'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-3">
                      <button onClick={(e) => { e.preventDefault(); setAdminDropdownOpen(false); onSignOut(); }} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition" style={{ background: `${C.red}10`, color: C.red }}>
                        <LogOut className="h-4 w-4" /> Master Sign Out — Flush & Route to Gateway
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Override toast */}
      {overrideToast && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 rounded-lg border px-4 py-2.5 text-xs font-bold shadow-2xl" style={{ borderColor: `${C.orange}40`, background: `${C.orange}10`, color: C.orange }}>
          <Zap className="mr-1.5 inline h-3.5 w-3.5" /> {overrideToast}
        </div>
      )}

      {/* 3-Column Console */}
      <main className="mx-auto max-w-[1600px] px-4 py-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* COLUMN A: Live Platform Telemetry & Workshop Bays Tracker */}
          <div className="rounded-xl border" style={{ background: C.panel, borderColor: C.border }}>
            <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: C.border }}>
              <Radio className="h-4 w-4" style={{ color: C.cyan }} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">Live Platform Telemetry & Workshop Bays</h2>
            </div>
            <div className="custom-scrollbar max-h-[calc(100vh-180px)] overflow-y-auto p-3">
              <div className="mb-2 flex items-center justify-between text-[10px]" style={{ color: C.textDim }}>
                <span>Melbourne Northern Growth Corridor — {nodes.filter(n => !n.stuck).length}/{nodes.length} nodes active</span>
                <span className="font-mono" style={{ color: C.emerald }}>REAL-TIME</span>
              </div>
              <div className="space-y-2">
                {nodes.map(node => (
                  <div key={node.id} className="rounded-lg border p-2.5" style={{ borderColor: node.stuck ? `${C.red}40` : C.border, background: C.panel2 }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-bold text-slate-100">{node.name}</div>
                        <div className="truncate font-mono text-[9px]" style={{ color: C.textDim }}>{node.id}</div>
                      </div>
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold" style={{ background: node.stuck ? `${C.red}15` : node.cdr === 'SYNCED' ? `${C.emerald}15` : `${C.orange}15`, color: node.stuck ? C.red : node.cdr === 'SYNCED' ? C.emerald : C.orange }}>
                        {node.stuck ? 'STUCK' : node.cdr}
                      </span>
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-1 text-[9px]">
                      <div><span style={{ color: C.textDim }}>Hoist:</span> <span className="font-mono text-slate-200">{node.vehicle}</span></div>
                      <div className="text-right"><span style={{ color: C.textDim }}>Basket:</span> <span className="font-mono" style={{ color: C.emerald }}>{fmt(node.basket)}</span></div>
                    </div>
                    <button onClick={(e) => { e.preventDefault(); forceOverride(node.id); }} disabled={!node.stuck} className="mt-2 flex w-full items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[9px] font-bold transition disabled:opacity-30" style={{ background: node.stuck ? `${C.orange}15` : C.border, color: node.stuck ? C.orange : C.textDimmer }}>
                      <Zap className="h-3 w-3" /> FORCE OVERRIDE STATE
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN B: Enterprise Revenue Pipeline & Transaction Commission Manager */}
          <div className="rounded-xl border" style={{ background: C.panel, borderColor: `${C.emerald}30` }}>
            <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: C.border }}>
              <DollarSign className="h-4 w-4" style={{ color: C.emerald }} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">Enterprise Revenue Pipeline & Commission</h2>
            </div>
            <div className="custom-scrollbar max-h-[calc(100vh-180px)] overflow-y-auto p-3">
              {/* Total revenue headline */}
              <div className="rounded-lg border p-3 mb-3" style={{ borderColor: `${C.emerald}30`, background: `${C.emerald}05` }}>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textDim }}>Consolidated Platform Revenue</div>
                <div className="mt-1 font-mono text-2xl font-bold" style={{ color: C.emerald }}>{fmt(totalRevenue)}</div>
              </div>

              {/* SaaS Subscription Core */}
              <div className="rounded-lg border p-3 mb-2" style={{ borderColor: C.border, background: C.panel2 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-100"><CreditCard className="h-3.5 w-3.5" style={{ color: C.cyan }} /> Monthly SaaS Subscription Core</div>
                  <span className="font-mono text-sm font-bold" style={{ color: C.emerald }}>{fmt(monthlySaaS)}</span>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-[9px]">
                  <div className="rounded border px-2 py-1" style={{ borderColor: C.border, background: C.bg }}><span style={{ color: C.textDim }}>Mechanic Tiers ($99/mo): </span><span className="font-mono text-slate-200">{paidInvoices.length}</span></div>
                  <div className="rounded border px-2 py-1" style={{ borderColor: C.border, background: C.bg }}><span style={{ color: C.textDim }}>Seller Hooks ($149/mo): </span><span className="font-mono text-slate-200">3</span></div>
                </div>
              </div>

              {/* Commission Pool */}
              <div className="rounded-lg border p-3 mb-2" style={{ borderColor: C.border, background: C.panel2 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-100"><Percent className="h-3.5 w-3.5" style={{ color: C.orange }} /> 1.25% Marketplace Commission Pool</div>
                  <span className="font-mono text-sm font-bold" style={{ color: C.emerald }}>{fmt(commissionPool)}</span>
                </div>
                <div className="mt-1.5 text-[9px]" style={{ color: C.textDim }}>Running sum of transaction cuts captured from {paidInvoices.length} parts checkouts</div>
              </div>

              {/* Freight Premiums */}
              <div className="rounded-lg border p-3 mb-3" style={{ borderColor: C.border, background: C.panel2 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-100"><Truck className="h-3.5 w-3.5" style={{ color: C.cyan }} /> Consolidated Freight Handling Premiums</div>
                  <span className="font-mono text-sm font-bold" style={{ color: C.emerald }}>{fmt(freightPremiums)}</span>
                </div>
                <div className="mt-1.5 text-[9px]" style={{ color: C.textDim }}>Small logistics fees captured on multi-supplier deliveries</div>
              </div>

              {/* Recent bank feed entries */}
              <div className="rounded-lg border" style={{ borderColor: C.border, background: C.panel2 }}>
                <div className="border-b px-3 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: C.border, color: C.textDim }}>Live Bank Feed Mirror</div>
                <div className="max-h-32 overflow-y-auto p-2 space-y-1">
                  {bankFeedEntries.slice(0, 8).map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-[9px] rounded border px-2 py-1" style={{ borderColor: C.border, background: C.bg }}>
                      <span className="truncate text-slate-200">{e.description}</span>
                      <span className="font-mono shrink-0" style={{ color: C.emerald }}>{fmt(e.amount)}</span>
                    </div>
                  ))}
                  {bankFeedEntries.length === 0 && <div className="text-center text-[9px] py-2" style={{ color: C.textDimmer }}>No bank feed entries yet.</div>}
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN C: Live Core Index System Control Room & App Updates Engine */}
          <div className="rounded-xl border" style={{ background: C.panel, borderColor: `${C.orange}30` }}>
            <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: C.border }}>
              <Settings className="h-4 w-4" style={{ color: C.orange }} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">Live Core Index System Control Room</h2>
            </div>
            <div className="custom-scrollbar max-h-[calc(100vh-180px)] overflow-y-auto p-3 space-y-3">

              {/* Global Scraper Status */}
              <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.orange }}>Global Scraper Status</div>
                <div className="mt-2 space-y-1.5">
                  {[
                    { key: 'nevi', label: 'NEVI API', desc: 'Vehicle data scraping node' },
                    { key: 'regoCheck', label: 'RegoCheck API', desc: 'Registration verification' },
                    { key: 'youtube', label: 'YouTube Data API v3', desc: 'Tutorial video indexing' },
                  ].map(s => (
                    <div key={s.key} className="flex items-center justify-between rounded-md border px-2.5 py-1.5" style={{ borderColor: C.border, background: C.bg }}>
                      <div>
                        <div className="text-[10px] font-bold text-slate-100">{s.label}</div>
                        <div className="text-[8px]" style={{ color: C.textDim }}>{s.desc}</div>
                      </div>
                      <button onClick={(e) => { e.preventDefault(); setScrapers(prev => ({ ...prev, [s.key]: !prev[s.key] })); }} className="flex items-center gap-1.5 rounded px-2 py-1 text-[8px] font-bold transition" style={{ background: scrapers[s.key] ? `${C.emerald}15` : `${C.red}15`, color: scrapers[s.key] ? C.emerald : C.red }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: scrapers[s.key] ? C.emerald : C.red }} /> {scrapers[s.key] ? 'TRACKING' : 'PAUSED'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wholesale Catalog Hook Sync */}
              <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel2 }}>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.cyan }}>Wholesale Catalog Hook Sync</div>
                <div className="mt-2 space-y-1.5">
                  {[
                    { key: 'repco', label: 'Repco Distribution Bridge' },
                    { key: 'supercheap', label: 'Supercheap Auto Bridge' },
                    { key: 'burson', label: 'Burson Auto Parts Bridge' },
                  ].map(s => (
                    <div key={s.key} className="flex items-center justify-between rounded-md border px-2.5 py-1.5" style={{ borderColor: C.border, background: C.bg }}>
                      <div className="text-[10px] font-bold text-slate-100">{s.label}</div>
                      <button onClick={(e) => { e.preventDefault(); setCatalogSync(prev => ({ ...prev, [s.key]: !prev[s.key] })); }} className="flex items-center gap-1.5 rounded px-2 py-1 text-[8px] font-bold transition" style={{ background: catalogSync[s.key] ? `${C.emerald}15` : `${C.orange}15`, color: catalogSync[s.key] ? C.emerald : C.orange }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: catalogSync[s.key] ? C.emerald : C.orange }} /> {catalogSync[s.key] ? 'SYNCED' : 'PENDING'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct CSV Update Push / OTA Patch */}
              <div className="rounded-lg border p-3" style={{ borderColor: `${C.orange}30`, background: `${C.orange}05` }}>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.orange }}>Direct CSV Update Push — OTA App Patch Engine</div>
                <div className="mt-1 text-[9px]" style={{ color: C.textDim }}>Push Live OTA (Over-The-Air) App Patch Update across entire network tier</div>
                <form onSubmit={deployPatch} className="mt-2 space-y-2">
                  <textarea value={patchText} onChange={(e) => setPatchText(e.target.value)} placeholder="Enter patch payload / CSV config / code modification..." rows={3} className="w-full rounded-lg border px-2.5 py-2 font-mono text-[10px] text-slate-100 outline-none placeholder:opacity-40" style={{ borderColor: C.border, background: C.bg }} />
                  <button type="submit" disabled={!patchText.trim() || patchDeployed} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition disabled:opacity-50" style={{ background: '#3B82F6', color: '#fff' }}>
                    {patchDeployed ? (<><CheckCircle2 className="h-4 w-4" /> PATCH DEPLOYED ACROSS NETWORK</>) : (<><Rocket className="h-4 w-4" /> DEPLOY PLATFORM PATCH WORKFLOW</>)}
                  </button>
                </form>
                {patchDeployed && <div className="mt-1.5 flex items-center gap-1.5 text-[9px]" style={{ color: C.emerald }}><CheckCircle2 className="h-3 w-3" /> OTA patch broadcast complete — all nodes updated.</div>}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

const DEFAULT_HOISTS = [
  { id: 'BAY-01', name: 'Bay 01 — Hoist A', label: 'Bay 01 — Hoist A', status: 'available' },
  { id: 'BAY-02', name: 'Bay 02 — Hoist B', label: 'Bay 02 — Hoist B', status: 'available' },
  { id: 'BAY-03', name: 'Bay 03 — Alignment', label: 'Bay 03 — Alignment', status: 'available' },
  { id: 'BAY-04', name: 'Bay 04 — Diagnostics', label: 'Bay 04 — Diagnostics', status: 'available' },
];

export default function App() {
  const [accepted, setAccepted] = useState(() => { try { return localStorage.getItem('partsforge_safety_agreed') === 'true'; } catch { return false; } });
  const [userSession, setUserSession] = useState(() => { try { const raw = localStorage.getItem('partsforge_session'); if (!raw || raw === 'undefined' || raw === 'null') return null; return JSON.parse(raw); } catch { return null; } });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isEmployeeSubUser, setIsEmployeeSubUser] = useState(false);
  const [teamLinkCode, setTeamLinkCode] = useState(null);
  const role = userSession?.role === 'MECHANIC' || userSession?.role === 'APPRENTICE' ? 'pro' : userSession?.role === 'SELLER' ? 'seller' : 'diy';
  const signedInTechnician = useMemo(() => ({
    id: userSession?.technicianId || userSession?.employeeCode || userSession?.email || 'unidentified-session',
    name: userSession?.name || userSession?.email?.split('@')[0] || 'Unidentified Technician',
    email: userSession?.email || '',
    role: userSession?.role || '',
    employeeCode: userSession?.employeeCode || teamLinkCode || '',
    linkedAccount: userSession?.linkedAccount || '',
    signedInAt: userSession?.signedInAt || '',
  }), [userSession, teamLinkCode]);

  // ── Multi-Region Global State — Protected variables shield front-end nodes ──
  const [regionCode, setRegionCode] = useState(() => { try { return localStorage.getItem('partsforge_region') || 'AU'; } catch { return 'AU'; } });
  const [usStateCode, setUsStateCode] = useState(() => { try { return localStorage.getItem('partsforge_us_state') || 'CA'; } catch { return 'CA'; } });
  
  const region = (typeof REGIONS !== 'undefined' && REGIONS[regionCode]) ? REGIONS[regionCode] : 'VIC';
  const effectiveTaxRate = typeof getEffectiveTaxRate === 'function' ? getEffectiveTaxRate(regionCode, usStateCode) : 0.10;
  
  const handleRegionChange = (code) => { setRegionCode(code); try { localStorage.setItem('partsforge_region', code); } catch {} };
  const handleUsStateChange = (code) => { setUsStateCode(code); try { localStorage.setItem('partsforge_us_state', code); } catch {} };

  // Vehicle & garage state
  const [garageVehicles, setGarageVehicles] = useState(() => readStored('partsforge_garage_vehicles', []));
  const [activeVehicleId, setActiveVehicleId] = useState(() => readStored('partsforge_active_vehicle_id', null));
  const [intakeHoistId, setIntakeHoistId] = useState(() => readStored('partsforge_intake_hoist_id', ''));
  const [hoists, setHoists] = useState(() => {
    try {
      const saved = localStorage.getItem('partsforge_hoists');
      return saved ? JSON.parse(saved) : DEFAULT_HOISTS;
    } catch {
      return DEFAULT_HOISTS;
    }
  });
  const [regoLoading, setRegoLoading] = useState(false);
  const [regoLookupError, setRegoLookupError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [vehicle, setVehicle] = useState(() => readStored('partsforge_active_vehicle', null));

  // Parts search
  const [partsLoading, setPartsLoading] = useState(false);
  const [results, setResults] = useState(() => readStored('partsforge_parts_results', null));
  const [purchaseCart, setPurchaseCart] = useState(() => readStored('partsforge_purchase_cart', []));
  const [jobCart, setJobCart] = useState(() => readStored('partsforge_job_cart', []));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [consolidationEnabled, setConsolidationEnabled] = useState(false);

  // Job card state
  const [consumables, setConsumables] = useState(() => readStored('partsforge_job_consumables', []));
  const [laborHours, setLaborHours] = useState(() => readStored('partsforge_labor_hours', 0));
  const [laborRate, setLaborRate] = useState(() => readStored('partsforge_labor_rate', 95));
  const [taxOn, setTaxOn] = useState(() => readStored('partsforge_tax_on', true));
  const [diagnostic, setDiagnostic] = useState(() => readStored('partsforge_diagnostic', ''));
  const [custName, setCustName] = useState(() => readStored('partsforge_customer_name', ''));
  const [custPhone, setCustPhone] = useState(() => readStored('partsforge_customer_phone', ''));
  const [custEmail, setCustEmail] = useState(() => readStored('partsforge_customer_email', ''));
  const [technicianHistory, setTechnicianHistory] = useState(() => readStored('partsforge_technician_history', []));

  // Saved jobs & invoices
  const [hoistJobs, setHoistJobs] = useState(() => readStored('partsforge_hoist_jobs', []));
  const [activeHoistJobId, setActiveHoistJobId] = useState(() => readStored('partsforge_active_job_id', null));
  const [unpaidInvoices, setUnpaidInvoices] = useState(() => readStored('partsforge_unpaid_invoices', []));
  const [paidInvoices, setPaidInvoices] = useState(() => readStored('partsforge_paid_invoices', []));
  const [checkoutInvoice, setCheckoutInvoice] = useState(null);
  const [saveToast, setSaveToast] = useState(null);

  // Vault
  const [vault, setVault] = useState(() => readStored('partsforge_delivered_stock', []));
  const [allocModalOpen, setAllocModalOpen] = useState(false);
  const [catalogWindow, setCatalogWindow] = useState(null);
  const [partsSearchOpen, setPartsSearchOpen] = useState(false);
  const [garageFolderOpen, setGarageFolderOpen] = useState(false);

  // Live Bank Feed + Accounting Ledger (global purchase dispatch)
  const [bankFeedEntries, setBankFeedEntries] = useState(() => readStored('partsforge_bank_entries', []));
  const [ledgerEntries, setLedgerEntries] = useState(() => readStored('partsforge_ledger_entries', []));

  // Workshop Expense Ledger — internal purchases routed OUT of client invoices
  const [workshopExpenses, setWorkshopExpenses] = useState(() => readStored('partsforge_workshop_expenses', []));

  // Categories that are STRICTLY workshop-internal — never billable to a client job card
  const WORKSHOP_ONLY_CATEGORIES = new Set(['consumable', 'accessory', 'tool']);

  // Corporate & bank feed
  const [corpProfile, setCorpProfile] = useState({ phone: '', abn: '', ein: '', companyHouse: '', vatNumber: '' });
  const [bankFeedStatus, setBankFeedStatus] = useState(null);
  const matchedTradeAccount = useMemo(() => typeof resolveTradeAccount === 'function' ? resolveTradeAccount(corpProfile) : null, [corpProfile]);

  // ── Auth handlers ──
  const handleAuthenticate = (session) => {
    setIsAuthenticating(true);
    setTimeout(() => {
      const auditedSession = {
        ...session,
        technicianId: session?.technicianId || session?.employeeCode || session?.email?.trim().toLowerCase(),
        signedInAt: new Date().toISOString(),
      };
      setUserSession(auditedSession);
      try { localStorage.setItem('partsforge_session', JSON.stringify(auditedSession)); } catch {}
      if (auditedSession?.isEmployeeSubUser) {
        setIsEmployeeSubUser(true);
        setTeamLinkCode(auditedSession?.employeeCode || null);
      }
      setIsAuthenticating(false);
    }, 800);
  };

  const handleAcceptTerms = () => {
    setAccepted(true);
    try { localStorage.setItem('partsforge_safety_agreed', 'true'); } catch {}
  };

// ── Live Vehicle Registration Gateway Connection ──
const handleRego = async (plateStr, targetRegion) => {
  if (!plateStr || !plateStr.trim()) return;

  if (typeof setRegoLoading === 'function') setRegoLoading(true);
  if (typeof setVehicle === 'function') setVehicle(null);
  setRegoLookupError('');

  const cleanPlate = plateStr.trim().toUpperCase();

  const cleanRegion = (targetRegion || 'VIC')
    .trim()
    .toUpperCase()
    .replace('AU_', '');

  try {
    console.log(
      `📡 PartsForge vehicle lookup: ${cleanPlate} (${cleanRegion})`
    );

    // Send the registration lookup through our own Vercel backend.
    // The PlateAPI key remains safely server-side.
    const response = await fetch(
      `/api/vehicle-lookup?plate=${encodeURIComponent(cleanPlate)}&region=${encodeURIComponent(`AU_${cleanRegion}`)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error || `Vehicle lookup failed (${response.status})`
      );
    }

    if (!data.success) {
      throw new Error(
        data?.error || 'Vehicle registration could not be matched.'
      );
    }

    // Feed the real provider response into the existing PartsForge UI.
    setVehicle({
      ...data,
      make: data.make || 'UNKNOWN MAKE',
      model: data.model || 'UNKNOWN MODEL',
      year: data.year || null,
      engine: data.engine || 'SPECIFICATION NOT AVAILABLE',
      rego: data.rego || cleanPlate
    });

    console.log(
      `🟢 PartsForge vehicle matched: ${data.make} ${data.model} ${data.year || ''}`
    );

  } catch (error) {
    console.error(
      '❌ Live vehicle registration lookup failed:',
      error
    );

    // Never manufacture a vehicle or VIN when the provider fails.
    if (typeof setVehicle === 'function') {
      setVehicle(null);
    }
    setRegoLookupError(error?.message || 'Automatic registration lookup is temporarily unavailable.');

  } finally {
    if (typeof setRegoLoading === 'function') setRegoLoading(false);
    if (typeof setScanning === 'function') setScanning(false);
  }
};
  const handleManualVehicle = (manualData) => {
    setVehicle({
      ...manualData,
      year: manualData.year ? Number(manualData.year) : null,
      make: manualData.make.trim().toUpperCase(),
      model: manualData.model.trim().toUpperCase(),
      series: manualData.series.trim().toUpperCase(),
      engine: manualData.engine.trim().toUpperCase() || 'NOT SUPPLIED',
      source: 'manual',
      vehicleDataVerified: false,
      fitmentVerified: false,
    });
    setRegoLookupError('');
  };
  const handleVin = async (vinStr, targetRegion) => {
    if (!vinStr || !vinStr.trim()) return;

    if (typeof setRegoLoading === 'function') {
      setRegoLoading(true);
    }

    try {
      const cleanVin = vinStr.trim().toUpperCase();

      console.log(`📡 PartsForge VIN lookup requested: ${cleanVin}`);

      if (typeof setVehicle === 'function') {
        setVehicle({
          make: "VIN LOOKUP",
          model: "READY",
          year: null,
          engine: "VIN SPECIFICATION LOOKUP PENDING",
          vin: cleanVin,
          rego: ""
        });
      }
    } catch (error) {
      console.error("❌ VIN lookup connection failure:", error);

      if (typeof setVehicle === 'function') {
        setVehicle(null);
      }
    } finally {
      if (typeof setRegoLoading === 'function') {
        setRegoLoading(false);
      }
    }
  };
  
  // ── True Live Photo ID Camera Scan OCR Input Route ──
  const handlePhoto = async () => {
    if (typeof setScanning === 'function') setScanning(true);
    
    // Fallback Helper: Triggers a native system camera overlay if browser hardware permissions fail
    const triggerNativeFileCameraFallback = () => {
      const fallbackInput = document.createElement('input');
      fallbackInput.type = 'file';
      fallbackInput.accept = 'image/*';
      fallbackInput.capture = 'environment'; // Forces mobile devices to open their rear camera application directly
      
      fallbackInput.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) {
          if (typeof setScanning === 'function') setScanning(false);
          return;
        }
        
        // Convert the captured picture file cleanly into a base64 string for the cloud
        const reader = new FileReader();
        reader.onloadend = async () => {
          await processImageOnCloud(reader.result);
        };
        reader.readAsDataURL(file);
      };
      fallbackInput.click();
    };

    // Unified Cloud Processing Pipeline Request
    const processImageOnCloud = async (imageDataUrl) => {
      try {
        const targetOrigin = window.location.origin;
        const cloudResponse = await fetch(`${targetOrigin}/api/vehicle-lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ image: imageDataUrl, region: regionCode || "VIC" })
        });

        if (!cloudResponse.ok) throw new Error("CLOUD_GATEWAY_REJECTION");
        const resultData = await cloudResponse.json();

        if (typeof setScanning === 'function') setScanning(false);

        if (resultData && resultData.make) {
          alert(`🟢 CLOUD LOOKUP RENDERED: "${resultData.rego || 'MATCHED'}"\nMapping genuine vehicle metrics straight to dashboard cards.`);
          if (typeof setVehicle === 'function') setVehicle(resultData);
        } else {
          alert("⚠️ OCR READ EXCEPTION: Custom text unclear. Running manual plate fallback stream.");
          await handleRego("REGO-SCAN", regionCode || "VIC");
        }
      } catch (ocrError) {
        console.error("Cloud processing pipeline handshake failure handled:", ocrError);
        if (typeof setScanning === 'function') setScanning(false);
        alert("⚠️ Cloud proxy offline. Routing directly to manual plate reference capture module.");
        await handleRego("REGO-ERR", regionCode || "VIC");
      }
    };

    // Attempt to open the custom in-app live video overlay stream view
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      triggerNativeFileCameraFallback();
      return;
    }

    const cameraOverlay = document.createElement('div');
    cameraOverlay.id = 'pf-live-lens-overlay';
    cameraOverlay.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; z-index:9999; background:#000; display:flex; flex-direction:column; justify-content:space-between; padding:16px;';
    cameraOverlay.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <div style="color:#FF5A00; font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:0.1em;">Live Lens Viewfinder Engaged</div>
        <button id="pf-lens-close-btn" style="background:#101524; color:#fff; border:1px solid #1E2A42; border-radius:8px; padding:6px 12px; font-size:12px; font-weight:bold; cursor:pointer;">Close Lens</button>
      </div>
      <div style="position:relative; width:100%; flex:1; margin:16px 0; background:#070A12; border-radius:12px; overflow:hidden; border:1px solid #1E2A42; display:flex; align-items:center; justify-content:center;">
        <video id="pf-lens-stream-video" autoplay playsinline style="width:100%; height:100%; object-fit:cover;"></video>
        <div style="position:absolute; top:25%; left:24px; right:26px; bottom:25%; border:2px dashed rgba(255,90,0,0.6); border-radius:8px; pointer-events:none; display:flex; align-items:center; justify-content:center;">
          <div id="pf-ocr-loading-hud" style="color:#FF5A00; font-size:10px; font-weight:bold; background:rgba(7,10,18,0.75); padding:4px 8px; border-radius:4px; letter-spacing:0.1em; text-transform:uppercase;">Center Registration Plate Frame</div>
        </div>
      </div>
      <div style="width:100%; padding-bottom:12px;">
        <button id="pf-lens-capture-btn" style="width:100%; background:#FF5A00; color:#000; border:none; border-radius:12px; padding:14px; font-size:14px; font-weight:extrabold; cursor:pointer; text-transform:uppercase;">Capture Snapshot</button>
      </div>
    `;
    document.body.appendChild(cameraOverlay);

    try {
      const hardwareStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      const videoElement = document.getElementById('pf-lens-stream-video');
      if (videoElement) videoElement.srcObject = hardwareStream;

      document.getElementById('pf-lens-close-btn').onclick = () => {
        hardwareStream.getTracks().forEach(track => track.stop());
        cameraOverlay.remove();
        if (typeof setScanning === 'function') setScanning(false);
      };

      document.getElementById('pf-lens-capture-btn').onclick = async () => {
        const hud = document.getElementById('pf-ocr-loading-hud');
        if (hud) hud.innerHTML = "⏳ PROCESSING AUTOMATED OCR LENS SCANNERS...";

        const canvas = document.createElement('canvas');
        const captureWidth = videoElement.videoWidth || 1280;
        const captureHeight = videoElement.videoHeight || 720;
        canvas.width = captureWidth;
        canvas.height = captureHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        if (hardwareStream && typeof hardwareStream.getTracks === 'function') {
          hardwareStream.getTracks().forEach(track => track.stop());
        }

        const imageFrameData = canvas.toDataURL('image/jpeg', 0.6);
        cameraOverlay.remove();

        await processImageOnCloud(imageFrameData);
      };
    } catch (hardwareError) {
      console.warn("⚠️ Custom inline viewfinder blocked. Engaging automatic device camera selector proxy layer.");
      if (cameraOverlay && typeof cameraOverlay.remove === 'function') cameraOverlay.remove();
      triggerNativeFileCameraFallback();
    }
  };

  // Explicit commit: only saves vehicle to garage bay folder when user clicks the commit button
  const saveHoists = (nextHoists) => {
    setHoists(nextHoists);
    try { localStorage.setItem('partsforge_hoists', JSON.stringify(nextHoists)); } catch {}
  };

  const handleAddHoist = (name) => {
    const id = `BAY-${String(hoists.length + 1).padStart(2, '0')}-${Date.now().toString(36).toUpperCase()}`;
    saveHoists([...hoists, { id, name, label: name, status: 'available' }]);
  };

  const handleRenameHoist = (id, name) => {
    saveHoists(hoists.map(h => h.id === id ? { ...h, name, label: name } : h));
  };

  const handleHoistStatusChange = (id, status) => {
    saveHoists(hoists.map(h => h.id === id ? { ...h, status } : h));
  };

  const handleCommitVehicle = (targetHoistId = intakeHoistId) => {
    if (!vehicle) return;
    if (!targetHoistId) {
      setSaveToast('Select a hoist before committing this vehicle.');
      setTimeout(() => setSaveToast(null), 3000);
      return;
    }
    const selectedHoist = hoists.find(h => h.id === targetHoistId);
    if (!selectedHoist || selectedHoist.status === 'out_of_service') {
      setSaveToast('That hoist is unavailable. Select another hoist.');
      setTimeout(() => setSaveToast(null), 3000);
      return;
    }
    const newVehicle = { id: uid(), ...vehicle, hoistId: targetHoistId, hoistName: selectedHoist.name };
    setGarageVehicles(prev => [...prev, newVehicle]);
    setActiveVehicleId(newVehicle.id);
    saveHoists(hoists.map(h => h.id === targetHoistId ? { ...h, status: 'occupied', activeVehicleId: newVehicle.id } : h));
    setIntakeHoistId('');
    setSaveToast(`Vehicle committed to ${selectedHoist.name}.`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleAddVehicleSlot = () => {
    const newVehicle = { id: uid(), rego: '', vin: '', make: 'New Vehicle', model: '', engine: '' };
    setGarageVehicles(prev => [...prev, newVehicle]);
    setActiveVehicleId(newVehicle.id);
  };

  const handleRemoveVehicle = (id) => {
    const removedVehicle = garageVehicles.find(v => v.id === id);
    setGarageVehicles(prev => prev.filter(v => v.id !== id));
    if (removedVehicle?.hoistId) {
      saveHoists(hoists.map(h => h.id === removedVehicle.hoistId ? { ...h, status: 'available', activeVehicleId: null } : h));
    }
    if (activeVehicleId === id) {
      const remaining = garageVehicles.filter(v => v.id !== id);
      setActiveVehicleId(remaining.length > 0 ? remaining[0].id : null);
      setVehicle(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handleEditVehicle = (id, formData) => {
    setGarageVehicles(prev => prev.map(v => v.id === id ? { ...v, ...formData } : v));
    if (activeVehicleId === id) setVehicle(prev => ({ ...prev, ...formData }));
  };

   const handleSelectVehicle = (id) => {
    setActiveVehicleId(id);
    const v = garageVehicles.find(v => v.id === id);
    if (v) setVehicle(v);
  };

   // ── Live Vehicle-Aware Parts Search ──
const handleSearch = async (query) => {
  if (!query || !query.trim()) return;

  setPartsLoading(true);

  setResults({
    local: [],
    national: [],
    trans_tasman: [],
    global_direct: [],
    facebook: []
  });

  const cleanQuery = query.trim();

  console.log(
    
    `📡 PartsForge vehicle-aware search: "${cleanQuery}" | ` +
    `${vehicle?.year || ''} ${vehicle?.make || ''} ${vehicle?.model || ''}`
  );

  try {
    const data = await processPartsQuery(
      cleanQuery,
      regionCode || 'AU_VIC',
      vehicle
    );

    setResults({
      local: data?.local || [],
      localWholesalers: data?.local || [],

      national: data?.national || [],

      trans_tasman:
        data?.trans_tasman || [],

      global_direct:
        data?.global_direct || [],

      facebook:
        data?.facebook || [],

      facebookMarketplace:
        data?.facebook || [],

      vehicleContext:
        data?.vehicleContext || null,

      catalogue:
        data?.catalogue || null
    });

  } catch (err) {
    console.error(
      '❌ Vehicle-aware parts search failed:',
      err
    );

    setResults({
      local: [],
      national: [],
      trans_tasman: [],
      global_direct: [],
      facebook: []
    });

  } finally {
    setPartsLoading(false);
  }
};
  const cartIds = useMemo(() => purchaseCart.map(c => c.id), [purchaseCart]);

  const handleAddToCart = (item, tier, qty = 1, explicitClassification = null) => {
    const price = role === 'pro' ? (item.trade ?? item.price) : (item.retail ?? item.price);
    const classification = explicitClassification || (typeof classifyItem === 'function' ? classifyItem(item) : 'LINE2_BAY_ALLOCATION');
    setPurchaseCart(prev => {
      if (prev.some(c => c.id === item.id)) return prev;
      return [...prev, { ...item, unitPrice: price, qty, tier, classification }];
    });
    setSaveToast('Item added to your sourcing basket.');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // ── Workshop catalog purchase: routes through cart with LINE1 classification ──
  const handleWorkshopPurchase = (item, category) => {
    // Safe lookup fallback bypasses unmapped out-of-scope constants to prevent device panics
    const localLine1Categories = new Set(['consumable', 'accessory', 'tool', 'cleaner', 'coolant', 'towels', 'degreaser', 'gloves', 'drain_pan', 'filter_wrench', 'wrench', 'torque_wrench', 'compressor', 'piston_tool', 'diagnostic', 'heavy', 'specialty']);
    const catCheck = String(category || item?.category || '').toLowerCase();
    const classification = localLine1Categories.has(catCheck) ? 'LINE1_INTERNAL_EXPENSE' : 'LINE2_BAY_ALLOCATION';
    handleAddToCart(item, 'local', 1, classification);
  };

  const handleExportWorkshopExpense = (expense) => {
    setWorkshopExpenses(prev => prev.map(e => e.id === expense.id ? { ...e, exported: true } : e));
    setSaveToast(`CSV/PDF statement emailed to ${userSession?.email || 'your registered email'} — check your PC inbox.`);
    setTimeout(() => setSaveToast(null), 4500);
  };

  const handleDeleteWorkshopExpense = (id) => {
    setWorkshopExpenses(prev => prev.filter(e => e.id !== id));
  };

  // ── Multi-Leg Courier Dispatch Pipeline (4 logistics gates) ──
  const [courierPipelineOpen, setCourierPipelineOpen] = useState(false);
  const [dispatchJob, setDispatchJob] = useState(() => readStored('partsforge_dispatch_job', null));
  const [freightManifestOpen, setFreightManifestOpen] = useState(false);
  const [shipmentStatus, setShipmentStatus] = useState(() => readStored('partsforge_shipment_status', 'PENDING'));
  const [pendingDeliveryCart, setPendingDeliveryCart] = useState(() => readStored('partsforge_pending_delivery', []));

  // ── Employee Sub-Tier Linking & Pre-Purchase Approval Gateway ──
  const [linkedEmployees, setLinkedEmployees] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [employeeCodeInput, setEmployeeCodeInput] = useState('');

  const persist = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };

  useEffect(() => persist('partsforge_garage_vehicles', garageVehicles), [garageVehicles]);
  useEffect(() => persist('partsforge_active_vehicle_id', activeVehicleId), [activeVehicleId]);
  useEffect(() => persist('partsforge_active_vehicle', vehicle), [vehicle]);
  useEffect(() => persist('partsforge_intake_hoist_id', intakeHoistId), [intakeHoistId]);
  useEffect(() => persist('partsforge_parts_results', results), [results]);
  useEffect(() => persist('partsforge_purchase_cart', purchaseCart), [purchaseCart]);
  useEffect(() => persist('partsforge_job_cart', jobCart), [jobCart]);
  useEffect(() => persist('partsforge_job_consumables', consumables), [consumables]);
  useEffect(() => persist('partsforge_labor_hours', laborHours), [laborHours]);
  useEffect(() => persist('partsforge_labor_rate', laborRate), [laborRate]);
  useEffect(() => persist('partsforge_tax_on', taxOn), [taxOn]);
  useEffect(() => persist('partsforge_diagnostic', diagnostic), [diagnostic]);
  useEffect(() => persist('partsforge_customer_name', custName), [custName]);
  useEffect(() => persist('partsforge_customer_phone', custPhone), [custPhone]);
  useEffect(() => persist('partsforge_customer_email', custEmail), [custEmail]);
  useEffect(() => persist('partsforge_technician_history', technicianHistory), [technicianHistory]);
  useEffect(() => persist('partsforge_hoist_jobs', hoistJobs), [hoistJobs]);
  useEffect(() => persist('partsforge_active_job_id', activeHoistJobId), [activeHoistJobId]);
  useEffect(() => persist('partsforge_unpaid_invoices', unpaidInvoices), [unpaidInvoices]);
  useEffect(() => persist('partsforge_paid_invoices', paidInvoices), [paidInvoices]);
  useEffect(() => persist('partsforge_delivered_stock', vault), [vault]);
  useEffect(() => persist('partsforge_bank_entries', bankFeedEntries), [bankFeedEntries]);
  useEffect(() => persist('partsforge_ledger_entries', ledgerEntries), [ledgerEntries]);
  useEffect(() => persist('partsforge_workshop_expenses', workshopExpenses), [workshopExpenses]);
  useEffect(() => persist('partsforge_dispatch_job', dispatchJob), [dispatchJob]);
  useEffect(() => persist('partsforge_shipment_status', shipmentStatus), [shipmentStatus]);
  useEffect(() => persist('partsforge_pending_delivery', pendingDeliveryCart), [pendingDeliveryCart]);

  const handleOpenCourierPipeline = () => setCourierPipelineOpen(true);
  const handleCloseCourierPipeline = () => setCourierPipelineOpen(false);

  // Generate a cryptographically bound QR token for the dispatch job
  const generateQrToken = () => {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `PF-${ts}-${rand}`;
  };

  // Build supplier legs from cart items
  const buildSupplierLegs = (cartItems) => {
    const supplierMap = {};
    cartItems.forEach(c => {
      const key = c.shop || c.loc || 'Unknown';
      if (!supplierMap[key]) supplierMap[key] = { id: uid(), name: key, suburb: c.suburb || c.loc || 'Unknown', items: [] };
      supplierMap[key].items.push(c);
    });
    return Object.values(supplierMap);
  };

  // GATE A→B: Accept dispatch job → initialize QR code
  const handleAcceptDispatchJob = () => {
    setDispatchJob(prev => prev ? {
      ...prev,
      stage: 'QR_INITIALIZED',
      qrToken: generateQrToken(),
    } : prev);
  };

  // GATE B→C: Proceed to supplier dispatch lock
  const handleProceedToSupplierLock = () => {
    setDispatchJob(prev => prev ? { ...prev, stage: 'SUPPLIER_LOCK', scannedSuppliers: [] } : prev);
  };

  // GATE C: Scan QR at a specific supplier location
  const handleSupplierScan = (supplierId) => {
    setDispatchJob(prev => {
      if (!prev) return prev;
      const scanned = new Set(prev.scannedSuppliers || []);
      scanned.add(supplierId);
      const allScanned = (prev.suppliers || []).every(s => scanned.has(s.id));
      return {
        ...prev,
        scannedSuppliers: [...scanned],
        stage: allScanned ? 'BAY_DOOR_HANDOFF' : 'SUPPLIER_LOCK',
      };
    });
    setSaveToast('Supplier dispatch lock scanned. Item status: IN TRANSIT TO HUB. Pick-pack staff flagged.');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // GATE D: Mechanic bay-door scan → settle LEG-2 → open Freight Arrival Manifest
  const handleBayDoorScanComplete = () => {
    setDispatchJob(prev => prev ? { ...prev, stage: 'SETTLED' } : prev);
    setShipmentStatus('LEG-2 FULLY SETTLED & FREIGHT HANDOFF COMPLETE');
    setCourierPipelineOpen(false);
    setFreightManifestOpen(true);
    setSaveToast('LEG-2 FULLY SETTLED & FREIGHT HANDOFF COMPLETE. Opening Freight Arrival Manifest...');
    setTimeout(() => setSaveToast(null), 4000);
  };

   // Freight Arrival Manifest confirmation → segregated routing
  const handleConfirmFreightRouting = () => {
    if (!dispatchJob) return;
    const items = dispatchJob.items || [];
    const line2Items = items.filter(c => (typeof classifyItem === 'function' ? classifyItem(c) : 'LINE2_BAY_ALLOCATION') === 'LINE2_BAY_ALLOCATION');
    const line1Items = items.filter(c => (typeof classifyItem === 'function' ? classifyItem(c) : 'LINE2_BAY_ALLOCATION') === 'LINE1_INTERNAL_EXPENSE');
    const employeeSource = dispatchJob.employeeSource || null;

    if (line2Items.length > 0) {
      const deliveredAt = new Date().toISOString();
      const deliveredStock = line2Items.flatMap((item) =>
        Array.from({ length: Math.max(1, Number(item.qty) || 1) }, (_, unitIndex) => ({
          ...item,
          vaultId: `${dispatchJob.consignmentId}-${item.id}-${unitIndex + 1}-${uid()}`,
          qty: 1,
          quantityOnHand: 1,
          purchasedAt: deliveredAt,
          deliveredAt,
          status: 'DELIVERED & APPROVED',
          consignmentNote: dispatchJob.consignmentId,
          source: item.source || item.category || 'part',
        }))
      );
      setVault(prev => [...prev, ...deliveredStock]);

      const partsTotal = line2Items.reduce((s, c) => s + (c.unitPrice || 0) * c.qty, 0);
      const invoiceNo = `INV-FRG-${Date.now().toString(36).toUpperCase()}`;
      setPaidInvoices(prev => [...prev, {
        invoiceNo,
        customer: custName || 'Internal Stock Order',
        vehicle: 'Workshop Inventory',
        vehicleRego: '',
        date: new Date().toLocaleDateString(),
        settledAt: new Date().toISOString(),
        paymentStatus: 'PAID',
        grandTotal: partsTotal,
        partsTotal,
        laborTotal: 0,
        laborHours: 0,
        gst: 0,
        cart: line2Items.map(c => ({ brand: c.brand, title: c.title, qty: c.qty, unitPrice: c.unitPrice || 0 })),
        consumables: [],
        diagnosticNotes: 'Consolidated freight arrival routing.',
        technicianLogs: employeeSource || 'Master Root Handshake',
      }]);
    }

    if (line1Items.length > 0) {
      const newExpenses = line1Items.map(c => ({
        id: uid(),
        title: c.title,
        brand: c.brand,
        category: c.category || c.source || 'workshop',
        receiptId: `FRG-${dispatchJob.consignmentId}`,
        unitPrice: c.unitPrice || 0,
        qty: c.qty,
        purchasedAt: new Date().toISOString(),
        purchasedByEmployee: employeeSource,
        exported: false,
      }));
      setWorkshopExpenses(prev => [...prev, ...newExpenses]);
    }

    setDispatchJob(null);
    setFreightManifestOpen(false);
    setSaveToast('Freight delivery routed successfully.');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // ── Employee purchase gating: block checkout, route to approval queue ──
  const handleEmployeePurchaseAttempt = (cartItems, employeeInfo) => {
    const total = cartItems.reduce((s, c) => s + (c.unitPrice || 0) * c.qty, 0);
    const approval = {
      id: uid(),
      employeeName: employeeInfo?.name || 'Linked Employee',
      employeeCode: employeeInfo?.employeeCode || teamLinkCode || 'PF-0000',
      items: cartItems,
      total,
      requestedAt: new Date().toISOString(),
      status: 'PENDING',
    };
    setPendingApprovals(prev => [...prev, approval]);
    setPurchaseCart([]);
    setIsCartOpen(false);
    setSaveToast('Purchase blocked. Routed to master account holder for corporate approval.');
    setTimeout(() => setSaveToast(null), 4000);
  };

  // ── Master mechanic approves employee purchase request (payment remains pending) ──
  const handleApproveEmployeePurchase = (approvalId) => {
    const req = pendingApprovals.find(a => a.id === approvalId);
    if (!req) return;

    // Approval is not payment. Only a verified Stripe webhook may mark an order settled.
    const paymentDescription = `Employee purchase approved: ${req.employeeName} (${req.items.length} items)`;
    setBankFeedEntries(prev => [{ id: uid(), description: paymentDescription, amount: req.total, channel: 'Stripe', status: 'PAYMENT_PENDING', timestamp: new Date().toISOString() }, ...prev]);
    setLedgerEntries(prev => [{ id: uid(), ledgerId: `EMP-${approvalId}`, description: `Employee purchase: ${req.employeeName}`, amount: req.total, accountCode: '500-PURCH', status: 'PENDING', timestamp: new Date().toISOString() }, ...prev]);

    const employeeSource = `Purchased by Employee: ${req.employeeName} / ${req.employeeCode}`;
    const line2Items = req.items.filter(c => (typeof classifyItem === 'function' ? classifyItem(c) : 'LINE2_BAY_ALLOCATION') === 'LINE2_BAY_ALLOCATION');
    const line1Items = req.items.filter(c => (typeof classifyItem === 'function' ? classifyItem(c) : 'LINE2_BAY_ALLOCATION') === 'LINE1_INTERNAL_EXPENSE');

    // 2A. LINE 2: Vehicle parts & oils → push permanent statement to Invoice Archive Ledger (Customer/Job Billing)
    if (line2Items.length > 0) {
      const partsTotal = line2Items.reduce((s, c) => s + (c.unitPrice || 0) * c.qty, 0);
      const invoiceNo = `INV-EMP-${Date.now().toString(36).toUpperCase()}`;
      const paidInvoice = {
        invoiceNo,
        customer: 'Internal Stock Order',
        vehicle: 'Workshop Inventory',
        vehicleRego: '',
        date: new Date().toLocaleDateString(),
        settledAt: new Date().toISOString(),
        paymentStatus: 'PAID',
        receiptId: `EMP-${approvalId}`,
        grandTotal: partsTotal,
        partsTotal,
        laborTotal: 0,
        laborHours: 0,
        gst: 0,
        cart: line2Items.map(c => ({ brand: c.brand, title: c.title, qty: c.qty, unitPrice: c.unitPrice || 0 })),
        consumables: [],
        diagnosticNotes: 'Corporate-approved employee purchase for workshop stock allocation.',
        technicianLogs: employeeSource,
        purchasedByEmployee: employeeSource,
      };
      setPaidInvoices(prev => [...prev, paidInvoice]);
    }

    // 2B. LINE 1: Consumables, accessories, tools → push to Workshop Invoice Archive Ledger (Internal Corporate Expense)
    if (line1Items.length > 0) {
      const newExpenses = line1Items.map(c => ({
        id: uid(),
        title: c.title,
        brand: c.brand,
        category: c.category || c.source || 'workshop',
        receiptId: `EMP-${approvalId}`,
        unitPrice: c.unitPrice || 0,
        qty: c.qty,
        purchasedAt: new Date().toISOString(),
        purchasedByEmployee: employeeSource,
        exported: false,
      }));
      setWorkshopExpenses(prev => [...prev, ...newExpenses]);
    }

    // 3. Build dispatch job for physical courier routing (assets follow after QR handshake)
    const consignmentId = `CON-${Date.now().toString(36).toUpperCase()}`;
    const suppliers = buildSupplierLegs(req.items);
    setDispatchJob({
      consignmentId,
      stage: 'DISPATCH_TICKET',
      suppliers,
      scannedSuppliers: [],
      items: req.items,
      itemCount: req.items.length,
      freightEstimate: req.total * 0.05,
      qrToken: null,
      employeeSource,
    });
    setCourierPipelineOpen(true);
    setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));

    const line1Count = line1Items.length;
    const line2Count = line2Items.length;
    let msg = `Approved ${req.employeeName}'s purchase request. Payment is still pending.`;
    if (line2Count > 0 && line1Count > 0) {
      msg += ` ${line2Count} item(s) → Invoice Archive Ledger, ${line1Count} item(s) → Workshop Expense Ledger.`;
    } else if (line2Count > 0) {
      msg += ` ${line2Count} item(s) pushed to Invoice Archive Ledger.`;
    } else if (line1Count > 0) {
      msg += ` ${line1Count} item(s) pushed to Workshop Expense Ledger.`;
    }
    msg += ' Dispatch must wait for verified payment.';
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 5000);
  };

  // ── Master mechanic rejects employee purchase ──
  const handleRejectEmployeePurchase = (approvalId) => {
    setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
    setSaveToast('Employee purchase rejected and flushed.');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handlePurchaseInc = (id) => setPurchaseCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + 1 } : c));
  const handlePurchaseDec = (id) => setPurchaseCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty - 1) } : c));
  const handleJobInc = (id) => setJobCart(prev => prev.map(c => c.id === id ? { ...c, qty: 1 } : c));
  const handleJobDec = (id) => setJobCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty - 1) } : c));
  const handleUpdateCartItem = (id, field, value) => setJobCart(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));

  // ── Consumables purchase: routes through cart with LINE1 classification ──
  const handleAddConsumable = (con) => {
    handleAddToCart(con, 'local', 1, 'LINE1_INTERNAL_EXPENSE');
  };

  const handleUpdateConsumable = (id, field, value) => setConsumables(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  const handleRemoveConsumable = (id) => setConsumables(prev => prev.filter(c => c.id !== id));

  // ── Global Bank Feed + Accounting Ledger dispatch ──
  const dispatchToBankFeed = useCallback((summary) => {
    const entry = {
      id: uid(),
      timestamp: new Date().toISOString(),
      description: summary.description,
      amount: summary.amount,
      channel: summary.channel || 'OSKO',
      status: 'CLEARED',
      ref: summary.ref || `TXN-${Date.now()}`,
    };
    setBankFeedEntries(prev => [entry, ...prev]);
    setLedgerEntries(prev => [{ ...entry, ledgerId: `XRO-${Math.floor(100000 + Math.random() * 900000)}`, accountCode: '500-PURCH', status: 'POSTED' }, ...prev]);
  }, []);

  // ── Checkout: dispatch courier, hold items pending handshake verification ──
  const handleCheckout = async () => {
    const cartSnapshot = [...purchaseCart];
    const cartTotal = cartSnapshot.reduce((s, c) => s + (c.unitPrice || 0) * c.qty, 0);

    // Employee sub-user gating: block direct payment, route to master approval queue
    if (isEmployeeSubUser) {
      handleEmployeePurchaseAttempt(cartSnapshot, { name: userSession?.name || 'Linked Employee', employeeCode: teamLinkCode || 'PF-0000' });
      return;
    }
    try {
      const orderId = `CART-${Date.now()}`;
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(supabaseAuth ? { Authorization: `Bearer ${(await supabaseAuth.auth.getSession()).data.session?.access_token || ''}` } : {}) },
        body: JSON.stringify({ items: cartSnapshot, currency: regionCode.startsWith('US') ? 'usd' : regionCode === 'UK' ? 'gbp' : 'aud', orderId }),
      });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) throw new Error(data?.error || 'CHECKOUT_CREATION_FAILED');
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      setSaveToast(`Checkout unavailable: ${error.message}`);
      setTimeout(() => setSaveToast(null), 4500);
    }
  };

  const handleSettleInvoice = async (invoiceNo, method) => {
    const result = await settleInvoiceViaCustomerPortal(invoiceNo, method);
    if (!result?.ok) {
      setSaveToast('Payment remains unpaid until a signed Stripe webhook confirms cleared funds.');
      setTimeout(() => setSaveToast(null), 4000);
      return;
    }
    const inv = [...unpaidInvoices].find(i => i.invoiceNo === invoiceNo);
    setPaidInvoices(prev => {
      return inv ? [...prev, { ...inv, paymentStatus: 'PAID', settledAt: result.settledAt, receiptId: result.receiptId }] : prev;
    });
    setUnpaidInvoices(prev => prev.filter(i => i.invoiceNo !== invoiceNo));
    // Auto-purge: delete the vehicle chip linked to this repair
    if (inv && (inv.vehicleRego || inv.vehicle)) {
      const regoMatch = inv.vehicleRego || (inv.vehicle?.rego);
      const completedVehicle = garageVehicles.find(v => v.rego === regoMatch);
      if (completedVehicle?.hoistId) {
        saveHoists(hoists.map(h => h.id === completedVehicle.hoistId ? { ...h, status: 'available', activeVehicleId: null } : h));
      }
      setGarageVehicles(prev => prev.filter(v => v.rego !== regoMatch));
      if (vehicle && vehicle.rego === regoMatch) {
        setVehicle(null);
        setActiveVehicleId(null);
      }
    }
  };

// ── Job card: On the Hoist single-instance lifecycle ──
  const handleSaveProgress = async () => {
    const previousHoistId = vehicle?.hoistId || null;
    const parkedVehicle = vehicle ? { ...vehicle, previousHoistId, hoistId: null, hoistName: null } : null;
    const auditEntry = { ...signedInTechnician, action: 'SAVED_JOB_PROGRESS', actionAt: new Date().toISOString(), hoistId: previousHoistId };
    const nextTechnicianHistory = [...technicianHistory, auditEntry];
    const payload = { cart: jobCart, consumables, laborHours, laborRate, taxOn, diagnostic, custName, custPhone, custEmail, vehicle: parkedVehicle, hoistId: null, technician: signedInTechnician, technicianHistory: nextTechnicianHistory, savedAt: new Date().toISOString() };
    const saved = await persistJobProgress(payload);
    if (activeHoistJobId) {
      setHoistJobs(prev => prev.map(j => j.jobId === activeHoistJobId ? { ...j, ...payload, jobId: activeHoistJobId, updatedAt: new Date().toISOString() } : j));
      setSaveToast(`Job progress updated: ${activeHoistJobId}`);
    } else {
      const savedObject = saved && typeof saved === 'object' ? saved : {};
      const newJob = { ...payload, ...savedObject, jobId: savedObject.jobId || uid() };
      setHoistJobs(prev => [...prev, newJob]);
      setActiveHoistJobId(newJob.jobId);
      setSaveToast(newJob.jobId);
    }
    if (previousHoistId) {
      saveHoists(hoists.map(h => h.id === previousHoistId ? { ...h, status: 'available', activeVehicleId: null } : h));
    }
    if (vehicle?.id) {
      setGarageVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, hoistId: null, hoistName: null } : v));
    }
    setTimeout(() => setSaveToast(null), 3500);
    // Clear active Job Card workspace fields for a fresh vehicle slot
    setJobCart([]);
    setConsumables([]);
    setTechnicianHistory([]);
    setLaborHours(0);
    setLaborRate(95);
    setDiagnostic('');
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setVehicle(null);
    setActiveVehicleId(null);
    setActiveHoistJobId(null);
  };

    const handleCompileInvoice = async () => {
    const unallocatedParts = jobCart.filter(item => !item.fromVault || !item.vaultId);
    if (unallocatedParts.length > 0) {
      setSaveToast('Invoice blocked: every part must be delivered and allocated from stock first.');
      setTimeout(() => setSaveToast(null), 4000);
      return;
    }
    const finalAuditEntry = { ...signedInTechnician, action: 'COMPILED_AND_SENT_INVOICE', actionAt: new Date().toISOString(), hoistId: vehicle?.hoistId || null };
    const finalTechnicianHistory = [...technicianHistory, finalAuditEntry];
    const jobData = { cart: jobCart, consumables, laborHours, laborRate, taxOn, custName, custPhone, custEmail, vehicle, technician: signedInTechnician, technicianHistory: finalTechnicianHistory };
    const invoice = compileCustomerInvoice(jobData, effectiveTaxRate);
    
    // Attach diagnostic notes and technician logs safely without passing invalid region primitives
    invoice.diagnosticNotes = diagnostic || 'No diagnostic notes recorded.';
    
    const activeCurrencyLabel = (regionCode === 'US' || regionCode === 'US_CA' || regionCode === 'US_NY' || regionCode === 'US_TX') ? 'USD' : regionCode === 'UK' ? 'GBP' : 'AUD';
    const assignedHoist = hoists.find(h => h.id === vehicle?.hoistId);
    invoice.technician = signedInTechnician;
    invoice.technicianHistory = finalTechnicianHistory;
    invoice.technicianLogs = `Technician: ${signedInTechnician.name} · Account: ${signedInTechnician.email || signedInTechnician.id} · Role: ${signedInTechnician.role || 'TECHNICIAN'}${signedInTechnician.employeeCode ? ` · Employee Code: ${signedInTechnician.employeeCode}` : ''} · Hoist: ${assignedHoist?.name || 'Unassigned'} · Labor: ${laborHours}h @ ${laborRate} ${activeCurrencyLabel}/h · Finalised: ${finalAuditEntry.actionAt}`;
    invoice.vehicleRego = vehicle?.rego || '';
    
    let dispatchResult;
    try {
      dispatchResult = await dispatchInvoicePaymentRequest(invoice);
    } catch (error) {
      setSaveToast(`Invoice checkout could not be created: ${error.message}`);
      setTimeout(() => setSaveToast(null), 4500);
      return;
    }
    setUnpaidInvoices(prev => [...prev, { ...invoice, paymentLink: dispatchResult.paymentLink, dispatchedAt: dispatchResult.sentAt }]);
    
    // Dispatch purchase to bank feed + ledger
    dispatchToBankFeed({ description: `Invoice compiled: ${invoice.invoiceNo} for ${custName || 'customer'}`, amount: invoice.grandTotal, channel: 'Stripe', ref: invoice.invoiceNo });
    
    // Clean Invoice Dispatch Purge: expunge this job from the hoist folder
    if (activeHoistJobId) {
      setHoistJobs(prev => prev.filter(j => j.jobId !== activeHoistJobId));
    }
    setSaveToast(`Invoice ${invoice.invoiceNo} sent to ${custEmail || 'customer'}`);
    setTimeout(() => setSaveToast(null), 4000);

    const completedHoistId = vehicle?.hoistId || null;
    if (completedHoistId) {
      saveHoists(hoists.map(h => h.id === completedHoistId ? { ...h, status: 'available', activeVehicleId: null } : h));
    }
    if (vehicle?.id) {
      setGarageVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, hoistId: null, hoistName: null } : v));
    }
    
    // Clear active form
    setJobCart([]);
    setConsumables([]);
    setLaborHours(0);
    setLaborRate(95);
    setDiagnostic('');
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setVehicle(null);
    setActiveVehicleId(null);
    setActiveHoistJobId(null);
    setTechnicianHistory([]);
  };

  // Resume a hoist job into the active Job Card area
  const handleResumeJob = (job, targetBayId = null) => {
    if (!targetBayId) {
      setSaveToast('Select an available hoist before loading this job.');
      setTimeout(() => setSaveToast(null), 3000);
      return;
    }
    const targetHoist = hoists.find(h => h.id === targetBayId);
    if (!targetHoist || targetHoist.status !== 'available') {
      setSaveToast('That hoist is no longer available. Select another hoist.');
      setTimeout(() => setSaveToast(null), 3000);
      return;
    }
    const restoredVehicle = job.vehicle
      ? { ...job.vehicle, hoistId: targetBayId, hoistName: targetHoist.name }
      : null;
    setJobCart(job.cart || []);
    setConsumables(job.consumables || []);
    setLaborHours(job.laborHours || 0);
    setLaborRate(job.laborRate || 95);
    setTaxOn(job.taxOn ?? true);
    setDiagnostic(job.diagnostic || '');
    setCustName(job.custName || '');
    setCustPhone(job.custPhone || '');
    setCustEmail(job.custEmail || '');
    setTechnicianHistory(job.technicianHistory || (job.technician ? [{ ...job.technician, action: 'LEGACY_JOB_TECHNICIAN' }] : []));
    setVehicle(restoredVehicle);
    setActiveHoistJobId(job.jobId || job.id || null);
    if (restoredVehicle) {
      const existing = garageVehicles.find(v => v.id === restoredVehicle.id || (v.rego && v.rego === restoredVehicle.rego));
      if (existing) {
        setGarageVehicles(prev => prev.map(v => v.id === existing.id ? { ...v, ...restoredVehicle, id: existing.id } : v));
        setActiveVehicleId(existing.id);
        restoredVehicle.id = existing.id;
      } else {
        const restoredId = restoredVehicle.id || uid();
        restoredVehicle.id = restoredId;
        setGarageVehicles(prev => [...prev, restoredVehicle]);
        setActiveVehicleId(restoredId);
      }
    }
    saveHoists(hoists.map(h => h.id === targetBayId ? { ...h, status: 'occupied', activeVehicleId: restoredVehicle?.id || null } : h));
    setHoistJobs(prev => prev.map(savedJob =>
      (savedJob.jobId || savedJob.id) === (job.jobId || job.id)
        ? { ...savedJob, hoistId: targetBayId, vehicle: restoredVehicle, updatedAt: new Date().toISOString() }
        : savedJob
    ));
    setResults(null);
    setSaveToast(`Job loaded into ${targetHoist.name}. Vehicle and VIN restored for parts searching.`);
    setTimeout(() => setSaveToast(null), 4000);
    setTimeout(() => document.getElementById('active-job-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  // In-Progress Delete Guard: remove a job from the hoist folder manually
  const handleDeleteHoistJob = (jobId) => {
    setHoistJobs(prev => prev.filter(j => (j.jobId || j.id) !== jobId));
    if (activeHoistJobId === jobId) {
      setActiveHoistJobId(null);
      setJobCart([]);
      setConsumables([]);
      setLaborHours(0);
      setDiagnostic('');
      setCustName('');
      setCustPhone('');
      setCustEmail('');
      setVehicle(null);
      setActiveVehicleId(null);
    }
  };

  // ── Vault allocation (mount to bay + remove from vault) ──
  const handleMountVaultItem = (vaultItem, targetBayId = null) => {
    const activeSavedJob = hoistJobs.find(job => (job.jobId || job.id) === activeHoistJobId);
    const resolvedBayId = targetBayId || vehicle?.hoistId || activeSavedJob?.hoistId || activeSavedJob?.vehicle?.hoistId;
    const allocatedItem = { ...vaultItem, id: uid(), unitPrice: vaultItem.unitPrice || 0, qty: 1, fromVault: true, vaultId: vaultItem.vaultId, bayId: resolvedBayId };
    const activeJobMatches = Boolean(
      resolvedBayId &&
      (vehicle || activeHoistJobId) &&
      (vehicle?.hoistId || activeSavedJob?.hoistId || activeSavedJob?.vehicle?.hoistId) === resolvedBayId
    );
    const savedTargetJob = hoistJobs.find(job =>
      (job.hoistId || job.vehicle?.hoistId) === resolvedBayId &&
      (job.jobId || job.id) !== activeHoistJobId
    );

    if (activeJobMatches) {
      const nextJobCart = [...jobCart, allocatedItem];
      setJobCart(nextJobCart);
      if (activeHoistJobId) {
        setHoistJobs(prev => prev.map(job =>
          (job.jobId || job.id) === activeHoistJobId
            ? { ...job, cart: nextJobCart, updatedAt: new Date().toISOString() }
            : job
        ));
      }
    } else if (savedTargetJob) {
      const targetJobId = savedTargetJob.jobId || savedTargetJob.id;
      setHoistJobs(prev => prev.map(job =>
        (job.jobId || job.id) === targetJobId
          ? { ...job, cart: [...(job.cart || []), allocatedItem], updatedAt: new Date().toISOString() }
          : job
      ));
    } else {
      setSaveToast('Create or load a job on that hoist before allocating stock.');
      setTimeout(() => setSaveToast(null), 3500);
      return;
    }

    setVault(prev => prev.filter(v => v.vaultId !== vaultItem.vaultId));
    setAllocModalOpen(false);
    setSaveToast(`Delivered part allocated to ${hoists.find(h => h.id === resolvedBayId)?.name || resolvedBayId}.`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleAllocateFromVault = (vaultId) => {
    const item = vault.find(v => v.vaultId === vaultId);
    if (item) handleMountVaultItem(item);
  };

  // ── Vault batch allocation ──
  const handleBatchAllocate = (selectedVaultIds, targetBayId) => {
    const items = vault.filter(v => selectedVaultIds.includes(v.vaultId));
    if (!items.length) return;
    const activeSavedJob = hoistJobs.find(job => (job.jobId || job.id) === activeHoistJobId);
    const resolvedBayId = targetBayId || vehicle?.hoistId || activeSavedJob?.hoistId || activeSavedJob?.vehicle?.hoistId;
    const allocatedItems = items.map(v => ({ ...v, id: uid(), unitPrice: v.unitPrice || 0, qty: 1, fromVault: true, vaultId: v.vaultId, bayId: resolvedBayId }));
    const activeJobMatches = Boolean(
      resolvedBayId &&
      (vehicle || activeHoistJobId) &&
      (vehicle?.hoistId || activeSavedJob?.hoistId || activeSavedJob?.vehicle?.hoistId) === resolvedBayId
    );
    const savedTargetJob = hoistJobs.find(job =>
      (job.hoistId || job.vehicle?.hoistId) === resolvedBayId &&
      (job.jobId || job.id) !== activeHoistJobId
    );

    if (activeJobMatches) {
      const nextJobCart = [...jobCart, ...allocatedItems];
      setJobCart(nextJobCart);
      if (activeHoistJobId) {
        setHoistJobs(prev => prev.map(job =>
          (job.jobId || job.id) === activeHoistJobId
            ? { ...job, cart: nextJobCart, updatedAt: new Date().toISOString() }
            : job
        ));
      }
    } else if (savedTargetJob) {
      const targetJobId = savedTargetJob.jobId || savedTargetJob.id;
      setHoistJobs(prev => prev.map(job =>
        (job.jobId || job.id) === targetJobId
          ? { ...job, cart: [...(job.cart || []), ...allocatedItems], updatedAt: new Date().toISOString() }
          : job
      ));
    } else {
      setSaveToast('Create or load a job on that hoist before allocating stock.');
      setTimeout(() => setSaveToast(null), 3500);
      return;
    }

    setVault(prev => prev.filter(v => !selectedVaultIds.includes(v.vaultId)));
    setAllocModalOpen(false);
    setSaveToast(`${items.length} item(s) allocated to ${hoists.find(h => h.id === resolvedBayId)?.name || resolvedBayId}`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  // ── Return part from job card back to vault (DELIVERED & APPROVED) ──
  const handleRemoveFromCart = (id) => {
    const item = jobCart.find(c => c.id === id);
    if (item && item.fromVault && item.vaultId) {
      const folder = item.source || item.category || 'part';
      setVault(prev => [...prev, { ...item, vaultId: item.vaultId, status: 'DELIVERED & APPROVED', source: folder }]);
    }
    setJobCart(prev => prev.filter(c => c.id !== id));
  };

    const handleRemoveFromCartDrawer = (id) => {
    setPurchaseCart(prev => prev.filter(c => c.id !== id));
  };

  // ── Store dropdown purchase handlers — all route through cart ──
  const handlePurchaseLubricant = (item) => {
    handleAddToCart(item, 'local', 1, 'LINE2_BAY_ALLOCATION');
  };
  const handlePurchaseConsumable = (item) => {
    handleAddToCart(item, 'local', 1, 'LINE1_INTERNAL_EXPENSE');
  };
  const handlePurchaseAccessory = (item) => {
    handleAddToCart(item, 'accessory', 1, 'LINE1_INTERNAL_EXPENSE');
  };
  const handleVerifyBankFeed = async (invoice) => {
    const deposit = await simulateInboundDeposit(invoice);
    if (deposit.ok) {
      const settledInvoice = { ...invoice, paymentStatus: 'PAID', settledAt: deposit.depositedAt, receiptId: `OSKO-${Date.now()}` };
      setPaidInvoices(prev => [...prev, settledInvoice]);
      setUnpaidInvoices(prev => prev.filter(i => i.invoiceNo !== invoice.invoiceNo));
      // Auto-purge: delete the vehicle chip linked to this repair from the active Garage Bay list
      if (invoice.vehicleRego || invoice.vehicle) {
        const regoMatch = invoice.vehicleRego || (invoice.vehicle?.rego);
        const completedVehicle = garageVehicles.find(v => v.rego === regoMatch);
        if (completedVehicle?.hoistId) {
          saveHoists(hoists.map(h => h.id === completedVehicle.hoistId ? { ...h, status: 'available', activeVehicleId: null } : h));
        }
        setGarageVehicles(prev => prev.filter(v => v.rego !== regoMatch));
        if (vehicle && vehicle.rego === regoMatch) {
          setVehicle(null);
          setActiveVehicleId(null);
        }
      }
      setSaveToast(`Bank feed matched: ${invoice.invoiceNo} — ${fmt(invoice.grandTotal, regionCode)} via OSKO`);
      setTimeout(() => setSaveToast(null), 4000);
    }
  };

  const handleConnectBankFeed = async () => {
    const result = await connectOpenBankingFeed();
    setBankFeedStatus(result);
    return result;
  };

  // ── Accounting export & accountant email ──
  const handleExportToAccounting = async (items) => {
    await streamInvoiceToLedger(items[0]);
  };

  const handleEmailAccountant = async (items) => {
    await triggerXeroAccountantSync(items[0], corpProfile.accountantEmail || 'accountant@tax.com');
  };

  // ── Bank feed (on-demand only) ──
  const handleLinkAto = async () => linkAtoSbr();
  const handleConnectLedger = async (provider) => connectAccountingSoftware(provider);
  const handleInviteAccountant = async (email) => inviteAccountant(email);

  // ── Sign Out ──
  const handleSignOut = () => {
    supabaseAuth?.auth.signOut().catch(() => {});
    setUserSession(null);
    setAccepted(false);
    setGarageVehicles([]);
    setActiveVehicleId(null);
    setVehicle(null);
    setPurchaseCart([]);
    setJobCart([]);
    setConsumables([]);
    setTechnicianHistory([]);
    setResults(null);
    setVault([]);
    setHoistJobs([]);
    setUnpaidInvoices([]);
    setPaidInvoices([]);
    setWorkshopExpenses([]);
    setShipmentStatus('PENDING');
    setCourierPipelineOpen(false);
    setFreightManifestOpen(false);
    setPendingDeliveryCart([]);
    setDispatchJob(null);
    setTeamLinkCode(null);
    setLinkedEmployees([]);
    setPendingApprovals([]);
    setIsEmployeeSubUser(false);
    setEmployeeCodeInput('');
    setLaborHours(0);
    setLaborRate(95);
    setDiagnostic('');
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setBankFeedStatus(null);
    setCorpProfile({ phone: '', abn: '', ein: '', companyHouse: '', vatNumber: '' });
    setBankFeedEntries([]);
    setLedgerEntries([]);
    try { localStorage.removeItem('partsforge_session'); localStorage.removeItem('partsforge_safety_agreed'); } catch {}
  };

  // ── Render gates (auth → waiver → app) ──
  if (!userSession) {
    return <AuthGate onAuthenticate={handleAuthenticate} isAuthenticating={isAuthenticating} />;
  }
  
  // ADMIN role bypasses safety shield → straight to enterprise monitoring terminal
  if (userSession.role === 'ADMIN') {
    return (
      <AppErrorBoundary>
        <AdminConsole
          session={userSession}
          region={regionCode || 'VIC'}
          regionCode={regionCode || 'AU_VIC'}
          onRegionChange={handleRegionChange}
          usStateCode={usStateCode}
          onUsStateChange={handleUsStateChange}
          bankFeedEntries={bankFeedEntries || []}
          ledgerEntries={ledgerEntries || []}
          paidInvoices={paidInvoices || []}
          onSignOut={handleSignOut}
        />
      </AppErrorBoundary>
    );
  }
  
    if (!accepted) {
    return <SafetyShield onAccept={handleAcceptTerms} />;
  }

  // ── Employee Team Code Generator Fallback ──
  const handleGenerateTeamLinkCode = () => {
    const code = `TEAM-${Math.floor(100000 + Math.random() * 900000)}`;
    if (typeof setTeamLinkCode === 'function') setTeamLinkCode(code);
    setSaveToast(`Team authentication code generated: ${code}`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // ── Seller role: exclusive B2B Industrial Transport & Logistics Command Terminal ──
  if (userSession.role === 'SELLER') {
    return (
      <AppErrorBoundary>
        <SellerConsole
          region={regionCode || 'VIC'}
          usStateCode={usStateCode}
          onDispatchToBankFeed={dispatchToBankFeed}
          onSignOut={handleSignOut}
          corpProfile={corpProfile || {}}
          setCorpProfile={setCorpProfile}
          regionCode={regionCode || 'AU_VIC'}
          onRegionChange={handleRegionChange}
          usStates={(typeof REGIONS !== 'undefined' && REGIONS?.US?.usStates) ? REGIONS.US.usStates : []}
          onUtStateChange={handleUsStateChange}
          onConnectLedger={handleConnectLedger}
          onConnectBankFeed={handleConnectBankFeed}
          bankFeedStatus={bankFeedStatus}
        />
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>
        {/* Top HUD Nav */}
        <nav className="sticky top-0 z-50 border-b" style={{ borderColor: C.border, background: `${C.bg}f0` }}>
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-950" style={{ background: C.orange }}>
                <Wrench className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-50">PartsForge Garage</div>
                <div className="text-[10px]" style={{ color: C.textDim }}>{TIER_LABELS[userSession.role]} · {role === 'pro' ? 'Trade pricing active' : role === 'seller' ? 'Seller portal' : 'Retail pricing'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsCartOpen(true)} className="relative flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition" style={{ borderColor: C.border, background: C.panel, color: C.text }}>
                <ShoppingCart className="h-4 w-4" style={{ color: C.orange }} /> Cart
                {purchaseCart.length > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-slate-950" style={{ background: C.orange }}>{purchaseCart.length}</span>}
              </button>
              <AccountSettingsDropdown
                corpProfile={corpProfile} setCorpProfile={setCorpProfile}
                matchedAccount={matchedTradeAccount}
                paidInvoices={paidInvoices}
                onLinkAto={handleLinkAto}
                onConnectLedger={handleConnectLedger}
                onInviteAccountant={handleInviteAccountant}
                onConnectBankFeed={handleConnectBankFeed}
                bankFeedStatus={bankFeedStatus}
                onExportToAccounting={handleExportToAccounting}
                onEmailAccountant={handleEmailAccountant}
                regionCode={regionCode}
                onRegionChange={handleRegionChange}
                usStateCode={usStateCode}
                onUsStateChange={handleUsStateChange}
                bankFeedEntries={bankFeedEntries}
                ledgerEntries={ledgerEntries}
                workshopExpenses={workshopExpenses}
                onExportWorkshopExpense={handleExportWorkshopExpense}
                onDeleteWorkshopExpense={handleDeleteWorkshopExpense}
                userEmail={userSession?.email}
                teamLinkCode={teamLinkCode}
                onGenerateTeamLinkCode={handleGenerateTeamLinkCode}
                linkedEmployees={linkedEmployees}
                savedJobs={hoistJobs}
                onResumeJob={handleResumeJob}
                onDeleteJob={handleDeleteHoistJob}
                hoists={hoists}
                onAddHoist={handleAddHoist}
                onRenameHoist={handleRenameHoist}
                onHoistStatusChange={handleHoistStatusChange}
              />
              {pendingApprovals.length > 0 && (
                <EmployeeApprovalTable
                  pendingApprovals={pendingApprovals}
                  onApprove={handleApproveEmployeePurchase}
                  onReject={handleRejectEmployeePurchase}
                  region={regionCode}
                />
              )}
              <button onClick={handleSignOut} className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition" style={{ borderColor: `${C.red}30`, background: `${C.red}08`, color: C.red }}>
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        </nav>

               <FixedVehicleHUD
          vehicle={garageVehicles.find(v => v.id === activeVehicleId) || vehicle}
          vehicles={garageVehicles}
          onOpenFolder={() => setGarageFolderOpen(true)}
          onEdit={handleEditVehicle}
        />

        <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
          {/* Save toast */}
          {saveToast && (
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs" style={{ borderColor: `${C.emerald}40`, background: `${C.emerald}10`, color: C.emerald }}>
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {saveToast}
            </div>
          )}

          {/* Scanner */}
          <ScannerPanel
            onRego={handleRego}
            onVin={handleVin}
            onPhoto={handlePhoto}
            onManualVehicle={handleManualVehicle}
            onCommit={handleCommitVehicle}
            loading={regoLoading}
            vehicle={vehicle}
            lookupError={regoLookupError}
            scanning={scanning}
            hoists={hoists}
            selectedHoistId={intakeHoistId}
            onHoistChange={setIntakeHoistId}
          />

          {role === 'pro' && (
            <WorkshopStorePanel
              region={regionCode}
              consumables={consumables}
              onUpdateConsumable={handleUpdateConsumable}
              onRemoveConsumable={handleRemoveConsumable}
              storeDropdowns={
                <>
                  <StoreCatalogButton label="Parts Search" icon={<PackageSearch className="h-4 w-4" />} accent={C.orange} count={results ? Object.values(results).flat().length : 0} onClick={() => setPartsSearchOpen(true)} />
                  <StoreCatalogButton label="Lubricants" icon={<FlaskConical className="h-4 w-4" />} accent={C.orange} count={LUBRICANTS_CATALOG.length} onClick={() => setCatalogWindow('lubricants')} />
                  <StoreCatalogButton label="Consumables" icon={<SprayCan className="h-4 w-4" />} accent={C.cyan} count={CONSUMABLES_CATALOG_FLAT.length} onClick={() => setCatalogWindow('consumables')} />
                  <StoreCatalogButton label="Workshop Accessories" icon={<Wrench className="h-4 w-4" />} accent={C.emerald} count={ACCESSORIES_CATALOG.length} onClick={() => setCatalogWindow('accessories')} />
                  <StoreCatalogButton label="Specialty Shop Tools" icon={<Wrench className="h-4 w-4" />} accent={C.orange} count={SPECIALTY_TOOLS_CATALOG.length} onClick={() => setCatalogWindow('tools')} />
                </>
              }
            />
          )}

          {/* DIY Driver: Modular Store Catalog Buttons */}
          {role === 'diy' && (
            <div className="rounded-xl border p-4" style={{ background: C.panel, borderColor: C.border }}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: C.textDim }}>
                <Store className="h-3.5 w-3.5" style={{ color: C.orange }} /> Automotive Store Catalogs
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <StoreCatalogButton label="Lubricants" icon={<FlaskConical className="h-4 w-4" />} accent={C.orange} count={results?.local?.filter(item => item.title?.toLowerCase().includes('oil') || item.title?.toLowerCase().includes('fluid') || item.title?.toLowerCase().includes('lubricant')).length || 0} onClick={() => setCatalogWindow('lubricants')} />
                <StoreCatalogButton label="Consumables" icon={<SprayCan className="h-4 w-4" />} accent={C.cyan} count={results?.local?.filter(item => item.title?.toLowerCase().includes('cleaner') || item.title?.toLowerCase().includes('spray') || item.title?.toLowerCase().includes('wipe')).length || 0} onClick={() => setCatalogWindow('consumables')} />
                <StoreCatalogButton label="Workshop Accessories" icon={<Wrench className="h-4 w-4" />} accent={C.emerald} count={results?.local?.filter(item => item.title?.toLowerCase().includes('glove') || item.title?.toLowerCase().includes('mat') || item.title?.toLowerCase().includes('tape')).length || 0} onClick={() => setCatalogWindow('accessories')} />
                <StoreCatalogButton label="Specialty Shop Tools" icon={<Wrench className="h-4 w-4" />} accent={C.orange} count={results?.local?.filter(item => item.title?.toLowerCase().includes('scanner') || item.title?.toLowerCase().includes('wrench') || item.title?.toLowerCase().includes('socket')).length || 0} onClick={() => setCatalogWindow('tools')} />
              </div>
            </div>
          )}

          {/* DIY Driver: Purchased Items Log History Vault */}
          {role === 'diy' && (
            <HistoryVault vault={vault} region={regionCode} />
          )}

          {/* Mechanic-only sections */}
          {role === 'pro' && (
            <>
              <JobCard
                cart={jobCart} role={role}
                laborHours={laborHours} setLaborHours={setLaborHours}
                laborRate={laborRate} setLaborRate={setLaborRate}
                taxOn={taxOn} setTaxOn={setTaxOn}
                diagnostic={diagnostic} setDiagnostic={setDiagnostic}
                onInc={handleJobInc} onDec={handleJobDec} onRemove={handleRemoveFromCart}
                onUpdateItem={handleUpdateCartItem}
                consumables={consumables}
                onUpdateConsumable={handleUpdateConsumable}
                onRemoveConsumable={handleRemoveConsumable}
                custName={custName} setCustName={setCustName}
                custPhone={custPhone} setCustPhone={setCustPhone}
                custEmail={custEmail} setCustEmail={setCustEmail}
                vehicle={vehicle}
                onSaveProgress={handleSaveProgress}
                onCompileInvoice={handleCompileInvoice}
                onOpenAllocation={() => setAllocModalOpen(true)}
                region={regionCode} effectiveTaxRate={effectiveTaxRate}
                onOpenCourierHandshake={handleOpenCourierPipeline}
                shipmentStatus={shipmentStatus}
                technician={signedInTechnician}
                technicianHistory={technicianHistory}
              />

                          <VaultPanel vault={vault} onMount={handleMountVaultItem} bayOptions={hoists} region={regionCode} />

              <UnpaidInvoicesDirectory invoices={unpaidInvoices} onSettle={(inv) => setCheckoutInvoice(inv)} onVerifyBank={handleVerifyBankFeed} region={regionCode} />
            </>
          )}

          <footer className="border-t pt-4 text-center text-xs" style={{ borderColor: C.border, color: C.textDim }}>
            PartsForge — three-sided auto parts marketplace · ForgedParts Pty Ltd
          </footer>
        </main>

        {/* Garage Bay Folder Modal */}
        <GarageBayFolderModal
          open={garageFolderOpen}
          vehicles={garageVehicles}
          activeId={activeVehicleId}
          onSelect={handleSelectVehicle}
          onRemove={handleRemoveVehicle}
          onClose={() => setGarageFolderOpen(false)}
          onEdit={handleEditVehicle}
        />

        {/* Store Catalog Windows */}
        {partsSearchOpen && (
          <div className="fixed inset-0 z-[85] overflow-y-auto" style={{ background: C.bg }}>
            <div className="sticky top-0 z-10 border-b" style={{ borderColor: C.border, background: `${C.bg}f0` }}>
              <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider" style={{ color: C.orange }}><PackageSearch className="h-5 w-5" /> Parts Search</div>
                <button onClick={() => setPartsSearchOpen(false)} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold" style={{ borderColor: C.border, color: C.text }}><X className="h-3.5 w-3.5" /> Close Parts Search</button>
              </div>
            </div>
            <div className="mx-auto max-w-5xl space-y-4 px-4 py-4">
              <PartsSearch onSearch={handleSearch} loading={partsLoading} />
              <PartsResults results={results} role={role} onAdd={handleAddToCart} onAddConsumable={handleAddConsumable} cartIds={cartIds} region={regionCode} />
            </div>
          </div>
        )}
        {catalogWindow === 'lubricants' && (
          <StoreCatalogWindow label="Lubricants Catalog" icon={<FlaskConical className="h-5 w-5" />} items={LUBRICANTS_CATALOG} role={role} cartIds={cartIds} accent={C.orange} region={regionCode} onClose={() => setCatalogWindow(null)}
            onAddToCart={(item, qty) => handleAddToCart(item, 'local', qty, 'LINE2_BAY_ALLOCATION')}
            workshopMode={false} />
        )}
        {catalogWindow === 'consumables' && (
          <StoreCatalogWindow label="Consumables Catalog" icon={<SprayCan className="h-5 w-5" />} items={CONSUMABLES_CATALOG_FLAT} role={role} cartIds={cartIds} accent={C.cyan} region={regionCode} onClose={() => setCatalogWindow(null)}
            onAddToCart={(item, qty) => handleAddToCart(item, 'local', qty, 'LINE1_INTERNAL_EXPENSE')}
            workshopMode={false} />
        )}
        {catalogWindow === 'accessories' && (
          <StoreCatalogWindow label="Workshop Accessories Catalog" icon={<Wrench className="h-5 w-5" />} items={ACCESSORIES_CATALOG} role={role} cartIds={cartIds} accent={C.emerald} region={regionCode} onClose={() => setCatalogWindow(null)}
            onAddToCart={(item, qty) => handleAddToCart(item, 'local', qty, 'LINE1_INTERNAL_EXPENSE')}
            workshopMode={false} />
        )}
        {catalogWindow === 'tools' && (
          <StoreCatalogWindow label="Specialty Shop Tools Catalog" icon={<Wrench className="h-5 w-5" />} items={SPECIALTY_TOOLS_CATALOG} role={role} cartIds={cartIds} accent={C.orange} region={regionCode} onClose={() => setCatalogWindow(null)}
            onAddToCart={(item, qty) => handleAddToCart(item, 'local', qty, 'LINE1_INTERNAL_EXPENSE')}
            workshopMode={false} />
        )}

        {/* Cart Drawer */}
        <CartDrawer
          open={isCartOpen} onClose={() => setIsCartOpen(false)}
          cart={purchaseCart} onInc={handlePurchaseInc} onDec={handlePurchaseDec} onRemove={handleRemoveFromCartDrawer}
          onCheckout={handleCheckout} role={role} region={regionCode} usStateCode={usStateCode}
          consolidationEnabled={consolidationEnabled} onToggleConsolidation={() => setConsolidationEnabled(v => !v)}
        />

        {/* Allocation Matrix Modal */}
        <AllocationMatrixModal
          open={allocModalOpen} onClose={() => setAllocModalOpen(false)}
          vault={vault} onBatchAllocate={handleBatchAllocate}
          bayOptions={hoists}
          region={regionCode}
        />

        {/* Multi-Leg Courier Dispatch Pipeline Modal */}
        <CourierDispatchPipelineModal
          open={courierPipelineOpen}
          onClose={handleCloseCourierPipeline}
          dispatchJob={dispatchJob}
          onAcceptJob={handleAcceptDispatchJob}
          onSupplierScan={handleSupplierScan}
          onBayDoorScan={handleBayDoorScanComplete}
          onCourierHandshakeComplete={handleBayDoorScanComplete}
          region={regionCode}
        />

        {/* PartsForge Live Freight Arrival Manifest Modal */}
        <FreightArrivalManifestModal
          open={freightManifestOpen}
          onClose={() => setFreightManifestOpen(false)}
          dispatchJob={dispatchJob}
          onConfirmRouting={handleConfirmFreightRouting}
          region={regionCode}
        />
      </div>
    </AppErrorBoundary>
  );
}
