import React, { useState, Component } from 'react';
import { processPartsQuery, executeStripeSplitPayouts } from './mockBackend.js';

// 🛡️ RE-ESTABLISHING THE MANDATORY COMPLIANCE ERROR BOUNDARY CLASS FOR MAIN.TSX
export class AppErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Logged Boundary Core Rejection Exception:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070A12] text-slate-200 flex items-center justify-center p-6 text-center font-mono">
          <div className="max-w-md p-6 border border-red-900/30 rounded-xl bg-red-950/5 space-y-2">
            <div className="text-red-500 font-extrabold text-xs">⚠️ PLATFORM INTERCEPT ISOLATION ACTIVE</div>
            <p className="text-[11px] text-slate-400">A child component layer exceeded processing limits. Clear storage indices to retry.</p>
            <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold rounded-lg">Reset Workspace</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuthGate({ onAuthenticate }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MECHANIC');
  return (
    <div className="min-h-screen bg-[#070A12] flex items-center justify-center p-4 text-slate-100 font-sans">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#101524] p-6 space-y-4 shadow-2xl">
        <h2 className="text-center text-sm font-bold uppercase tracking-wider text-slate-300">PartsForge System Gateway</h2>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email Workspace Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="operator@workshop.com" className="w-full rounded-lg border border-slate-800 bg-[#0C111C] px-3 py-2 text-xs outline-none text-slate-100 font-mono" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Select Console Node Tier</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-slate-800 bg-[#0C111C] px-3 py-2 text-xs outline-none text-slate-200">
            <option value="MECHANIC">Registered Mechanic Workshop (Buyer)</option>
            <option value="SELLER">Verified Parts Seller Network (Wholesaler)</option>
          </select>
        </div>
        <button onClick={() => onAuthenticate(email || 'demo@partsforge.com', role)} className="w-full rounded-lg bg-orange-500 text-slate-950 font-extrabold py-2.5 text-xs uppercase tracking-wider shadow-md">Authenticate Secure Entry</button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [partsLoading, setPartsLoading] = useState(false);
  const [results, setResults] = useState({ local: [], facebook: [] });
  const [cart, setCart] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSearch = async (q) => {
    if (!q || !q.trim()) return;
    setPartsLoading(true);
    setResults({ local: [], facebook: [] });
    try {
      const res = await processPartsQuery(q);
      setResults({ local: res.localWholesalers || [], facebook: res.facebookMarketplace || [] });
    } catch (err) { console.error(err); } finally { setPartsLoading(false); }
  };

  const handleRegoLookup = async (plate) => {
    if (!plate || !plate.trim()) return;
    try {
      const res = await fetch('/api/vehicle-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate: plate.trim(), type: 'rego' })
      });
      setVehicle(await res.json());
    } catch (err) { console.error(err); }
  };

  if (!user) return <AuthGate onAuthenticate={(email, role) => setUser({ email, role })} />;

  if (user.role === 'SELLER') {
    return (
      <div className="p-4 max-w-4xl mx-auto space-y-4 text-slate-100 bg-[#070A12] min-h-screen font-sans">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-sm font-bold text-orange-400 uppercase tracking-wider">PartsForge Seller Hub ({user.email})</h1>
          <button onClick={() => setUser(null)} className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded text-slate-300 font-bold">Log Out</button>
        </div>
        <div className="p-5 border border-slate-800 bg-[#101524] rounded-xl space-y-3 shadow-xl">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">📦 Merchant Shelf Inventory Vault</div>
          <button onClick={async () => {
            setSuccess("📡 Opening Supabase cloud matrix connection pipeline...");
            const res = await fetch('/api/wholesaler-bulk-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inventoryArray: [{ sku: 'BRK-PAD-CER-001', component: 'Ceramic Brake Pad Set — Front', stockQty: 48, tradePrice: '42.50' }, { sku: 'OIL-FLT-PRO-220', component: 'Pro Oil Filter — Spin-On', stockQty: 120, tradePrice: '8.90' }], businessName: user.email }) });
            if (res.ok) setSuccess("✅ SUCCESS: All warehouse catalog rows are permanently written onto your live Supabase database tables!");
          }} className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-extrabold px-4 py-2.5 text-xs rounded uppercase tracking-wider transition-all">Upload Master CSV Inventory Sheet to Sync Local Stock</button>
          {success && <div className="p-2.5 border border-slate-800 rounded bg-[#0C111C] text-xs font-mono text-emerald-400 mt-2 animate-pulse">{success}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 p-4 font-sans space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <h1 className="text-sm font-bold tracking-tight uppercase tracking-wider text-slate-300">PartsForge Master Mechanic Terminal ({user.email})</h1>
        <button onClick={() => setUser(null)} className="rounded border border-slate-800 bg-[#101524] px-3 py-1.5 text-xs font-bold text-slate-400" >Sign Out</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#101524] p-5 shadow-2xl space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">🔍 Core Parts Aggregator Console Search Engine</div>
            <div className="flex gap-2">
              <input type="text" id="p-search" placeholder="Search live components (e.g. Brake Pads, Oil Filter...)" className="flex-1 rounded-lg border border-slate-800 bg-[#0C111C] px-4 py-2 text-xs text-slate-100 outline-none font-mono focus:border-orange-500 transition-all" onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)} />
              <button onClick={() => handleSearch(document.getElementById('p-search').value)} className="rounded-lg bg-orange-500 text-slate-950 font-extrabold px-4 py-2 text-xs uppercase tracking-wider">Search</button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {partsLoading && <div className="text-xs text-orange-400 animate-pulse py-2 font-mono">📡 Querying active edge parameters... Syncing Supabase DB rows + Facebook Web Crawler Index...</div>}
              {results.local?.map((i, idx) => (
                <div key={idx} className="rounded-lg border border-slate-800 bg-[#0C111C] p-3 flex justify-between items-center transition hover:border-slate-700">
                  <div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950 text-orange-400 uppercase tracking-wider">Wholesale Inventory Row</span>
                    <div className="text-xs font-bold text-slate-200 mt-1">{i.title}</div>
                    <div className="text-[10px] text-slate-400">Supplier: {i.shop} · Location Warehouse Floor Bin: {i.loc} · Stock: <span className="text-emerald-400 font-bold">{i.stock}</span></div>
                  </div>
                  <button onClick={() => setCart(c => [...c, i])} className="rounded bg-orange-500 text-slate-950 font-black px-3 py-1.5 text-[10px] uppercase">A${parseFloat(i.trade || i.price).toFixed(2)} +</button>
                </div>
              ))}
              {results.facebook?.map((i, idx) => (
                <div key={idx} className="rounded-lg border border-slate-800 bg-[#0C111C] p-3 flex justify-between items-center transition hover:border-slate-700">
                  <div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-400 uppercase tracking-wider">Live Web Scraper Consumer Ad</span>
                    <div className="text-xs font-bold text-slate-300 mt-1">{i.title}</div>
                    <div className="text-[10px] text-slate-400">Seller: {i.shop} · Pickup Area Postcode Loop: {i.loc}</div>
                  </div>
                  <button onClick={() => setCart(c => [...c, i])} className="rounded border border-slate-800 bg-slate-900 text-slate-300 font-bold px-3 py-1.5 text-[10px] uppercase">A${parseFloat(i.price).toFixed(2)} +</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
        </div>
      )}
    </div>
  );
}
