import React, { useState, useRef } from 'react';
import { 
  Wrench, KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle, 
  UserCheck, Folder, FolderPlus, Search, ShieldCheck, Check, Ban, 
  ScanLine, ShoppingCart, Layers, FileText, ChevronRight, X,
  Building, PlusCircle, ArrowUpRight
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

  // SELLER TIERS MANAGEMENT EXTRA STATES
  const [newSellerPart, setNewSellerPart] = useState('');
  const [newSellerPrice, setNewSellerPartPrice] = useState('');
  const [sellerOffers, setSellerOffers] = useState([
    { id: 'OFF-402', part: 'DBA Slotted Brake Rotors (Pair)', price: 210.00, stock: 8 },
    { id: 'OFF-109', part: 'Ryco Oil Filter Suite Pack', price: 110.00, stock: 24 }
  ]);

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
      alert(`🚨 EMPLOYEE LINK ROUTER ACTIVE!\nOrder held for authorization. Detailed job card metrics streamed directly to your master account holder: ${user.linkedAccount}`);
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

  const handleAddSellerPart = (e) => {
    e.preventDefault();
    if (!newSellerPart.trim() || !newSellerPrice) return;
    const offerRecord = {
      id: `OFF-${Date.now().toString().slice(-3)}`,
      part: newSellerPart.trim(),
      price: parseFloat(newSellerPrice),
      stock: 10
    };
    setSellerOffers(prev => [offerRecord, ...prev]);
    setNewSellerPart('');
    setNewSellerPartPrice('');
    alert('🟢 TRADE CATALOG LISTING LIVE!\nWholesale pricing broadcasted over the PartsForge network matching engine.');
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
              <p className="text-xs text-slate-400 mt-0.5">Operator Profile: <span className="font-semibold text-slate-200">{user.email}</span> | <span className="text-orange-400 font-bold uppercase">{user.role === 'APPRENTICE' ? 'Employee Link' : user.role === 'SELLER' ? 'Verified Seller' : 'Master Mechanic'} Access Mode</span></p>
              {user.role === 'APPRENTICE' && <p className="text-[10px] text-slate-500 mt-0.5 font-mono">🔗 Supervisor Routing Destination: {user.linkedAccount}</p>}
            </div>
            <button onClick={() => setUser(null)} className="w-full sm:w-auto text-xs px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-900/40 transition-all font-bold uppercase tracking-wider shadow-sm">Terminate Session</button>
          </div>

          {/* DYNAMIC DASHBOARD SWITCHER BY TIER */}
          {user.role === 'SELLER' ? (
            
            /* 🏭 SELLER DASHBOARD VIEW INTERFACE */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="rounded-xl border p-5 shadow-lg" style={{ borderColor: C.border, background: C.panel }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-2">
                    <Building className="text-orange-500 h-4 w-4" /> Live Wholesale Listings Catalog
                  </h3>
                  <form onSubmit={handleAddSellerPart} className="flex flex-col gap-3 p-4 rounded-xl border mb-4 bg-slate-900/40" style={{ borderColor: C.border }}>
                    <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">Broadcast Wholesale Offer:</div>
                    <input type="text" required value={newSellerPart} onChange={(e) => setNewSellerPart(e.target.value)} placeholder="Part description & cross brand (e.g. DBA Heavy Duty Rotors)" className="w-full rounded-lg p-2.5 text-xs text-slate-100 outline-none border bg-slate-950/50" style={{ borderColor: C.border }} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" step="0.01" required value={newSellerPrice} onChange={(e) => setNewSellerPartPrice(e.target.value)} placeholder="Trade Price ($ AUD)" className="w-full rounded-lg p-2.5 text-xs text-slate-100 outline-none border bg-slate-950/50" style={{ borderColor: C.border }} />
                      <button type="submit" className="py-2.5 rounded-lg bg-orange-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-orange-400 transition-all">
                        <PlusCircle className="h-4 w-4" /> Inject Listing
                      </button>
                    </div>
                  </form>
                  <div className="flex flex-col gap-2.5">
                                       {sellerOffers.map(offer => (
                      <div key={offer.id} className="p-3.5 rounded-xl border flex justify-between items-center bg-slate-950/40 border-slate-800/80">
                        <div>
                          <div className="text-xs font-bold text-slate-200">{offer.part}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{offer.id} | Available Inventory: {offer.stock} units</div>
                        </div>
                        <span className="text-sm font-bold text-orange-400 font-mono">${offer.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border p-5 shadow-lg" style={{ borderColor: C.border, background: C.panel }}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" /> Merchant Financial Metrics
                </h3>
                <div className="p-4 rounded-xl border text-center mb-4 bg-slate-950/40 border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Settled Payout Vault</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">$4,120.00</div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-widest mt-1 font-mono">Live via Stripe Connect</div>
                </div>
              </div>
            </div>

          ) : (
            
            /* 🔧 MECHANIC & EMPLOYEE DASHBOARD INTERFACE */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
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

                <div className="rounded-xl border p-4 shadow-md" style={{ borderColor: C.border, background: C.panel }}>
                  <div className="flex justify-between items-center mb-3 border-b pb-2" style={{ borderColor: C.border }}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-orange-500" /> Onsite Inventory Shelf Vault
                    </h3>
                    {user?.role !== 'APPRENTICE' && (
                      <button onClick={() => setShowAddStockModal(true)} className="text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-slate-950 px-2 py-0.5 rounded font-mono hover:bg-orange-400 transition-all">Upload</button>
                    )}
                  </div>
                  {user?.role === 'APPRENTICE' && <p className="text-[10px] text-slate-500 italic mb-3 leading-relaxed">🔒 Stock catalogue updates restricted on employee session loops.</p>}
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

              <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="rounded-xl border p-4 shadow-md flex flex-col sm:flex-row gap-3 items-center" style={{ borderColor: C.border, background: C.panel }}>
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Global Marketplace Catalogue Scan... Search number plates, part names, trade SKUs, or vehicle tags..." className="w-full rounded-xl border pl-11 pr-4 py-3 text-xs text-slate-100 outline-none transition-all" style={{ borderColor: C.border, background: C.panel2 }} />
                  </div>
                  <button onClick={() => alert(`Searching commercial matching matrix for query: ${searchQuery}`)} className="w-full sm:w-auto px-5 py-3 rounded-xl bg-orange-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-orange-400 transition-all shadow-sm">Execute Lookup</button>
                </div>

                <div className="rounded-xl border p-5 shadow-lg" style={{ borderColor: C.border, background: C.panel }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-4">
                    <FileText className="h-4 w-4 text-orange-500" /> Synced Shop Floor Active Job Cards ({filteredJobs.length} Record Loaded)
                  </h3>
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
                </div>

           
