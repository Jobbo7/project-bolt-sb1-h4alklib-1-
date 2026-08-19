import React, { useState } from 'react';
import { processPartsQuery, executeStripeSplitPayouts } from './mockBackend.js';

export default function App() {
  const [user, setUser] = useState({ email: 'demo@workshop.com', role: 'MECHANIC' });
  const [partsLoading, setPartsLoading] = useState(false);
  const [results, setResults] = useState({ local: [], facebook: [] });
  const [cart, setCart] = useState([]);
  const [vehicle, setVehicle] = useState(null);

  const handleSearch = async (q) => {
    if (!q) return;
    setPartsLoading(true);
    try {
      const res = await processPartsQuery(q);
      setResults({ local: res.localWholesalers || [], facebook: res.facebookMarketplace || [] });
    } catch (err) { console.error(err); } finally { setPartsLoading(false); }
  };

  const handleRegoLookup = async (plate) => {
    if (!plate) return;
    try {
      const res = await fetch('/api/vehicle-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate: plate.trim() })
      });
      setVehicle(await res.json());
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 p-4 font-sans space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <h1 className="text-sm font-bold text-orange-400">PartsForge Console ({user.role})</h1>
        <button onClick={() => setUser(p => ({ ...p, role: p.role === 'MECHANIC' ? 'SELLER' : 'MECHANIC' }))} className="text-xs bg-slate-800 px-2 py-1 rounded">Toggle Role</button>
      </div>

      {user.role === 'SELLER' ? (
        <div className="p-4 border border-slate-800 bg-[#101524] rounded-xl space-y-2">
          <p className="text-xs text-slate-400">Wholesaler Network Portal Connected.</p>
          <button onClick={async () => {
            await fetch('/api/wholesaler-bulk-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inventoryArray: [{ sku: 'BRK-PAD-CER-001', component: 'Ceramic Brake Pad Set', stockQty: 48, tradePrice: '42.50' }], businessName: user.email }) });
            alert("✅ SUPABASE SYNC COMPLETED");
          }} className="bg-cyan-500 text-slate-950 font-bold px-3 py-1.5 text-xs rounded">Sync Master CSV Sheet to Supabase Table</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-slate-800 bg-[#101524] rounded-xl space-y-3">
            <div className="text-xs font-bold text-slate-400">🔍 Parts Aggregator Search Engine</div>
            <div className="flex gap-2">
              <input type="text" id="p-search" placeholder="e.g. Brake Pads, Oil Filter" className="flex-1 rounded bg-[#0C111C] border border-slate-800 px-3 py-1 text-xs outline-none" onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)} />
              <button onClick={() => handleSearch(document.getElementById('p-search').value)} className="bg-orange-500 text-slate-950 font-bold px-3 py-1 text-xs rounded">Search</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto text-xs font-mono">
              {partsLoading && <div className="text-orange-400 animate-pulse">📡 Scanning Live Repositories...</div>}
              {results.local?.map((i, idx) => <div key={idx} className="p-2 bg-[#0C111C] rounded border border-slate-800 flex justify-between"><span>{i.title} (Stock: {i.stock})</span><button onClick={() => setCart(c => [...c, i])} className="text-emerald-400 font-bold">A${parseFloat(i.trade || i.price).toFixed(2)} +</button></div>)}
              {results.facebook?.map((i, idx) => <div key={idx} className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between"><span className="text-blue-400">[FB] {i.title}</span><button onClick={() => setCart(c => [...c, i])} className="text-cyan-400 font-bold">A${parseFloat(i.price).toFixed(2)} +</button></div>)}
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 border border-slate-800 bg-[#101524] rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-400">🏎️ Vehicle Registry Scanner Lookup</div>
              <div className="flex gap-2">
                <input type="text" id="r-search" placeholder="e.g. NISSAN55" className="flex-1 rounded bg-[#0C111C] border border-slate-800 px-3 py-1 text-xs outline-none uppercase font-mono" />
                <button onClick={() => handleRegoLookup(document.getElementById('r-search').value)} className="bg-orange-500 text-slate-950 font-bold px-3 py-1 text-xs rounded">Lookup</button>
              </div>
              {vehicle && <div className="p-2 bg-emerald-950/20 border border-emerald-900 rounded text-xs font-mono text-slate-300">✓ Found: <b className="text-emerald-400">{vehicle.year} {vehicle.make} {vehicle.model}</b><br/>{vehicle.engine}<br/>VIN: {vehicle.vin}</div>}
            </div>

            <div className="p-4 border border-slate-800 bg-[#101524] rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-400 flex justify-between"><span>🛒 Sourcing Basket</span><span>({cart.length} items)</span></div>
              <div className="max-h-32 overflow-y-auto text-xs font-mono text-slate-400">
                {cart.map((c, i) => <div key={i} className="flex justify-between border-b border-slate-900 pb-0.5"><span>{c.title}</span><span className="text-emerald-400">A${parseFloat(c.trade || c.price).toFixed(2)}</span></div>)}
              </div>
              {cart.length > 0 && <button onClick={() => executeStripeSplitPayouts(cart, cart.reduce((s, c) => s + parseFloat(c.trade || c.price), 0))} className="w-full bg-emerald-500 text-slate-950 font-bold py-1.5 text-xs rounded uppercase tracking-wider">Proceed to Stripe Checkout</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
