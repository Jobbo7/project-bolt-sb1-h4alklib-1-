import React, { useState } from 'react';
import { 
  Wrench, Search, Package, Save, Send, Warehouse, ArrowLeft, 
  CheckCircle2, ClipboardList, Layers, Upload, ShieldCheck
} from 'lucide-react';
import { processPartsQuery, executeWholesalerItemUpload, executeStripeSplitPayouts } from './mockBackend.js';

function AuthGate({ onAuthenticate }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MECHANIC');
  return (
    <div className="min-h-screen bg-[#070A12] flex items-center justify-center p-4 text-slate-100 font-sans">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#101524] p-6 space-y-4 shadow-2xl">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-50">PartsForge Network Gate</h2>
          <p className="text-xs text-slate-400">Authenticate session connection node</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mechanic@workshop.com" className="mt-1 w-full rounded-lg border border-slate-800 bg-[#0C111C] px-3 py-2 text-xs text-slate-100 outline-none focus:border-orange-500 font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Console Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-800 bg-[#0C111C] px-3 py-2 text-xs text-slate-100 outline-none focus:border-orange-500 font-sans">
              <option value="MECHANIC">Registered Mechanic Workshop (Buyer)</option>
              <option value="SELLER">Verified Parts Seller Network (Wholesaler)</option>
            </select>
          </div>
          <button onClick={() => onAuthenticate(email || 'demo@partsforge.com', role)} className="w-full rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-extrabold text-slate-950 uppercase tracking-wider transition-all">Authenticate Secure Entry</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [userSession, setUserSession] = useState(null);
  const [partsLoading, setPartsLoading] = useState(false);
  const [results, setResults] = useState({ local: [], facebook: [] });
  const [cart, setCart] = useState([]);
  const [vehicle, setVehicle] = useState({ make: "STANDBY", model: "AWAITING LOOKUP INPUT", year: 2026, engine: "SYSTEM ACTIVE", vin: "WMI-LOGISTICS-001", rego: "STANDBY" });
  const [success, setSuccess] = useState(null);

  const [inventory, setInventory] = useState([
    { sku: 'BRK-PAD-CER-001', component: 'Ceramic Brake Pad Set — Front', stockQty: 48, tradePrice: 'A$42.50' },
    { sku: 'OIL-FLT-PRO-220', component: 'Pro Oil Filter — Spin-On', stockQty: 120, tradePrice: 'A$8.90' },
    { sku: 'IGN-COIL-V6-003', component: 'Ignition Coil Pack — V6', stockQty: 18, tradePrice: 'A$65.00' },
    { sku: 'AIR-FLT-CAB-014', component: 'Cabin Air Filter — Carbon', stockQty: 64, tradePrice: 'A$18.75' }
  ]);

  const handleSignOut = () => {
    setUserSession(null);
    setResults({ local: [], facebook: [] });
    setCart([]);
  };

  const handleSearch = async (query) => {
    if (!query || !query.trim()) return;
    setPartsLoading(true);
    setResults({ local: [], facebook: [] });
    try {
      const liveData = await processPartsQuery(query);
      setResults({ local: liveData.localWholesalers || [], facebook: liveData.facebookMarketplace || [] });
    } catch (err) {
      console.error(err);
    } finally {
      setPartsLoading(false);
    }
  };

  const handleRegoLookup = async (plate) => {
    if (!plate || !plate.trim()) return;
    try {
      const response = await fetch('/api/vehicle-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate: plate.trim(), type: 'rego' })
      });
      const data = await response.json();
      setVehicle(data);
    } catch (err) {
      console.error(err);
    }
  };

const handleBulkCloudSync = async () => {
    setSuccess("📡 Stream connection opening to Supabase...");
    try {
      const response = await fetch('/api/wholesaler-bulk-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryArray: inventory, businessName: userSession?.email || 'Epping Auto Wholesalers' })
      });
      if (response.ok) {
        setSuccess("✅ CLOUD MATRIX SYNCED: Live across PartsForge!");
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!userSession) return <AuthGate onAuthenticate={(email, role) => setUserSession({ email, role })} />;

  if (userSession.role === 'SELLER') {
    return (
      <div className="p-4 max-w-4xl mx-auto space-y-4 text-slate-100 bg-[#070A12] min-h-screen font-sans">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-md font-bold text-orange-400">PartsForge Seller Hub ({userSession.email})</h1>
          <button onClick={handleSignOut} className="rounded bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-300">Log Out</button>
        </div>
        <button onClick={handleBulkCloudSync} className="bg-cyan-500 text-slate-950 font-bold px-4 py-2 text-xs rounded">Upload Master CSV Inventory Sheet to Sync Local Stock</button>
        {success && <div className="p-2 border border-slate-800 rounded bg-[#0C111C] text-xs font-mono text-emerald-400">{success}</div>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 p-4 font-sans space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <h1 className="text-md font-bold tracking-tight">PartsForge Master Mechanic Terminal ({userSession.email})</h1>
        <button onClick={handleSignOut} className="rounded border border-slate-800 bg-[#101524] px-3 py-1.5 text-xs text-slate-300">Sign Out</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#101524] p-5 shadow-2xl space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">🔍 Core Parts Aggregator Console Search Engine</div>
            <div className="flex gap-2">
              <input type="text" id="live-search-input-field" placeholder="Search live components (e.g. Brake Pads, Oil Filter...)" className="flex-1 rounded-lg border border-slate-800 bg-[#0C111C] px-4 py-2 text-xs text-slate-100 outline-none font-mono" onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)} />
              <button onClick={() => { const el = document.getElementById('live-search-input-field'); if (el) handleSearch(el.value); }} className="rounded-lg bg-orange-500 text-slate-950 font-bold px-4 py-2 text-xs uppercase">Search</button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {partsLoading && <div className="text-xs text-orange-400 animate-pulse py-2 font-mono">📡 Scanning Supabase DB Rows + Live Facebook Index...</div>}
              {results.local?.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-slate-800 bg-[#0C111C] p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950 text-orange-400">Wholesale Stock</span>
                    <div className="text-xs font-bold text-slate-200 mt-1">{item.title}</div>
                    <div className="text-[10px] text-slate-400">Supplier: {item.shop} · Stock: {item.stock}</div>
                  </div>
                  <button onClick={() => setCart(p => [...p, item])} className="rounded bg-orange-500 text-slate-950 font-bold px-3 py-1.5 text-[10px]">A${parseFloat(item.trade || item.price).toFixed(2)} - Add</button>
                </div>
              ))}
              {results.facebook?.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-slate-800 bg-[#0C111C] p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-400">Marketplace Ad</span>
                    <div className="text-xs font-bold text-slate-300 mt-1">{item.title}</div>
                    <div className="text-[10px] text-slate-400">Seller: {item.shop} · Area: {item.loc}</div>
                  </div>
                  <button onClick={() => setCart(p => [...p, item])} className="rounded border border-slate-800 bg-slate-900 text-slate-300 font-bold px-3 py-1.5 text-[10px]">A${parseFloat(item.price).toFixed(2)} - Source</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#101524] p-4 shadow-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">🏎️ Vehicle Registry Scanner Terminal</div>
            <div className="flex gap-2">
              <input type="text" id="manual-rego-field" placeholder="e.g. NISSAN55, FORD123" className="flex-1 rounded-lg border border-slate-800 bg-[#0C111C] px-3 py-2 text-xs uppercase font-mono" />
