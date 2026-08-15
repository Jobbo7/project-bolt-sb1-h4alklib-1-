import React, { useState, useRef, useEffect } from 'react';
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

  // FORM INPUTS FOR LOCAL STORAGE REGISTRATION Vault
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
    alert(`Initializing High-Speed Camera Viewfinder Wrapper...\nScanning Courier Manifest QR Code for Job Matrix Ref: ${jobId}`);
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
                <Wrench className="text-orange-500 h-5 w-5 animate-pulse" /> 
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
