import React, { useState, useRef } from 'react';
import { 
  Wrench, KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle, 
  UserCheck, Users, ClipboardList, ScanLine, ShoppingCart, ShieldCheck 
} from 'lucide-react';

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

  // MOCK LOGGED WORKFLOW STATE FOR DEMO RUNS ON THEBay FLOOR
  const [activeJobCards, setActiveJobCards] = useState([
    { id: 'JOB-902', customer: 'Toyota Hiace (Rego: YTR-882)', status: 'Awaiting Manifest Ingestion' },
    { id: 'JOB-905', customer: 'Ford Ranger (Rego: 1BC-9XD)', status: 'Brake Linings Fitting' }
  ]);
  const [purchaseLogs, setPurchaseLogs] = useState([]);

  const handleAuthenticate = ({ email, role, linkedAccount }) => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setUser({ email, role, linkedAccount: linkedAccount || 'Master Root Account' });
      setIsAuthenticating(false);
    }, 1500);
  };

  const handleCourierScan = (jobId) => {
    alert(`Initializing High-Speed Camera Viewfinder...\nScanning Courier Manifest for ${jobId || 'Bay Door Delivery'}`);
    if (jobId) {
      setActiveJobCards(prev => prev.map(job => job.id === jobId ? { ...job, status: 'Delivery Verified by Apprentice' } : job));
    }
  };

  const handleApprenticePurchaseOrder = (jobId, partsList) => {
    const orderDetails = {
      timestamp: new Date().toLocaleTimeString(),
      apprentice: user?.email || 'Junior Apprentice',
      linkedMasterAccount: user?.linkedAccount || 'Unlinked',
      jobId,
      items: partsList
    };
    setPurchaseLogs(prev => [orderDetails, ...prev]);
    alert(`🚨 ORDER ROUTED TO OWNER!\nDetailed parts log and job routing matrix streamed straight to master account: ${user?.linkedAccount}`);
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans" style={{ background: C.background }}>
      {!user ? (
        <AuthGate onAuthenticate={handleAuthenticate} isAuthenticating={isAuthenticating} />
      ) : (
        <div className="p-6 max-w-4xl mx-auto">
          {/* MASTER BANNER TRACKER */}
          <div className="rounded-2xl border p-6 mb-6" style={{ borderColor: C.border, background: C.panel }}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <UserCheck className="text-orange-500" /> PartsForge Workshop Node
                </h2>
                <p className="text-sm text-slate-400 mt-1">Operator Profile: <span className="font-semibold text-slate-200">{user.email}</span></p>
                <p className="text-xs uppercase tracking-wider font-semibold mt-1" style={{ color: C.orange }}>
                  Tier System: {user.role} {user.role === 'APPRENTICE' && `(🔗 Linked to Master: ${user.linkedAccount})`}
                </p>
              </div>
              <button onClick={() => setUser(null)} className="text-xs px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 transition-all">Terminate Protocol</button>
            </div>
          </div>

          {/* SHARED JOBCARD LOGIC LOOP MATRIX */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border p-5" style={{ borderColor: C.border, background: C.panel }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: C.orange }}>
                <ClipboardList className="h-4 w-4" /> Shared Active Job Cards (Synced Realtime)
              </h3>
              <div className="flex flex-col gap-3">
                {activeJobCards.map(job => (
                  <div key={job.id} className="p-3 rounded-lg border text-xs" style={{ background: C.panel2, borderColor: C.border }}>
                    <div className="flex justify-between font-semibold text-slate-200">
                      <span>{job.id}</span>
                      <span style={{ color: job.status.includes('Verified') ? C.emerald : '#F59E0B' }}>{job.status}</span>
                    </div>
                    <p className="text-slate-400 mt-1">{job.customer}</p>
                    
                    {/* APPRENTICE DELIVERY SCAN TRIGGER CHANNEL */}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleCourierScan(job.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded font-bold text-[10px] bg-emerald-600 text-slate-950 uppercase tracking-wider hover:bg-emerald-500 transition-all">
                        <ScanLine className="h-3 w-3" /> Scan Bay manifest
                      </button>
                      <button onClick={() => handleApprenticePurchaseOrder(job.id, 'Brake Rotors & Heavy Duty Brake Pads Set')} className="flex items-center gap-1 px-2.5 py-1.5 rounded font-bold text-[10px] bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider hover:bg-slate-700 transition-all">
                        <ShoppingCart className="h-3 w-3" /> Log Purchase Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MASTER CONTROLLER PURCHASE STREAM INSIDE OWNER/APPRENTICE NODE */}
            <div className="rounded-xl border p-5" style={{ borderColor: C.border, background: C.panel }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: C.emerald }}>
                <ShieldCheck className="h-4 w-4" /> Live Employee Accountability Streams
              </h3>
              {purchaseLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No incoming apprentice purchase requests logged on this session yet. Waiting for bay execution records...</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {purchaseLogs.map((log, idx) => (
                    <div key={idx} className="p-3 rounded-lg border text-[11px] border-emerald-900/40 bg-emerald-950/10">
                      <div className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] mb-1">🔥 Realtime Manifest Streamed to Owner</div>
                      <p className="text-slate-300"><span className="text-slate-400">Linked Card:</span> <span className="font-semibold text-slate-100">{log.jobId}</span></p>
                      <p className="text-slate-300"><span className="text-slate-400">Parts List:</span> {log.items}</p>
                      <p className="text-slate-400 mt-1 text-[10px]">Logged by: {log.apprentice} at {log.timestamp}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuthGate({ onAuthenticate, isAuthenticating }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tier, setTier] = useState('DIY');
  const [linkedAccount, setLinkedAccount] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [checked, setChecked] = useState(false);

  const boxRef = useRef(null);

  const handleScroll = () => {
    if (!boxRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = boxRef.current;
    if (scrollHeight - scrollTop - clientHeight < 5) setScrolled(true);
  };

  const canSubmit = email.trim() && password.trim() && !isAuthenticating && checked && (tier !== 'APPRENTICE' || linkedAccount.trim());
  const handleSubmit = () => { if (canSubmit) onAuthenticate({ email: email.trim(), role: tier, linkedAccount: linkedAccount.trim() }); };

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
