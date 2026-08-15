import React, { useState, useRef } from 'react';
import { 
  Wrench, KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle, 
  UserCheck, ClipboardList, ScanLine, ShoppingCart, ShieldCheck,
  Search, PlusCircle, Check, Layers, Ban
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [inventoryList, setInventoryList] = useState([
    { id: 'STK-01', item: 'Bendix Heavy Duty Front Brake Pads (DB1422)', qty: 4, location: 'Shelf B2' },
    { id: 'STK-02', item: 'Ryco Oil Filter (Z9)', qty: 12, location: 'Shelf A1' }
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemLoc, setNewItemLoc] = useState('');

  const [activeJobCards, setActiveJobCards] = useState([
    { id: 'JOB-902', customer: 'Toyota Hiace (Rego: YTR-882)', currentTask: 'Front Brake System Rotors & Pads Upgrade', status: 'Awaiting Manifest Ingestion' },
    { id: 'JOB-905', customer: 'Ford Ranger (Rego: 1BC-9XD)', currentTask: 'Logbook Major Service + Filter Suite', status: 'Brake Linings Fitting' }
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

  const handleCatalogSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchResults([
      { sku: 'WH-8821', desc: 'DBA T2 Street Series Slotted Brake Rotors (Pair)', price: 245.00 },
      { sku: 'WH-4402', desc: 'Bendix Ultimate 4WD Brake Pad Kit Front', price: 115.00 },
      { sku: 'WH-1092', desc: 'Castrol Edge Engine Oil 5W-40 Full Synthetic 5L', price: 85.00 }
    ]);
  };

  const handleAddOnsiteInventory = (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemQty) return;
    const newStock = {
      id: `STK-${Date.now().toString().slice(-2)}`,
      item: newItemName.trim(),
      qty: parseInt(newItemQty),
      location: newItemLoc.trim() || 'Unassigned Bay Shelf'
    };
    setInventoryList(prev => [newStock, ...prev]);
    setNewItemName('');
    setNewItemQty('');
    setNewItemLoc('');
  };

  const handleOrderExecution = (jobId, itemSku, itemDesc, rawPrice) => {
    if (user?.role === 'APPRENTICE') {
      const requestTicket = {
        id: `REQ-${Date.now().toString().slice(-3)}`,
        timestamp: new Date().toLocaleTimeString(),
        apprentice: user.email,
        linkedMaster: user.linkedAccount,
        jobId,
        sku: itemSku,
        desc: itemDesc,
        price: rawPrice,
        status: 'Pending Owner Authorization'
      };
      setIncomingRequests(prev => [requestTicket, ...prev]);
      alert(`🚨 EMPLOYEE LINK ROUTER ACTIVE!\nOrder held securely. Full job card details, parts SKU manifests, and linked logs have been streamed to your master account holder (${user.linkedAccount}) for edit or approval.`);
    } else {
      const directReceipt = {
        timestamp: new Date().toLocaleTimeString(),
        sku: itemSku,
        desc: itemDesc,
        price: rawPrice,
        jobId,
        operator: 'Master Owner'
      };
      setCompletedTransactions(prev => [directReceipt, ...prev]);
      alert(`⚡ TRANSACTION EXECUTED!\nCharge routed natively onto Stripe Live Financial Network. Wholesaler dispatch log locked for job: ${jobId}`);
    }
  };

  const handleOwnerApproveOrder = (reqId, action) => {
    const target = incomingRequests.find(r => r.id === reqId);
    if (!target) return;

    if (action === 'APPROVE') {
      const receipt = {
        timestamp: new Date().toLocaleTimeString(),
        sku: target.sku,
        desc: target.desc,
        price: target.price,
        jobId: target.jobId,
        operator: `Approved for ${target.apprentice}`
      };
      setCompletedTransactions(prev => [receipt, ...prev]);
      alert(`🟢 EMPLOYEE ORDER APPROVED!\nFunds settled safely over Stripe Live channels. Wholesaler dispatch system notified.`);
    } else {
      alert(`❌ Order request declined and deleted from terminal stream.`);
    }
    setIncomingRequests(prev => prev.filter(r => r.id !== reqId));
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans" style={{ background: C.background }}>
      {!user ? (
        <AuthGate onAuthenticate={handleAuthenticate} isAuthenticating={isAuthenticating} />
      ) : (
        <div className="p-4 max-w-6xl mx-auto">
          
          <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: C.border, background: C.panel }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Wrench className="text-orange-500 h-5 w-5" /> PartsForge Workshop Core Terminal
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Active Session: <span className="font-semibold text-slate-200">{user.email}</span></p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-orange-500/30 text-orange-400 bg-orange-950/20">
                    Tier: {user.role === 'APPRENTICE' ? 'Employee Link Sub-Account' : 'Master Mechanic Account'}
                  </span>
                  {user.role === 'APPRENTICE' && (
                    <span className="text-[10px] text-slate-400 font-medium">🔗 Supervised by: {user.linkedAccount}</span>
                  )}
                </div>
              </div>
              <button onClick={() => setUser(null)} className="text-xs px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 transition-all font-semibold uppercase tracking-wider">Terminate Protocol</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <div className="rounded-xl border p-5" style={{ borderColor: C.border, background: C.panel }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-200">
                  <Search className="h-4 w-4 text-orange-500" /> Integrated Parts Marketplace Catalogue
                </h3>
                <form onSubmit={handleCatalogSearch} className="flex gap-2">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Type part name, SKU number or vehicle model keyword..." className="w-full rounded-lg border px-3 py-2 text-xs text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }} />
                  <button type="submit" className="px-4 py-2 rounded-lg bg-orange-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-orange-400 transition-all">Search</button>
                </form>

                {searchResults.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2 border-t pt-4" style={{ borderColor: C.border }}>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Marketplace Match Matrix:</p>
                    {searchResults.map(part => (
                      <div key={part.sku} className="p-3 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/40" style={{ borderColor: C.border }}>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">{part.desc}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">SKU ID: <span className="text-slate-400 font-mono">{part.sku}</span> | Trade Price Tier</div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-2 sm:pt-0" style={{ borderColor: C.border }}>
                          <span className="text-sm font-bold text-orange-400 font-mono">${part.price.toFixed(2)}</span>
                          <select id={`select-job-${part.sku}`} className="rounded bg-slate-800 border border-slate-700 text-[10px] p-1 outline-none text-slate-300">
                            {activeJobCards.map(j => <option key={j.id} value={j.id}>Link to {j.id}</option>)}
                          </select>
                          <button onClick={() => {
                            const selJob = document.getElementById(`select-job-${part.sku}`)?.value;
                            handleOrderExecution(selJob, part.sku, part.desc, part.price);
                          }} className="px-3 py-1.5 rounded font-bold text-[10px] uppercase bg-emerald-600 text-slate-950 hover:bg-emerald-500 transition-all">
                            {user?.role === 'APPRENTICE' ? 'Route Order' : 'Buy Now'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border p-5" style={{ borderColor: C.border, background: C.panel }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: C.orange }}>
                                    <ClipboardList className="h-4 w-4" /> Shared Active Job Cards (Synced Realtime)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeJobCards.map(job => (
                    <div key={job.id} className="p-3 rounded-lg border flex flex-col justify-between" style={{ background: C.panel2, borderColor: C.border }}>
                      <div>
                        <div className="flex justify-between items-center font-bold text-xs text-slate-200">
                          <span className="font-mono">{job.id}</span>
                          <span style={{ color: job.status.includes('Verified') ? C.emerald : '#F59E0B', fontSize: '10px' }} className="uppercase tracking-wider font-semibold">{job.status}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-300 mt-1.5">{job.customer}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5"><span className="text-slate-500">Operation:</span> {job.currentTask}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t flex gap-2" style={{ borderColor: C.border }}>
                        <button onClick={() => handleCourierScan(job.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded font-bold text-[10px] bg-slate-800 text-slate-200 border border-slate-700 uppercase tracking-wider hover:bg-slate-700 transition-all">
                          <ScanLine className="h-3 w-3 text-emerald-400" /> Manifest Ingest
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-xl border p-5" style={{ borderColor: C.border, background: C.panel }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-slate-200">
                  <Layers className="h-4 w-4 text-orange-500" /> Onsite Stock Inventory Vault
                </h3>
                
                {user?.role === 'APPRENTICE' ? (
                  <p className="text-[11px] text-slate-500 italic bg-slate-900/30 p-2.5 rounded border border-dashed border-slate-800">🔒 Inventory modifications restricted. Onsite stock adjustments must be registered directly under master account access privileges.</p>
                ) : (
                  <form onSubmit={handleAddOnsiteInventory} className="flex flex-col gap-2 mb-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Log Local Shelf Stock:</div>
                    <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Item description (e.g. Ryco Filter Z9)" className="w-full rounded p-2 text-xs text-slate-100 outline-none border" style={{ borderColor: C.border, background: C.panel2 }} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} placeholder="Qty" className="rounded p-2 text-xs text-slate-100 outline-none border" style={{ borderColor: C.border, background: C.panel2 }} />
                      <input type="text" value={newItemLoc} onChange={(e) => setNewItemLoc(e.target.value)} placeholder="Shelf Loc" className="rounded p-2 text-xs text-slate-100 outline-none border" style={{ borderColor: C.border, background: C.panel2 }} />
                    </div>
                    <button type="submit" className="w-full mt-1 py-1.5 rounded font-bold text-[10px] bg-orange-500 text-slate-950 uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-orange-400 transition-all">
                      <PlusCircle className="h-3 w-3" /> Catalog Item Onsite
                    </button>
                  </form>
                )}

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {inventoryList.map(stock => (
                    <div key={stock.id} className="p-2.5 rounded border flex justify-between items-center text-xs bg-slate-950/40" style={{ borderColor: C.border }}>
                      <div>
                        <div className="font-medium text-slate-200">{stock.item}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{stock.id} | Shelf: <span className="text-slate-400">{stock.location}</span></div>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded font-mono bg-slate-800 border border-slate-700 text-orange-400">×{stock.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border p-5" style={{ borderColor: C.border, background: C.panel }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: C.emerald }}>
                  <ShieldCheck className="h-4 w-4" /> Employee Authorization Streams
                </h3>
                
                {user?.role === 'APPRENTICE' ? (
                  <p className="text-[11px] text-slate-400 bg-emerald-950/10 p-2.5 rounded border border-emerald-900/30">📡 Device connection active. All commercial transaction tickets compiled on this terminal session loop will stream directly onto your supervisor's dashboard for verification tracking.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {incomingRequests.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No pending employee purchase requests sitting in queue. System operational.</p>
                    ) : (
                      incomingRequests.map(req => (
                        <div key={req.id} className="p-3 rounded-lg border border-amber-500/40 bg-amber-950/10 text-xs">
                          <div className="flex justify-between items-center font-bold text-amber-400 text-[10px] tracking-wider uppercase mb-1">
                            <span>⚠️ Awaiting Your Approval</span>
                            <span className="font-mono">{req.id}</span>
                          </div>
                          <p className="text-slate-300 font-medium">{req.desc}</p>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            <div>Linked Card: <span className="text-slate-200 font-semibold">{req.jobId}</span></div>
                            <div>SKU: {req.sku} | Value: <span className="text-orange-400 font-bold">${req.price.toFixed(2)}</span></div>
                            <div className="text-slate-500 mt-1">Logged by: {req.apprentice} at {req.timestamp}</div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button onClick={() => handleOwnerApproveOrder(req.id, 'APPROVE')} className="flex-1 py-1 rounded font-bold text-[10px] uppercase bg-emerald-600 text-slate-950 flex items-center justify-center gap-0.5 hover:bg-emerald-500 transition-all">
                              <Check className="h-3 w-3" /> Approve & Pay
                            </button>
                            <button onClick={() => handleOwnerApproveOrder(req.id, 'DENY')} className="py-1 px-3 rounded font-bold text-[10px] uppercase bg-slate-800 text-red-400 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-all">
                              <Ban className="h-3 w-3" /> Drop
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {completedTransactions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dashed" style={{ borderColor: C.border }}>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Live Session Settlement Receipts:</div>
                    <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                      {completedTransactions.map((tx, i) => (
                        <div key={i} className="p-2 rounded text-[10px] bg-slate-900/60 border border-slate-800 flex justify-between items-center font-mono">
                          <div className="truncate pr-2">
                            <span className="text-emerald-400 font-bold">ST_LIV_OK</span> | {tx.desc} ({tx.jobId})
                          </div>
                          <span className="text-slate-300 font-bold">${tx.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
            {isAuthenticating ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> Synchronizing Node...</>) : (<><KeyRound className="h-4 w-4" /> Authenticate & Link Gateway</>)}
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


