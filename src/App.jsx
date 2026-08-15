import React, { useState, useRef } from 'react';
import { 
  Wrench, KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle, 
  UserCheck, ClipboardList, ScanLine, ShoppingCart, ShieldCheck, Check, Ban
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

  const [activeJobCards, setActiveJobCards] = useState([
    { id: 'JOB-902', customer: 'Toyota Hiace (Rego: YTR-882)', status: 'Awaiting Manifest Ingestion' },
    { id: 'JOB-905', customer: 'Ford Ranger (Rego: 1BC-9XD)', status: 'Brake Linings Fitting' }
  ]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [completedTransactions, setCompletedTransactions] = useState([]);

  const handleAuthenticate = ({ email, role, linkedAccount }) => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setUser({ email, role, linkedAccount: linkedAccount || 'Master Root Account' });
      setIsAuthenticating(false);
    }, 1500);
  };

  const handleCourierScan = (jobId) => {
    alert(`Initializing High-Speed Camera Viewfinder...\nScanning Courier Manifest for ${jobId}`);
    if (jobId) {
      setActiveJobCards(prev => prev.map(job => job.id === jobId ? { ...job, status: 'Delivery Verified by Employee' } : job));
    }
  };

  const handleOrderExecution = (jobId, itemDesc, rawPrice) => {
    if (user?.role === 'APPRENTICE') {
      const requestTicket = {
        id: `REQ-${Date.now().toString().slice(-3)}`,
        timestamp: new Date().toLocaleTimeString(),
        apprentice: user.email,
        linkedMaster: user.linkedAccount,
        jobId,
        desc: itemDesc,
        price: rawPrice
      };
      setIncomingRequests(prev => [requestTicket, ...prev]);
      alert(`🚨 EMPLOYEE LINK ACTIVE!\nOrder held securely. Detailed parts list and job card metrics streamed directly to your master account holder: ${user.linkedAccount}`);
    } else {
      const directReceipt = {
        timestamp: new Date().toLocaleTimeString(),
        desc: itemDesc,
        price: rawPrice,
        jobId,
        operator: 'Master Owner'
      };
      setCompletedTransactions(prev => [directReceipt, ...prev]);
      alert(`⚡ TRANSACTION EXECUTED!\nCharge routed natively onto Stripe Live Financial Network for job: ${jobId}`);
    }
  };

  const handleOwnerApproveOrder = (reqId, action) => {
    const target = incomingRequests.find(r => r.id === reqId);
    if (!target) return;

    if (action === 'APPROVE') {
      const receipt = {
        timestamp: new Date().toLocaleTimeString(),
        desc: target.desc,
        price: target.price,
        jobId: target.jobId,
        operator: `Approved for ${target.apprentice}`
      };
      setCompletedTransactions(prev => [receipt, ...prev]);
      alert(`🟢 EMPLOYEE ORDER APPROVED!\nFunds settled safely over Stripe Live channels.`);
    } else {
      alert(`❌ Order request declined.`);
    }
    setIncomingRequests(prev => prev.filter(r => r.id !== reqId));
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans pb-12" style={{ background: C.background }}>
      {!user ? (
        <AuthGate onAuthenticate={handleAuthenticate} isAuthenticating={isAuthenticating} />
      ) : (
        <div className="p-4 max-w-6xl mx-auto">
          
          {/* HEADER OPERATIONS HUB CONTROL DESK */}
          <div className="rounded-xl border p-4 mb-6 flex justify-between items-center" style={{ borderColor: C.border, background: C.panel }}>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Wrench className="text-orange-500 h-5 w-5" /> PartsForge Workshop Core Terminal
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Operator Profile: <span className="font-semibold text-slate-200">{user.email}</span> | <span className="text-orange-400 font-bold uppercase">{user.role} TIER</span></p>
              {user.role === 'APPRENTICE' && <p className="text-[10px] text-slate-400 mt-0.5">🔗 Linked to Employer: {user.linkedAccount}</p>}
            </div>
            <button onClick={() => setUser(null)} className="text-xs px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 transition-all font-semibold uppercase tracking-wider">Terminate Session</button>
          </div>

          {/* DUAL WORKSPACE PANEL SYSTEM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* LEFT COLUMN: SHARED ACTIVE JOB CARDS */}
            <div className="rounded-xl border p-5" style={{ borderColor: C.border, background: C.panel }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: C.orange }}>
                <ClipboardList className="h-4 w-4" /> Shared Active Job Cards (Synced Realtime)
              </h3>
              <div className="flex flex-col gap-3">
                {activeJobCards.map(job => (
                  <div key={job.id} className="p-4 rounded-lg border text-xs" style={{ background: C.panel2, borderColor: C.border }}>
                    <div className="flex justify-between items-center font-bold text-slate-200">
                      <span className="font-mono text-sm">{job.id}</span>
                      <span style={{ color: job.status.includes('Verified') ? C.emerald : '#F59E0B' }} className="uppercase tracking-wider font-semibold">{job.status}</span>
                    </div>
                    <p className="text-slate-300 font-medium text-sm mt-2">{job.customer}</p>
                    
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => handleCourierScan(job.id)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded font-bold text-[10px] bg-slate-800 border border-slate-700 text-slate-200 uppercase tracking-wider hover:bg-slate-700 transition-all">
                        <ScanLine className="h-3.5 w-3.5 text-emerald-400" /> Scan Bay Manifest
                      </button>
                      <button onClick={() => handleOrderExecution(job.id, `Brake Components Pack for ${job.id}`, 245.00)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded font-bold text-[10px] bg-emerald-600 text-slate-950 uppercase tracking-wider hover:bg-emerald-500 transition-all">
                        <ShoppingCart className="h-3.5 w-3.5" /> {user?.role === 'APPRENTICE' ? 'Route Order' : 'Order Parts'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: EMPLOYEE ACCOUNTABILITY APPROVALS */}
            <div className="rounded-xl border p-5" style={{ borderColor: C.border, background: C.panel }}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: C.emerald }}>
                <ShieldCheck className="h-4 w-4" /> Employee Authorization Streams
              </h3>
              
              {user?.role === 'APPRENTICE' ? (
                <p className="text-[11px] text-slate-400 bg-emerald-950/10 p-3 rounded border border-emerald-900/30 leading-relaxed">📡 Employee Link Active. All digital parts purchase orders compiled on this terminal session will automatically route directly onto your supervisor's panel for instant trade authorization.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {incomingRequests.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No pending employee purchase requests sitting in queue. System operational.</p>
                  ) : (
                    incomingRequests.map(req => (
                      <div key={req.id} className="p-3.5 rounded-lg border border-amber-500/40 bg-amber-950/10 text-xs flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center font-bold text-amber-400 text-[10px] tracking-wider uppercase mb-1.5">
                            <span>⚠️ Approval Required</span>
                            <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{req.id}</span>
                          </div>
                          <p className="text-slate-200 font-semibold">{req.desc}</p>
                          <div className="text-[10px] text-slate-400 mt-2 font-mono flex flex-col gap-0.5 bg-slate-950/30 p-2 rounded border border-slate-800/60">
                            <div>Linked Card: <span className="text-slate-200 font-bold">{req.jobId}</span></div>
                            <div>Value: <span className="text-orange-400 font-bold">${req.price.toFixed(2)}</span></div>
                            <div className="text-slate-500 mt-0.5">Logged by: {req.apprentice} at {req.timestamp}</div>
                          </div>
                        </div>
                        <div className="mt-3.5 flex gap-2 border-t pt-2.5 border-slate-800/60">
                          <button onClick={() => handleOwnerApproveOrder(req.id, 'APPROVE')} className="flex-1 py-1.5 rounded font-bold text-[10px] uppercase bg-emerald-600 text-slate-950 flex items-center justify-center hover:bg-emerald-500 transition-all shadow-sm">
                            <Check className="h-3 w-3" /> Approve & Pay
                          </button>
                          <button onClick={() => handleOwnerApproveOrder(req.id, 'DENY')} className="py-1.5 px-3 rounded font-bold text-[10px] uppercase bg-slate-800 text-red-400 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-all">
                                                        <Ban className="h-3 w-3" /> Drop
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              
              {completedTransactions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dashed border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Live Session Settlement Receipts:</div>
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                    {completedTransactions.map((tx, i) => (
                      <div key={i} className="p-2 rounded text-[10px] bg-slate-900/60 border border-slate-800 flex justify-between items-center font-mono">
                        <div className="truncate pr-2"><span className="text-emerald-400 font-bold">ST_LIV_OK</span> | {tx.desc} ({tx.jobId})</div>
                        <span className="text-slate-300 font-bold">${tx.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
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
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textDim }}>Select Account Tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }}>
              <option value="DIY">DIY Driver Tier</option>
              <option value="MECHANIC">Registered Mechanic (Master Account Holder)</option>
              <option value="APPRENTICE">Employee Link (Sub-Account Access)</option>
              <option value="WHOLESALER">Wholesale Merchant Hub</option>
            </select>
          </div>

          {tier === 'APPRENTICE' && (
            <div className="p-3 rounded-lg border border-dashed animate-pulse" style={{ borderColor: C.orange, background: C.panel2 }}>
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.orange }}>🔗 Link to Employer's Master Account Email</label>
              <input type="email" value={linkedAccount} onChange={(e) => setLinkedAccount(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-xs text-slate-100 outline-none" style={{ borderColor: C.border, background: C.background }} placeholder="owner@eppingmechanics.com.au" />
              <p className="text-[10px] text-slate-400 mt-1 uppercase">Provides shared JobCard synchronization and roots all purchase accountability workflows straight to the master dashboard console tier.</p>
            </div>
          )}

          <div ref={boxRef} onScroll={handleScroll} className="terms-scroll mt-2 h-24 overflow-y-auto rounded-lg border p-3 text-xs leading-relaxed" style={{ background: C.panel2, borderColor: C.border, color: C.textDim }}>
            <p className="mb-1 font-semibold" style={{ color: C.orange }}>SECURE GATEWAY & LIABILITY ROUTING AGREEMENT</p>
            <p className="mb-1">By initializing this node, the user verifies that all linked device sessions, automated courier manifest scans, and purchase orders are routed directly onto the Stripe Live Financial Network under the sole fiscal and trade license liability of the master account holder.</p>
            <p>Scroll down to authorize this node connection and unlock validation tokens.</p>
          </div>

          <div className="mt-1 flex items-center gap-2 text-[10px]">
            {scrolled ? (
              <span className="flex items-center gap-1" style={{ color: C.emerald }}><CheckCircle2 className="h-3 w-3" /> Framework Read Verified</span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="h-3 w-3" /> Scroll box to verify protocols</span>
            )}
          </div>

          <label className={`mt-1 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${scrolled ? '' : 'cursor-not-allowed opacity-50'}`} style={{ borderColor: scrolled ? `${C.orange}40` : C.border, background: scrolled ? `${C.orange}05` : C.panel2 }}>
            <input type="checkbox" checked={checked} disabled={!scrolled} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-4 w-4" style={{ accentColor: C.orange }} />
            <span className="text-xs text-slate-300">I verify all linked device liability requirements.</span>
          </label>

          <button onClick={handleSubmit} disabled={!canSubmit} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition" style={{ background: canSubmit ? C.orange : C.border, color: canSubmit ? '#000' : C.textDim }}>
            {isAuthenticating ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> Synchronizing Node...</>) : (<><KeyRound className="h-4 w-4" /> Authenticate & Secure Entry</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

export class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error(error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-[#070A12] text-slate-100 font-sans">
          <div className="w-full max-w-md rounded-2xl border border-red-900/50 p-6 text-center bg-[#0B1329] shadow-2xl">
            <h2 className="text-lg font-bold">Terminal Interface Exception</h2>
            <button onClick={() => window.location.reload()} className="mt-5 w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-all">Reload Terminal</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

