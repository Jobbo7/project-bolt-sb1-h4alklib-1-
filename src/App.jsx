import React, { useState, useRef } from 'react';
import { Wrench, KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';

const C = {
  background: '#070A12',
  panel: '#0B1329',
  panel2: '#111C38',
  border: '#1E293B',
  orange: '#F97316',
  emerald: '#10B981',
  textDim: '#94A3B8'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthenticate = ({ email, role }) => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setUser({ email, role });
      setIsAuthenticating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans" style={{ background: C.background }}>
      {!user ? (
        <AuthGate onAuthenticate={handleAuthenticate} isAuthenticating={isAuthenticating} />
      ) : (
        <div className="p-6 max-w-4xl mx-auto">
          <div className="rounded-2xl border p-6 mb-6" style={{ borderColor: C.border, background: C.panel }}>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <UserCheck className="text-orange-500" /> Welcome to PartsForge Terminal
            </h2>
            <p className="text-sm text-slate-400 mt-1">Session Protocol: <span className="font-semibold text-slate-200">{user.email}</span> ({user.role})</p>
            <div className="mt-4 p-3 rounded-lg border text-xs text-emerald-400 bg-emerald-950/20 border-emerald-800/30">
              ⚡ LIVE GATEWAY DEPLOYMENT SECURE — STRIPE PRODUCTION KEYS SYNCED SUCCESSFULLY.
            </div>
          </div>
          <button onClick={() => setUser(null)} className="text-xs text-red-400 hover:underline">Terminate Secure Session</button>
        </div>
      )}
    </div>
  );
}

function AuthGate({ onAuthenticate, isAuthenticating }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tier, setTier] = useState('DIY');
  const [showPassword, setShowPassword] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [checked, setChecked] = useState(false);

  const boxRef = useRef(null);

  const handleScroll = () => {
    if (!boxRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = boxRef.current;
    if (scrollHeight - scrollTop - clientHeight < 5) {
      setScrolled(true);
    }
  };

  const canSubmit = email.trim() && password.trim() && !isAuthenticating && checked;
  const handleSubmit = () => { if (canSubmit) onAuthenticate({ email: email.trim(), role: tier }); };

  return (
    <div className="flex items-center justify-center p-4 min-h-screen">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl" style={{ borderColor: C.border, background: C.panel }}>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20">
            <Wrench className="h-6 w-6 text-slate-950" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-100">PartsForge Secure Gateway</h2>
          <p className="mt-1 text-xs uppercase tracking-widest font-semibold" style={{ color: C.orange }}>Stripe Live Financial Network Active</p>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textDim }}>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }} placeholder="name@workshop.com" />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textDim }}>Secure Password</label>
            <div className="relative mt-1">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border pl-3 pr-10 py-2.5 text-sm text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textDim }}>Select Account Tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }}>
              <option value="DIY">DIY Driver Tier</option>
              <option value="MECHANIC">Registered Mechanic Workshop</option>
              <option value="WHOLESALER">Wholesale Merchant Hub</option>
            </select>
          </div>

          <div ref={boxRef} onScroll={handleScroll} className="terms-scroll mt-4 h-32 overflow-y-auto rounded-lg border p-3 text-xs leading-relaxed" style={{ background: C.panel2, borderColor: C.border, color: C.textDim }}>
            <p className="mb-2 font-semibold" style={{ color: C.orange }}>SAFETY WARNING — AUTOMOTIVE REPAIR RISK</p>
            <p className="mb-2">By entering the Garage, you acknowledge that automotive repair carries inherent risk of injury. Content is reference only and must be verified against official workshop data.</p>
            <p className="mb-2">ForgedParts Pty Ltd accepts no liability for property damage or loss of income arising from use of this application or parts sourced.</p>
            <p>Scroll to the bottom of this text box to unlock the acceptance token gate line.</p>
          </div>

          <div className="mt-1 flex items-center gap-2 text-[11px]">
            {scrolled ? (
              <span className="flex items-center gap-1" style={{ color: C.emerald }}><CheckCircle2 className="h-3 w-3" /> Framework Read Verified</span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="h-3 w-3" /> Scroll disclaimer text box down to unlock</span>
            )}
          </div>

          <label className={`mt-2 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${scrolled ? '' : 'cursor-not-allowed opacity-50'}`} style={{ borderColor: scrolled ? `${C.orange}40` : C.border, background: scrolled ? `${C.orange}05` : C.panel2 }}>
            <input type="checkbox" checked={checked} disabled={!scrolled} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-4 w-4" style={{ accentColor: C.orange }} />
            <span className="text-xs text-slate-300">I accept all liability and risk requirements.</span>
          </label>

          <button onClick={handleSubmit} disabled={!canSubmit} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition" style={{ background: canSubmit ? C.orange : C.border, color: canSubmit ? '#000' : C.textDim }}>
            {isAuthenticating ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> Connecting Ledger...</>) : (<><KeyRound className="h-4 w-4" /> Authenticate & Secure Entry</>)}
          </button>

          {/* 📦 THE PERFECTLY LAYERED APPRENTICE SCANNER SHORTCUT MODULE */}
          <div className="courier-drop-block" style={{ marginTop: '20px', padding: '12px', background: 'linear-gradient(135deg, #0A1A10 0%, #0D1321 100%)', border: '1px solid #00CC66', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#00CC66', fontSize: '14px', textTransform: 'uppercase', fontWeight: 'bold' }}>📦 Bay-Door Courier Arrival</h4>
                <p style={{ margin: 0, fontSize: '11px', color: '#8A99AD', textTransform: 'uppercase' }}>Unloading incoming wholesale package manifests</p>
              </div>
              <button 
                type="button"
                onClick={() => alert("Initializing High-Speed Apprentice Camera Viewfinder Wrapper...")} 
                style={{ backgroundColor: '#00CC66', color: '#070A12', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Scan Courier QR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REQUIRED EXPORT ERROR BOUNDARY UTILITY CONTAINER ───────────────────────
export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("PartsForge Terminal Critical Error Captured:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-[#070A12] text-slate-100 font-sans">
          <div className="w-full max-w-md rounded-2xl border border-red-900/50 p-6 text-center bg-[#0B1329] shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-950/30 border border-red-800/30">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold tracking-tight">Terminal Interface Exception</h2>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">A runtime render crash was blocked securely. Reload the session cache to re-initialize your Stripe financial streams.</p>
            <button onClick={() => window.location.reload()} className="mt-5 w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-all">Reload Terminal Interface</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
