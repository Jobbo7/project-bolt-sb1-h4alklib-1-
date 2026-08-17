import React, { useState, useRef } from 'react';
import { 
  Wrench, QrCode, Search, Cpu, ShoppingCart, Play, FileText, 
  BookOpen, Folder, ChevronRight, Layers, ScanLine, ShieldCheck, 
  Check, Ban, X, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowUpRight, Building
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
  const [activeDiyTab, setActiveDiyTab] = useState('pricing');
  const [activeFolder, setActiveFolder] = useState('All');
  const [showAddStockModal, setShowAddStockModal] = useState(false);

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemLoc, setNewItemLoc] = useState('');

  const [inventoryList, setInventoryList] = useState([
    { id: 'STK-881', item: 'Bendix Front Pads - Hiace', qty: 4, location: 'Row A2' },
    { id: 'STK-882', item: 'DBA Slotted Rotors - Pair', qty: 2, location: 'Row A5' },
    { id: 'STK-883', item: 'Ryco Oil Filter Z9', qty: 12, location: 'Shelf C1' },
    { id: 'STK-884', item: 'Castrol Magnatec 5W-30 20L', qty: 3, location: 'Floor Grid 2' }
  ]);

  const [sellerOffers] = useState([
    { id: 'WHS-SKU-992A', part: 'Bendix Front Heavy Duty Pads (Hiace Commuter Spec)', price: 85.00, stock: 14, location: 'Aisle 4-B' },
    { id: 'WHS-SKU-441F', part: 'DBA T2 Street Series Slotted Brake Rotors (Front Pair)', price: 210.00, stock: 6, location: 'Aisle 9-F' },
    { id: 'WHS-SKU-102D', part: 'Ryco Cabin Air Premium Filter Upgrade Element', price: 28.50, stock: 45, location: 'Aisle 2-D' },
    { id: 'WHS-SKU-773X', part: 'Brembo Ceramic Performance Rear Disc Pads Set', price: 95.00, stock: 8, location: 'Aisle 4-C' }
  ]);

  const [jobs] = useState([
    { id: 'JOB-201', customer: 'Dave Harrison', rego: 'YTR-882', folder: 'Brakes', status: 'Awaiting Parts', currentTask: 'Fit front pads and rotors' },
    { id: 'JOB-202', customer: 'Epping Logistics', rego: '12-METRO', folder: 'Servicing', status: 'In Progress', currentTask: 'Major fleet service log check' },
    { id: 'JOB-203', customer: 'Sarah Jenkins', rego: 'VWV-991', folder: 'Diagnostics', status: 'Awaiting Verification', currentTask: 'P0300 random misfire check' }
  ]);

  const [incomingRequests, setIncomingRequests] = useState([
    { id: 'REQ-901', jobId: 'JOB-201', apprentice: 'Liam (Apprentice Tier)', desc: 'Procure Bendix Front Pads + DBA Rotors Suite', price: 295.00 }
  ]);

  const [completedTransactions, setCompletedTransactions] = useState([
    { desc: 'Ryco Fleet Consumable Pack Ingest', price: 340.00 },
    { desc: 'Trade Brake Kit Auto-Settle', price: 215.00 }
  ]);

  const handleAuthenticate = (profile) => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setUser(profile);
      setIsAuthenticating(false);
    }, 800);
  };

  const handleGlobalQrHandshake = () => {
    alert("📡 Handshake token initialized over local telemetry grids.");
  };

  const handleCourierScan = (id) => {
    alert(`📦 Tracking assigned to priority loop manifest for job target: ${id}`);
  };

  const handleOrderExecution = (jobId, desc, value) => {
    alert(`🛒 Transaction routed directly to Stripe Connect ledger. Order allocated for ${jobId}`);
    setCompletedTransactions(prev => [{ desc, price: value }, ...prev]);
  };

  const handleOwnerApproveOrder = (reqId, stance) => {
    if (stance === 'APPROVE') {
      const match = incomingRequests.find(r => r.id === reqId);
      if (match) {
        setCompletedTransactions(prev => [{ desc: `Approved Apprentice Requisition: ${match.desc}`, price: match.price }, ...prev]);
      }
    }
    setIncomingRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const handleAddInventoryItem = (e) => {
    e.preventDefault();
    if (!newItemName || !newItemQty) return;
    const itemPayload = {
      id: `STK-${Math.floor(100 + Math.random() * 900)}`,
      item: newItemName,
      qty: parseInt(newItemQty),
      location: newItemLoc || 'General'
    };
    setInventoryList(prev => [itemPayload, ...prev]);
    setShowAddStockModal(false);
    setNewItemName('');
    setNewItemQty('');
    setNewItemLoc('');
  };

  const filteredJobs = jobs.filter(j => activeFolder === 'All' || j.folder === activeFolder);

  return (
    <div className="min-h-screen text-slate-100 font-sans pb-12" style={{ background: C.background }}>
      {!user ? (
        <AuthGate onAuthenticate={handleAuthenticate} isAuthenticating={isAuthenticating} />
      ) : (
        <div className="p-4 max-w-7xl mx-auto">
          
          {/* TOP GLOBAL OPERATING BANNER CONSOLE */}
          <div className="rounded-xl border p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg" style={{ borderColor: C.border, background: C.panel }}>
            <div>
              <div className="flex items-center gap-2">
                <Wrench className="text-orange-500 h-5 w-5" /> 
                <h2 className="text-lg font-bold tracking-tight">PartsForge Trade Terminal</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Active Session: <span className="font-semibold text-slate-200">{user.email}</span> | <span className="text-orange-400 font-bold uppercase">{user.role} INTERFACE</span></p>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <button onClick={handleGlobalQrHandshake} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-800 border border-slate-700 rounded-lg text-slate-200 hover:bg-slate-700 uppercase tracking-wider transition-all"><QrCode className="h-4 w-4 text-emerald-400" /> QR Handshake</button>
              <button onClick={() => setUser(null)} className="flex-1 sm:flex-none text-xs px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 font-bold uppercase tracking-wider transition-all">Log Out</button>
            </div>
          </div>

                   {/* LAYER ROUTER DETERMINATION BY LAYER STATE */}
          {user.role === 'SELLER' ? (
            
            /* 🏭 LAYER 1: VERIFIED WHOLESALE SUPPLIER DIRECTORY INTERFACE */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="rounded-xl border p-5 shadow-lg" style={{ borderColor: C.border, background: C.panel }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
                    <Building className="text-orange-500 h-4 w-4" /> Live Wholesale Listings Catalog
                  </h3>
                  <div className="text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 font-mono leading-relaxed mb-5">
                    📡 <span className="text-orange-400 font-bold uppercase tracking-wider text-[10px]">WMS Node Live:</span> External Warehouse Management System mapped natively. Cross-reference mapping, trade SKU arrays, and algorithmic routing are interlocked. Orders auto-dispatch via priority Hot-Shot courier loops straight to the purchaser's repair bay.
                  </div>
                  <div className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2.5">Active Mapped Warehouse Inventory Rows:</div>
                  <div className="flex flex-col gap-2.5">
                    {sellerOffers.map(offer => (
                      <div key={offer.id} className="p-3.5 rounded-xl border flex justify-between items-center bg-slate-950/40 border-slate-800/80">
                        <div>
                          <div className="text-xs font-bold text-slate-200">{offer.part}</div>
                                                    Shelf Slot: <span className="text-slate-400 font-semibold">{offer.location}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-orange-400 font-mono block">${offer.price.toFixed(2)}</span>
                          <span className="text-[9px] text-emerald-400 uppercase font-bold tracking-wider font-mono">Qty: {offer.stock} Avail</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="rounded-xl border p-5 shadow-lg" style={{ borderColor: C.border, background: C.panel }}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" /> Wholesaler Settlement Metrics
                </h3>
                <div className="p-4 rounded-xl border text-center bg-slate-950/40 border-slate-800 mb-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Settled Payout Vault</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">$4,120.00</div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-widest mt-1 font-mono">Live via Stripe Connect</div>
                </div>
              </div>
            </div>

          ) : user.role === 'DIY' ? (
            
            /* 🚗 LAYER 2: DIY SMART-TERMINAL INTERFACE */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* SIDE NAVIGATION SUB-TABS */}
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setActiveDiyTab('pricing')}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all ${activeDiyTab === 'pricing' ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  style={{ borderColor: activeDiyTab === 'pricing' ? C.orange : C.border }}
                >
                  <span className="flex items-center gap-2"><Cpu className="h-4 w-4" /> Live Wholesale Procurement</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                
                <button 
                  onClick={() => setActiveDiyTab('jobs')}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all ${activeDiyTab === 'jobs' ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  style={{ borderColor: activeDiyTab === 'jobs' ? C.orange : C.border }}
                >
                  <span className="flex items-center gap-2"><Folder className="h-4 w-4" /> Active Workshop Folders</span>
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button 
                  onClick={() => setActiveDiyTab('inventory')}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all ${activeDiyTab === 'inventory' ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  style={{ borderColor: activeDiyTab === 'inventory' ? C.orange : C.border }}
                >
                  <span className="flex items-center gap-2"><Layers className="h-4 w-4" /> Stock Control Deck</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* MAIN CONTENT VIEWPORT */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                
                {/* SUB-TAB 1: LIVE WHOLESALE PROCUREMENT */}
                {activeDiyTab === 'pricing' && (
                  <div className="rounded-xl border p-5 shadow-lg" style={{ borderColor: C.border, background: C.panel }}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                        <ShoppingCart className="text-orange-500 h-4 w-4" /> Global Catalog Procurement Row
                      </h3>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                        <input 
                          type="text" 
                          placeholder="Search cross-reference SKU..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-mono"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {sellerOffers
                        .filter(o => o.part.toLowerCase().includes(searchQuery.toLowerCase()) || o.id.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(offer => (
                          <div key={offer.id} className="p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950/40 border-slate-800/80">
                            <div>
                              <div className="text-xs font-bold text-slate-200">{offer.part}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{offer.id} | Warehouse Slot: <span className="text-slate-400 font-semibold">{offer.location}</span></div>
                            </div>
                            <button 
                              onClick={() => handleOrderExecution('DIY-LIVE-BYPASS', offer.part, offer.price)}
                              className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10"
                            >
                              Procure Block (${offer.price.toFixed(2)})
                            </button>
                          </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUB-TAB 2: ACTIVE WORKSHOP FOLDERS */}
                {activeDiyTab === 'jobs' && (
                  <div className="rounded-xl border p-5 shadow-lg" style={{ borderColor: C.border, background: C.panel }}>
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                      {['All', 'Brakes', 'Servicing', 'Diagnostics'].map(folder => (
                        <button
                          key={folder}
                          onClick={() => setActiveFolder(folder)}
                          className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeFolder === folder ? 'bg-slate-800 text-orange-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          {folder}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredJobs.map(job => (
                        <div key={job.id} className="p-4 rounded-xl border bg-slate-950/30 border-slate-800 flex flex-col justify-between gap-4">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md font-bold">{job.id}</span>
                              <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${job.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>{job.status}</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-200 mt-2.5">{job.customer} <span className="text-xs text-slate-500 font-mono">({job.rego})</span></h4>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5"><Play className="h-3 w-3 text-orange-500" /> Current: {job.currentTask}</p>
                          </div>
                          <button 
                            onClick={() => handleCourierScan(job.id)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5"
                          >
                            <ScanLine className="h-3.5 w-3.5 text-emerald-400" /> Manifest Courier Loop
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUB-TAB 3: INVENTORY HUB & REQUISITION MANAGEMENT */}
                {activeDiyTab === 'inventory' && (
                  <div className="flex flex-col gap-6">
                    {/* APPRENTICE REQUISITION APPROVAL DECK */}
                    {incomingRequests.length > 0 && (
