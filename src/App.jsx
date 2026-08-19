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
    } military: {
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
        setSuccess("✅ CLOUD MATRIX SYNCED: All warehouse SKUs are live across the PartsForge Network!");
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

return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 p-4 font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-slate-950 font-black shadow-lg shadow-orange-500/10">⚙️</div>
          <div>
            <h1 className="text-md font-extrabold tracking-tight">PartsForge Master Mechanic Terminal</h1>
            <p className="text-xs text-slate-400">Operator Session: <span className="text-orange-400 font-bold">{userSession.email}</span></p>

            return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 p-4 font-sans space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <h1 className="text-md font-extrabold tracking-tight">PartsForge Master Mechanic Terminal ({userSession.email})</h1>
        <button onClick={() => setUserSession(null)} className="rounded border border-slate-800 bg-[#101524] px-3 py-1.5 text-xs font-bold text-slate-300">Sign Out</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#101524] p-5 space-y-4 shadow-2xl">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">🔍 Core Parts Aggregator Console Search Engine</div>
            <div className="flex gap-2">
              <input type="text" id="live-search-input" placeholder="Search component (e.g. Brake Pads, Oil Filter...)" className="flex-1 rounded-lg border border-slate-800 bg-[#0C111C] px-4 py-2 text-xs text-slate-100 outline-none" onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)} />
              <button onClick={() => handleSearch(document.getElementById('live-search-input').value)} className="rounded-lg bg-orange-500 text-slate-950 font-bold px-4 py-2 text-xs">Search</button>
            </div>

            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {partsLoading && <div className="text-xs text-orange-400 animate-pulse py-2 font-mono">📡 Scanning Supabase DB Rows + Live Facebook Marketplace Index...</div>}
              {results.local?.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-slate-800 bg-[#0C111C] p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-orange-400 uppercase tracking-wider">Wholesale Inventory</span>
                    <div className="text-xs font-bold text-slate-200 mt-1">{item.title}</div>
                    <div className="text-[10px] text-slate-400">Supplier: {item.shop} · Qty: {item.stock}</div>
                  </div>
                  <button onClick={() => setCart(p => [...p, item])} className="rounded bg-orange-500 text-slate-950 font-bold px-2.5 py-1 text-[10px]">A${parseFloat(item.trade || item.price).toFixed(2)} - Add</button>
                </div>
              ))}
              {results.facebook?.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-slate-800 bg-[#101524] p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 uppercase tracking-wider">Live Web Scraper Consumer Ad</span>
                    <div className="text-xs font-bold text-slate-300 mt-1">{item.title}</div>
                    <div className="text-[10px] text-slate-400">Seller: {item.shop} · Area: {item.loc}</div>
                  </div>
                  <button onClick={() => setCart(p => [...p, item])} className="rounded border border-slate-800 bg-slate-900 text-slate-300 font-bold px-2.5 py-1 text-[10px]">A${parseFloat(item.price).toFixed(2)} - Source</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#101524] p-4 shadow-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">🏎️ Vehicle Registry Scanner Terminal</div>
            <div className="flex gap-2">
              <input type="text" id="rego-input" placeholder="e.g. NISSAN55, FORD123" className="flex-1 rounded-lg border border-slate-800 bg-[#0C111C] px-3 py-2 text-xs uppercase" />
              <button onClick={() => handleRegoLookup(document.getElementById('rego-input').value)} className="rounded-lg bg-orange-500 text-slate-950 font-bold px-3 text-xs">Lookup</button>
            </div>
            {vehicle && (
              <div className="mt-3 rounded-lg border border-emerald-900 bg-emerald-950/20 p-3 text-xs space-y-1">
                <div className="font-extrabold text-emerald-400">✓ Real Vehicle Matched</div>
                <div className="text-slate-200 font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                <div className="text-slate-400 font-mono text-[10px]">{vehicle.engine}</div>
                <div className="text-slate-500 font-mono text-[9px] border-t border-slate-800 pt-1 mt-1">VIN: {vehicle.vin} · PLATES: {vehicle.rego}</div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#101524] p-4 shadow-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex justify-between items-center">
              <span>🛒 Sourcing Basket Folder</span>
              <span className="text-[10px] text-orange-400 bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/10 font-bold">{cart.length} items</span>
            </div>
            <div className="space-y-2 max-h-[150px] overflow-y-auto font-mono text-xs">
              {cart.map((c, i) => (
                <div key={i} className="flex justify-between items-center border-b border-slate-900 pb-1">
                  <span className="text-slate-300 truncate max-w-[150px]">{c.title}</span>
                  <span className="text-emerald-400 font-bold">A${parseFloat(c.trade || c.price).toFixed(2)}</span>
                </div>
              ))}
              {cart.length === 0 && <p className="text-[10px] text-slate-500 text-center py-2">Basket empty.</p>}
            </div>
            {cart.length > 0 && (
