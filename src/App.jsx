import React, { useState, useRef } from 'react';
import { 
  Wrench, KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle, 
  UserCheck, Folder, FolderPlus, Search, ShieldCheck, Check, Ban, ScanLine, ShoppingCart, Layers, FileText, ChevronRight, X
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
  
  // CORE SYSTEM INTEGRATION STATE ARCHITECTURE
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState('All');
  const [showAddStockModal, setShowAddStockModal] = useState(false);

  // FORM INPUTS FOR LOCAL STORAGE REGISTRATION VAULT
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemLoc, setNewItemLoc] = useState('');

  // LIVE SYNCHRONIZED SIMULATION DATA ENGINE
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [completedTransactions, setCompletedTransactions] = useState([]);
  const [inventoryList, setInventoryList] = useState([
    { id: 'STK-01', item: 'Bendix Heavy Duty Front Brake Pads (DB1422)', qty: 4, location: 'Shelf B2' },
    { id: 'STK-02', item: 'Ryco Oil Filter (Z9)', qty: 12, location: 'Shelf A1' }
  ]);
  const [activeJobCards, setActiveJobCards] = useState([
    { id: 'JOB-902', customer: 'Toyota Hiace', rego: 'YTR-882', currentTask: 'Front Brake System Rotors & Pads Upgrade', status: 'Awaiting Manifest Ingestion', folder: 'Brakes' },
    { id: 'JOB-905', customer: 'Ford Ranger', rego: '1BC-9XD', currentTask: 'Logbook Major Service + Filter Suite', status: 'Brake Linings Fitting', folder: 'Servicing' }
  ]);

  const handleAuthenticate = ({ email, role, linkedAccount }) => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setUser({ email, role, linkedAccount: linkedAccount || 'Master Root Account' });
      setIsAuthenticating(false);
    }, 1500);
  };

  const handleCourierScan = (jobId) => {
    alert(`Initializing High-Speed Camera Viewfinder Wrapper...\nScanning Vehicle Number Plate or Courier Manifest for Job Matrix Ref: ${jobId}`);
    setActiveJobCards(prev => prev.map(job => job.id === jobId ? { ...job, status: 'Delivery Verified' } : job));
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
      alert(`🚨 EMPLOYEE LINK ROUTER ACTIVE!\nOrder intercept initiated. Detailed parts log lists and job metrics streamed straight to master dashboard account holder: ${user.linkedAccount}`);
    } else {
      const directReceipt = {
        timestamp: new Date().toLocaleTimeString(),
        desc: itemDesc,
        price: rawPrice,
        jobId,
        operator: 'Master Owner'
      };
      setCompletedTransactions(prev => [directReceipt, ...prev]);
      alert(`⚡ TRANSACTION EXECUTED!\nCharge settled natively over Stripe Live Financial Network for Job Matrix Ref: ${jobId}`);
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
      alert(`🟢 EMPLOYEE ORDER APPROVED!\nFunds released over Stripe Live integration networks. Wholesaler dispatch log locked.`);
    } else {
      alert(`❌ Order request declined.`);
    }
    setIncomingRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const handleAddInventoryItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemQty) return;
    const itemRecord = {
      id: `STK-${Date.now().toString().slice(-2)}`,
      item: newItemName.trim(),
      qty: parseInt(newItemQty),
      location: newItemLoc.trim() || 'Unassigned Row'
    };
    setInventoryList(prev => [itemRecord, ...prev]);
    setNewItemName('');
    setNewItemQty('');
    setNewItemLoc('');
    setShowAddStockModal(false);
    alert('🟢 STOCK MATRIX RECORD SECURED!\nInventory local file register populated successfully.');
  };

  const filteredJobs = activeJobCards.filter(job => {
    const matchesFolder = activeFolder === 'All' || job.folder === activeFolder;
    const matchesSearch = job.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.rego.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="min-h-screen text-slate-100 font-sans pb-12" style={{ background: C.background }}>
      {!user ? (
        <AuthGate onAuthenticate={handleAuthenticate} isAuthenticating={isAuthenticating} />
      ) : (
        <div className="p-4 max-w-7xl mx-auto">
          
          {/* HIGH-DENSITY TOP TERMINAL CONTROLLER CONSOLE BAR */}
          <div className="rounded-xl border p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg shadow-black/40" style={{ borderColor: C.border, background: C.panel }}>
            <div>
              <div className="flex items-center gap-2">
                <Wrench className="text-orange-500 h-5 w-5" /> 
                <h2 className="text-lg font-bold tracking-tight">PartsForge Workshop Core Node</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Operator Profile: <span className="font-semibold text-slate-200">{user.email}</span> | <span className="text-orange-400 font-bold uppercase">{user.role === 'APPRENTICE' ? 'Employee Link' : 'Master Mechanic'} Access Mode</span></p>
              {user.role === 'APPRENTICE' && <p className="text-[10px] text-slate-500 mt-0.5 font-mono">🔗 Supervisor Routing Destination: {user.linkedAccount}</p>}
            </div>
            <button onClick={() => setUser(null)} className="w-full sm:w-auto text-xs px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-900/40 transition-all font-bold uppercase tracking-wider shadow-sm">Terminate Session</button>
          </div>

          {/* MASTER GARAGE GRID SYSTEMS ARCHITECTURE */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* LEFT CONTAINER: SIDEBAR ACTIVE SYSTEM FOLDER INDEX */}
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border p-4 shadow-md" style={{ borderColor: C.border, background: C.panel }}>
                <div className="flex justify-between items-center mb-3 border-b pb-2" style={{ borderColor: C.border }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Folder className="h-4 w-4 text-orange-500" /> Active Storage Directories
                  </h3>
                  <button onClick={() => alert('Folder Creation Interface Active')} className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 text-orange-400 hover:text-orange-300">
                    <FolderPlus className="h-3.5 w-3.5" /> New
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {['All', 'Brakes', 'Servicing', 'Diagnostics'].map(folderName => (
                    <button key={folderName} onClick={() => setActiveFolder(folderName)} className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex justify-between items-center transition-all" style={{ background: activeFolder === folderName ? C.panel2 : 'transparent', border: activeFolder === folderName ? `1px solid ${C.border}` : '1px solid transparent', color: activeFolder === folderName ? '#FFF' : C.textDim }}>
                      <span className="flex items-center gap-2"><Folder className={`h-3.5 w-3.5 ${activeFolder === folderName ? 'text-orange-500' : 'text-slate-600'}`} /> {folderName}</span>
                      <ChevronRight className={`h-3 w-3 transition-transform ${activeFolder === folderName ? 'rotate-90 text-orange-500' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* LOCAL SHELF ONSITE STOCK INVENTORY STORAGE VAULT MODULE */}
              <div className="rounded-xl border p-4 shadow-md" style={{ borderColor: C.border, background: C.panel }}>
                <div className="flex justify-between items-center mb-3 border-b pb-2" style={{ borderColor: C.border }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-orange-500" /> Onsite Inventory Shelf Vault
                  </h3>
                  {user?.role !== 'APPRENTICE' && (
                    <button onClick={() => setShowAddStockModal(true)} className="text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-slate-950 px-2 py-0.5 rounded font-mono hover:bg-orange-400 transition-all">Upload</button>
                  )}
                </div>
                
                {user?.role === 'APPRENTICE' && (
                            <p className="text-[10px] text-slate-500 italic mb-3 leading-relaxed">🔒 Onsite catalogue modifications restricted under employee session filters.</p>
                )}

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {inventoryList.map(stock => (
                    <div key={stock.id} className="p-2.5 rounded-lg border flex justify-between items-center text-xs bg-slate-950/40 border-slate-800/80">
                      <div className="truncate pr-2">
                        <div className="font-semibold text-slate-300 truncate">{stock.item}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{stock.id} | Loc: <span className="text-slate-400 font-semibold">{stock.location}</span></div>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded font-mono bg-slate-900 border border-slate-700 text-orange-400">×{stock.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTRAL & RIGHT SECTOR COMBO MODULE: ACTIVE INTERACTIVE WORKSPACE CARD MATRIX */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              
              {/* PRIMARY HIGH-DENSITY GLOBAL CATALOG INTERACTIVE SEARCHBAR */}
              <div className="rounded-xl border p-4 shadow-md flex flex-col sm:flex-row gap-3 items-center" style={{ borderColor: C.border, background: C.panel }}>
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Global Marketplace Catalogue Scan... Search number plates, part names, trade SKUs, or vehicle tags..." className="w-full rounded-xl border pl-11 pr-4 py-3 text-xs text-slate-100 outline-none transition-all focus:border-slate-700" style={{ borderColor: C.border, background: C.panel2 }} />
                </div>
                <button onClick={() => alert(`Searching commercial directories for keyword query: ${searchQuery}`)} className="w-full sm:w-auto px-5 py-3 rounded-xl bg-orange-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-orange-400 transition-all shadow-sm">Execute Lookup</button>
              </div>

              {/* CORE INTERACTIVE ACTIVE SHOP JOB CARD LOG LAYOUT CONTAINER GRID */}
              <div className="rounded-xl border p-5 shadow-lg" style={{ borderColor: C.border, background: C.panel }}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-4">
                  <FileText className="h-4 w-4 text-orange-500" /> Synced Shop Floor Active Job Cards ({filteredJobs.length} Record Loaded)
                </h3>
                
                {filteredJobs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 text-center">No active repair cards currently catalogued within this folder directory scope match your search parameters.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredJobs.map(job => (
                      <div key={job.id} className="p-4 rounded-xl border flex flex-col justify-between shadow-sm transition-all border-slate-800/80 bg-slate-900/40 hover:border-slate-700/60">
                        <div>
                          <div className="flex justify-between items-center border-b pb-2 mb-2.5" style={{ borderColor: C.border }}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-orange-400">{job.id}</span>
                              <span className="text-[9px] px-2 py-0.5 rounded font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">{job.folder}</span>
                            </div>
                            <span style={{ color: job.status.includes('Verified') ? C.emerald : '#F59E0B', fontSize: '10px' }} className="uppercase tracking-wider font-bold bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800/60">{job.status}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-200">{job.customer} <span className="font-mono text-xs font-medium text-slate-500">[{job.rego}]</span></h4>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed"><span className="text-slate-500 font-medium">Active Assignment:</span> {job.currentTask}</p>
                        </div>
                        
                        <div className="mt-5 pt-3 border-t flex gap-2" style={{ borderColor: C.border }}>
                          <button onClick={() => handleCourierScan(job.id)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg font-bold text-[10px] bg-slate-800 border border-slate-700 text-slate-300 uppercase tracking-wider hover:bg-slate-700 transition-all">
                            <ScanLine className="h-3.5 w-3.5 text-emerald-400" /> Plate / Manifest Ingest
                          </button>
                          <button onClick={() => handleOrderExecution(job.id, `Parts Procurement Order for ${job.customer} Matrix Log`, 285.00)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg font-bold text-[10px] bg-emerald-600 text-slate-950 uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-sm">
                            <ShoppingCart className="h-3.5 w-3.5" /> {user?.role === 'APPRENTICE' ? 'Route Order' : 'Order Parts'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* REALTIME TRANSACTION CHANNELS & EMPLOYEE ACCOUNTABILITY MONITOR */}
              <div className="rounded-xl border p-5 shadow-lg" style={{ borderColor: C.border, background: C.panel }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5" style={{ color: C.emerald }}>
                  <ShieldCheck className="h-4 w-4" /> Live Employee Authorization Routing Streams
                </h3>
                
                {user?.role === 'APPRENTICE' ? (
                  <div className="p-3.5 rounded-xl border text-xs leading-relaxed border-emerald-900/40 bg-emerald-950/10">
                    📡 <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">Employee Link Node Enabled:</span> All digital wholesale procurements, part configuration overrides, and job manifests generated on this device stream directly onto your supervisor's panel for realtime trade and financial authorization checkouts.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    
                    {/* INCOMING APPROVAL TICKETS FOR OWNER TERMINALS */}
                    <div className="flex flex-col gap-2.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Awaiting Owner Intercept:</div>
                      {incomingRequests.length === 0 ? (
                        <p className="text-xs text-slate-500 italic bg-slate-950/30 p-3 rounded-xl border border-slate-900">No active employee checkout orders pending validation. System operational.</p>
                      ) : (
                        incomingRequests.map(req => (
                          <div key={req.id} className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/10 text-xs flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center font-bold text-amber-400 text-[10px] tracking-wider uppercase mb-1.5">
                                <span>⚠️ Authorization Required</span>
                                <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{req.id}</span>
                              </div>
                              <p className="text-slate-200 font-semibold leading-snug">{req.desc}</p>
                              <div className="text-[10px] text-slate-400 mt-2 font-mono flex flex-col gap-0.5 bg-slate-950/30 p-2 rounded border border-slate-800/60">
                                <div>Job Assignment Reference: <span className="text-slate-200 font-bold">{req.jobId}</span></div>
                                <div>Financial Value Clip: <span className="text-orange-400 font-bold">${req.price.toFixed(2)}</span></div>
                                <div className="text-slate-500 mt-1">Operator ID: {req.apprentice} [{req.timestamp}]</div>
                              </div>
                                                        <div className="mt-3.5 flex gap-2 border-t pt-2.5 border-slate-800/60">
                              <button onClick={() => handleOwnerApproveOrder(req.id, 'APPROVE')} className="flex-1 py-1.5 rounded-lg font-bold text-[10px] uppercase bg-emerald-600 text-slate-950 hover:bg-emerald-500 transition-all flex items-center justify-center gap-0.5 shadow-sm">
                                <Check className="h-3 w-3" /> Approve & Pay
                              </button>
                              <button onClick={() => handleOwnerApproveOrder(req.id, 'DENY')} className="py-1.5 px-3 rounded-lg font-bold text-[10px] uppercase bg-slate-800 text-red-400 border border-slate-700 hover:bg-slate-700 hover:text-red-300 transition-all">
                                <Ban className="h-3 w-3" /> Drop
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>


                    {/* COMPLETED FINANCIAL SETTLEMENT TRANSACTION AUDIT LOGS */}
                    <div className="flex flex-col gap-2.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stripe Live Audit Receipts:</div>
                      {completedTransactions.length === 0 ? (
                        <p className="text-xs text-slate-500 italic bg-slate-950/30 p-3 rounded-xl border border-slate-900">No transactions recorded on this terminal sequence instance layer yet.</p>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                          {completedTransactions.map((tx, i) => (
                            <div key={i} className="p-2.5 rounded-lg text-[10px] bg-slate-950/60 border border-slate-800/80 flex justify-between items-center font-mono">
                              <div className="truncate pr-2 text-slate-300">
                                <span className="text-emerald-400 font-bold">ST_LIV_OK</span> | {tx.desc} <span className="text-slate-500">({tx.jobId})</span>
                              </div>
                              <span className="text-slate-100 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">${tx.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ON-SHELF PHYSICAL STOCK MANAGEMENT REGISTRATION VAULT DIALOG BOX MODAL LAYER */}
          {showAddStockModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border p-5 shadow-2xl relative" style={{ background: C.panel, borderColor: C.border }}>
                <button onClick={() => setShowAddStockModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 transition-all">
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2 border-b pb-3 mb-4" style={{ borderColor: C.border }}>
                  <Layers className="text-orange-500 h-4 w-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">Catalog Local Shelf Stock</h3>
                </div>
                <form onSubmit={handleAddInventoryItem} className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Part Description & Brand Specifics</label>
                    <input type="text" required value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g. Bendix Rear Brake Pads (DB1423)" className="mt-1 w-full rounded-lg p-2.5 text-xs text-slate-100 outline-none border bg-slate-950/50" style={{ borderColor: C.border }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shelf Balance Qty</label>
                      <input type="number" required value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} placeholder="e.g. 6" className="mt-1 w-full rounded-lg p-2.5 text-xs text-slate-100 outline-none border bg-slate-950/50" style={{ borderColor: C.border }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shelf Grid Location</label>
                      <input type="text" value={newItemLoc} onChange={(e) => setNewItemLoc(e.target.value)} placeholder="e.g. Row C4" className="mt-1 w-full rounded-lg p-2.5 text-xs text-slate-100 outline-none border bg-slate-950/50" style={{ borderColor: C.border }} />
                    </div>
                  </div>
                  <button type="submit" className="w-full mt-3 py-2.5 rounded-lg font-bold text-xs bg-orange-500 text-slate-950 uppercase tracking-wider shadow-sm hover:bg-orange-400 transition-all">Register Onsite Stock Unit</button>
                </form>
              </div>
            </div>
          )}

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



