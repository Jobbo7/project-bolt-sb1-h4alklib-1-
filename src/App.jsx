import React, { useState } from 'react';
import { 
  Wrench, Search, Package, Save, Send, Warehouse, ArrowLeft, 
  CheckCircle2, ClipboardList, Layers, Upload, ShieldCheck
} from 'lucide-react';
import { processPartsQuery, executeWholesalerItemUpload, executeStripeSplitPayouts } from './mockBackend.js';

// Simple Auth Component Gate for Demonstration
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
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Console Tier Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-800 bg-[#0C111C] px-3 py-2 text-xs text-slate-100 outline-none focus:border-orange-500 font-sans">
              <option value="MECHANIC">Registered Mechanic Workshop (Buyer)</option>
              <option value="SELLER">Verified Parts Seller Network (Wholesaler)</option>
            </select>
          </div>
          <button onClick={() => onAuthenticate(email || 'demo@partsforge.com', role)} className="w-full rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-extrabold text-slate-950 uppercase tracking-wider transition-all shadow-md">Authenticate Secure Entry</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [userSession, setUserSession] = useState(null);
  const [partsLoading, setPartsLoading] = useState(false);
  const [results, setResults] = useState({ local: [], national: [], trans_tasman: [], global_direct: [], facebook: [] });
  const [cart, setCart] = useState([]);
  const [vehicle, setVehicle] = useState({ make: "STANDBY", model: "AWAITING LOOKUP INPUT", year: 2026, engine: "SYSTEM ACTIVE", vin: "WMI-LOGISTICS-001", rego: "STANDBY" });
  const [success, setSuccess] = useState(null);

  // Seller Dashboard Simulated-To-Live Inventory Dataset Rows
  const [inventory, setInventory] = useState([
    { sku: 'BRK-PAD-CER-001', component: 'Ceramic Brake Pad Set — Front', aisle: 'A', shelf: '03', stockQty: 48, tradePrice: 'A$42.50' },
    { sku: 'OIL-FLT-PRO-220', component: 'Pro Oil Filter — Spin-On', aisle: 'B', shelf: '01', stockQty: 120, tradePrice: 'A$8.90' },
    { sku: 'IGN-COIL-V6-003', component: 'Ignition Coil Pack — V6', aisle: 'C', shelf: '07', stockQty: 18, tradePrice: 'A$65.00' },
    { sku: 'AIR-FLT-CAB-014', component: 'Cabin Air Filter — Carbon', aisle: 'B', shelf: '04', stockQty: 64, tradePrice: 'A$18.75' },
    { sku: 'SUS-SHK-REAR-008', component: 'Rear Shock Absorber Pair', aisle: 'D', shelf: '02', stockQty: 12, tradePrice: 'A$89.00' },
    { sku: 'BAT-AGM-070-009', component: 'AGM Battery 70Ah', aisle: 'E', shelf: '01', stockQty: 24, tradePrice: 'A$185.00' },
    { sku: 'TIM-BELT-KIT-015', component: 'Timing Belt Kit + Tensioner', aisle: 'C', shelf: '05', stockQty: 9, tradePrice: 'A$145.00' },
    { sku: 'WPR-BLD-FRT-021', component: 'Front Wiper Blade Pair', aisle: 'A', shelf: '06', stockQty: 96, tradePrice: 'A$12.30' }
  ]);

  const handleAuthenticate = (email, role) => {
    setUserSession({ email, role });
  };

  const handleSignOut = () => {
    setUserSession(null);
    setResults({ local: [], national: [], trans_tasman: [], global_direct: [], facebook: [] });
    setCart([]);
  };

  const handleSearch = async (query) => {
    if (!query || !query.trim()) return;
    setPartsLoading(true);
    setResults({ local: [], national: [], trans_tasman: [], global_direct: [], facebook: [] });
    try {
      const liveData = await processPartsQuery(query);
      setResults({
        local: liveData.localWholesalers || [],
        national: [],
        trans_tasman: [],
        global_direct: [],
        facebook: liveData.facebookMarketplace || []
      });
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
    setSuccess("📡 Stream connection opening to Supabase distributed cluster...");
    try {
      const response = await fetch('/api/wholesaler-bulk-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryArray: inventory, businessName: userSession?.email || 'Epping Auto Wholesalers' })
      });
      if (response.ok) {
        setSuccess("✅ CLOUD MATRIX SYNCED: All 12 warehouse SKUs are live across the PartsForge Network!");
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

const handleAddToCart = (item) => {
    setCart(prev => [...prev, item]);
  };

  if (!userSession) {
    return <AuthGate onAuthenticate={handleAuthenticate} />;
  }

  // 🏢 SELLER DASHBOARD VIEW CONSOLE LAYER
  if (userSession.role === 'SELLER') {
    return (
      <div className="p-4 max-w-7xl mx-auto space-y-6 text-slate-100 bg-[#070A12] min-h-screen font-sans">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500 text-slate-950 flex items-center justify-center font-bold">🏢</div>
            <div>
              <h1 className="text-md font-extrabold tracking-tight">PartsForge Fulfillment Core</h1>
              <p className="text-xs text-slate-400">Merchant Session: <span className="text-orange-400 font-bold">{userSession.email}</span></p>
            </div>
          </div>
          <button onClick={handleSignOut} className="rounded-lg border border-slate-800 bg-[#101524] px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800">Log Out</button>
        </div>

        {success && <div className="p-3 text-xs font-bold rounded-lg border border-emerald-900/30 bg-emerald-950/20 text-emerald-400 shadow-md">{success}</div>}

        <div className="rounded-xl border border-slate-800 bg-[#101524] p-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">📦 Merchant Shelf Inventory Vault</div>
            <button onClick={handleBulkCloudSync} className="rounded bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-extrabold px-3 py-2 text-[10px] uppercase tracking-wider transition-colors shadow">Upload Master CSV Inventory Sheet to Sync Local Stock</button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0C111C]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                  <th className="p-2.5 font-mono">SKU</th>
                  <th className="p-2.5">Component / Part Description</th>
                  <th className="p-2.5 text-center">Stock Qty</th>
                  <th className="p-2.5 text-right">Trade Price</th>
                </tr>
                 </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {inventory.map((row) => (
                  <tr key={row.sku} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-2.5 text-orange-400 font-bold">{row.sku}</td>
                    <td className="p-2.5 text-slate-200 font-sans font-bold">{row.component}</td>
                    <td className="p-2.5 text-center text-slate-100 font-extrabold">{row.stockQty}</td>
                    <td className="p-2.5 text-right text-emerald-400 font-extrabold">{row.tradePrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ⚙️ MECHANIC WORKSHOP VIEW CONSOLE LAYER
  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 p-4 font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-slate-950 font-black shadow-lg shadow-orange-500/10">⚙️</div>
          <div>
            <h1 className="text-md font-extrabold tracking-tight">PartsForge Master Mechanic Terminal</h1>
