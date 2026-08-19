import React from 'react';

export default function MechanicConsole({ userSession, handleSignOut, partsLoading, results, handleSearch, handleRegoLookup, vehicle, cart, setCart, executeStripeSplitPayouts }) {
  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 p-4 font-sans space-y-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-slate-950 font-black">⚙️</div>
          <div>
            <h1 className="text-md font-extrabold tracking-tight">PartsForge Mechanic Terminal</h1>
            <p className="text-xs text-slate-400">Operator: <span className="text-orange-400 font-bold">{userSession.email}</span></p>
          </div>
        </div>
        <button onClick={handleSignOut} className="rounded-lg border border-slate-800 bg-[#101524] px-3 py-1.5 text-xs font-bold text-slate-300">Sign Out</button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#101524] p-5 shadow-2xl space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">🔍 Parts Search Aggregator</div>
            <div className="flex gap-2">
              <input type="text" id="p-search" placeholder="Search components (e.g. Brake Pads, Oil Filter...)" className="flex-1 rounded-lg border border-slate-800 bg-[#0C111C] px-4 py-2 text-xs outline-none font-mono" onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)} />
              <button onClick={() => handleSearch(document.getElementById('p-search').value)} className="rounded-lg bg-orange-500 text-slate-950 font-bold px-4 py-2 text-xs uppercase">Search</button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {partsLoading && <div className="text-xs text-orange-400 animate-pulse py-2 font-mono">📡 Scanning central databases...</div>}
              {results.local?.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-slate-800 bg-[#0C111C] p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950 text-orange-400">Wholesale</span>
                    <div className="text-xs font-bold text-slate-200 mt-1">{item.title}</div>
                    <div className="text-[10px] text-slate-400">Supplier: {item.shop} · Stock: {item.stock}</div>
                  </div>
                  <button onClick={() => setCart(p => [...p, item])} className="rounded bg-orange-500 text-slate-950 font-black px-3 py-1.5 text-[10px]">A${parseFloat(item.trade || item.price).toFixed(2)} +</button>
                </div>
              ))}
              {results.facebook?.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-slate-800 bg-[#0C111C] p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-400">Marketplace</span>
                    <div className="text-xs font-bold text-slate-300 mt-1">{item.title}</div>
                  </div>
                  <button onClick={() => setCart(p => [...p, item])} className="rounded border border-slate-800 bg-slate-900 text-slate-300 font-bold px-3 py-1.5 text-[10px]">A${parseFloat(item.price).toFixed(2)} +</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#101524] p-4 shadow-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">🏎️ Vehicle Registry Search</div>
            <div className="flex gap-2">
              <input type="text" id="r-search" placeholder="e.g. NISSAN55" className="flex-1 rounded-lg border border-slate-800 bg-[#0C111C] px-3 py-2 text-xs uppercase font-mono" />
              <button onClick={() => handleRegoLookup(document.getElementById('r-search').value)} className="rounded-lg bg-orange-500 text-slate-950 font-bold px-3 text-xs uppercase">Lookup</button>
            </div>
            {vehicle && (
              <div className="mt-2 rounded-lg border border-emerald-900/30 bg-emerald-950/5 p-3 text-xs space-y-1">
                <div className="font-bold text-emerald-400 text-[10px]">✓ Records Found</div>
                <div className="text-slate-200 font-extrabold">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                <div className="text-slate-500 font-mono text-[9px]">VIN: {vehicle.vin} · PLATES: {vehicle.rego}</div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#101524] p-4 shadow-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex justify-between items-center">
              <span>🛒 Sourcing Basket</span>
              <span className="text-[10px] font-mono text-orange-400">{cart.length} items</span>
            </div>
            <div className="space-y-1.5 max-h-[150px] overflow-y-auto font-mono text-xs text-slate-400">
              {cart.map((c, i) => (
                <div key={i} className="flex justify-between items-center border-b border-slate-900 pb-1">
                  <span className="text-slate-300 truncate max-w-[140px]">{c.title}</span>
                  <span className="text-emerald-400 font-bold">A${parseFloat(c.trade || c.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <button onClick={() => executeStripeSplitPayouts(cart, cart.reduce((s, c) => s + parseFloat(c.trade || c.price), 0))} className="w-full bg-emerald-500 text-slate-950 font-black py-2 rounded-lg text-xs uppercase tracking-wider">Proceed to Stripe Checkout</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
