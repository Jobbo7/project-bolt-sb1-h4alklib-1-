import React, { useState, useRef } from 'react';
import { 
  Wrench, KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle, 
  UserCheck, ClipboardList, ScanLine, ShoppingCart, ShieldCheck,
  Search, PlusCircle, Check, Package, Layers, FileText, Edit2, Ban
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
  
  // GLOBAL GLOBAL CATALOG MATRIX STATED DATA
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [inventoryList, setInventoryList] = useState([
    { id: 'STK-01', item: 'Bendix Heavy Duty Front Brake Pads (DB1422)', qty: 4, location: 'Shelf B2' },
    { id: 'STK-02', item: 'Ryco Oil Filter (Z9)', qty: 12, location: 'Shelf A1' }
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemLoc, setNewItemLoc] = useState('');

  // SYNCHRONIZED APP WORKFLOW STATE
  const [activeJobCards, setActiveJobCards] = useState([
    { id: 'JOB-902', customer: 'Toyota Hiace (Rego: YTR-882)', currentTask: 'Front Brake System Rotors & Pads Upgrade', status: 'Awaiting Manifest Ingestion' },
    { id: 'JOB-905', customer: 'Ford Ranger (Rego: 1BC-9XD)', currentTask: 'Logbook Major Service + Filter Suite', status: 'Brake Linings Fitting' }
  ]);
  
  // MASTER ACCOUNT INCOMING EMPLOYEE APPROVAL LOGS ARCHIVE
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
    // SIMULATED AUTOMOTIVE WHOLESALE CATALOG API DEPOSIT LOOKUP
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
      // INTERCEPT LOGIC FOR LINKED EMPLOYEES: SEND ROUTING TICKET TO OWNER FOR APPROVAL
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
      // DIRECT ROUTING LOOP FOR MASTER OWNER SECURITY CHANNELS
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
          
          {/* HEADER OPERATIONS HUB CONTROL DESK */}
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

          {/* MAIN CORE DUAL-WORKSPACE PANEL SYSTEM */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: LIVE WHOLESALE CATALOGUE ENGINE & LOOKUP */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* SEARCH ENGINE FRAMEWORK CONTAINER */}
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
