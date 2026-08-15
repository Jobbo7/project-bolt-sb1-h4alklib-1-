import React, { useState, useRef } from 'react';
import { 
  Wrench, KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle, 
  UserCheck, Folder, FolderPlus, Search, ShieldCheck, Check, Ban, ScanLine, ShoppingCart 
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
  
  // LIVE APPRENTICE PURCHASING LOG INTEGRATION
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [completedTransactions, setCompletedTransactions] = useState([]);

  const handleAuthenticate = ({ email, role, linkedAccount }) => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setUser({ email, role, linkedAccount: linkedAccount || 'Master Root Account' });
      setIsAuthenticating(false);
    }, 1500);
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
      alert(`🚨 APPRENTICE LINK ACTIVE!\nOrder held securely. Detailed parts list and job card metrics streamed directly to your master account holder: ${user.linkedAccount}`);
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
          
          {/* TOP HUB CONSOLE BANNER */}
          <div className="rounded-xl border p-4 mb-6 flex justify-between items-center" style={{ borderColor: C.border, background: C.panel }}>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Wrench className="text-orange-500 h-5 w-5" /> PartsForge Workspace Terminal
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Operator Profile: <span className="font-semibold text-slate-200">{user.email}</span> | <span className="text-orange-400 font-bold uppercase">{user.role} TIER</span></p>
              {user.role === 'APPRENTICE' && <p className="text-[10px] text-slate-400 mt-0.5">🔗 Linked to Employer: {user.linkedAccount}</p>}
            </div>
            <button onClick={() => setUser(null)} className="text-xs px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 transition-all font-semibold uppercase tracking-wider">Terminate Session</button>
          </div>

          {/* STREAMLINED WORKSPACE LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT 2 COLUMNS: CLEAN SEARCH CARDS & JOB CARD FOLDERS */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* WIDE DIRECT PARTS SEARCH SEARCHBAR */}
              <div className="rounded-xl border p-5" style={{ borderColor: C.border, background: C.panel }}>
                <div className="relative flex items-center">
                  <Search className="absolute left-4 h-5 w-5 text-slate-400" />
                  <input type="text" placeholder="Global Marketplace Search... Type part name, vehicle model, VIN or trade SKU number..." className="w-full rounded-xl border pl-12 pr-4 py-3 text-sm text-slate-100 outline-none" style={{ borderColor: C.border, background: C.panel2 }} />
                </div>
              </div>

              {/* CLEAN SYSTEM FOLDER AND ACTIVE JOB CARD TILES */}
              <div className="rounded-xl border p-5" style={{ borderColor: C.border, background: C.panel }}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Folder className="h-4 w-4 text-orange-500" /> Active Workshop Job Cards (Synced Realtime)
                  </h3>
                  <button className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border px-2 py-1 rounded border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all">
                    <FolderPlus className="h-3 w-3 text-orange-500" /> Create Folder
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {/* JOB CARD TILE 1 */}
                  <div className="p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all" style={{ background: C.panel2, borderColor: C.border }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-orange-400">JOB-902</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">Awaiting Manifest Ingestion</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 mt-1">Toyota Hiace (Rego: YTR-882)</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Operation: Front Brake System Rotors & Pads Upgrade</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0" style={{ borderColor: C.border }}>
                      <button onClick={() => alert("Scanning Courier Manifest via High-Speed Camera Viewfinder...")} className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-bold text-xs bg-slate-800 border border-slate-700 text-slate-200 uppercase tracking-wider hover:bg-slate-700 transition-all">
                        <ScanLine className="h-3.5 w-3.5 text-emerald-400" /> Manifest Ingest
                      </button>
                      <button onClick={() => handleOrderExecution('JOB-902', 'DBA Slotted Brake Rotors + Bendix Pads Heavy Duty Set', 360.00)} className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-bold text-xs bg-emerald-600 text-slate-950 uppercase tracking-wider hover:bg-emerald-500 transition-all">
                        <ShoppingCart className="h-3.5 w-3.5" /> {user?.role === 'APPRENTICE' ? 'Route Order' : 'Order Parts'}
                      </button>
                    </div>
                  </div>

                  {/* JOB CARD TILE 2 */}
                  <div className="p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all" style={{ background: C.panel2, borderColor: C.border }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-orange-400">JOB-905</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">Brake Linings Fitting</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 mt-1">Ford Ranger (Rego: 1BC-9XD)</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Operation: Logbook Major Service + Filter Suite</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0" style={{ borderColor: C.border }}>
                      <button onClick={() => alert("Scanning Courier Manifest via High-Speed Camera Viewfinder...")} className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-bold text-xs bg-slate-800 border border-slate-700 text-slate-200 uppercase tracking-wider hover:bg-slate-700 transition-all">
                        <ScanLine className="h-3.5 w-3.5 text-emerald-400" /> Manifest Ingest
                      </button>
                      <button onClick={() => handleOrderExecution('JOB-905', 'Ryco Filter Suite Major Service Pack', 145.00)} className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-bold text-xs bg-emerald-600 text-slate-950 uppercase tracking-wider hover:bg-emerald-500 transition-all">
                        <ShoppingCart className="h-3.5 w-3.5" /> {user?.role === 'APPRENTICE' ? 'Route Order' : 'Order Parts'}
                      </button>
                    </div>
                  </div>

