import React, { useState } from 'react';

export default function MechanicTerminal({ session, onSignOut, results, partsLoading, handleSearch, handleRego, handleAddToCart, cart, executeStripeSplitPayouts }) {
  const userEmail = session?.email || 'Automated Workshop Node';
  
  const activeVehicleData = {
    id: 'BAY-1',
    make: "STANDBY",
    model: "AWAITING REGO LOOKUP OR CAM OCR SCAN",
    year: 2026,
    engine: "SYSTEM ONLINE",
    vin: "WMI-LOGISTICS-001",
    rego: "STANDBY"
  };

  const partsResultsData = results || {
    local: [],
    national: [],
    trans_tasman: [],
    global_direct: [],
    facebook: []
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 p-4 font-sans selection:bg-orange-500 selection:text-slate-950">
      {/* Main Navigation Ribbon Bar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-slate-950 font-black shadow-lg shadow-orange-500/10">⚙️</div>
          <div>
            <h1 className="text-md font-extrabold tracking-tight">PartsForge Master Mechanic Terminal</h1>
            <p className="text-xs text-slate-400">Operator Session: <span className="text-orange-400 font-bold">{userEmail}</span></p>
          </div>
        </div>
        <button onClick={onSignOut} className="rounded-lg border border-slate-800 bg-[#101524] px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800">Sign Out</button>
      </div>

      {/* Core Interactive Layout Split */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Live Interactive Aggregator Search Screen */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#101524] p-5 shadow-2xl space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">🔍 Core Parts Aggregator Console Search Engine</div>
            <div className="flex gap-2">
              <input type="text" id="live-search-input-field" placeholder="Search live components (e.g. Brake Pads, Oil Filter, Alternator...)" className="flex-1 rounded-lg border border-slate-800 bg-[#0C111C] px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-orange-500 transition-all font-mono" onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)} />
              <button onClick={() => { const el = document.getElementById('live-search-input-field'); if (el) handleSearch(el.value); }} className="rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-extrabold text-slate-950 uppercase tracking-wider transition-all">Search</button>
            </div>

            {/* Dynamic Search Results Container Grid */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {partsLoading && <div className="text-xs text-orange-400 animate-pulse py-4 font-mono">📡 Executing parallel edge requests... Scanning Supabase DB + Live Facebook Marketplace Web Index...</div>}
              
              {/* Stream A: Render Live Registered Wholesalers from your Supabase table */}
              {partsResultsData.local && partsResultsData.local.map((item, idx) => (
                <div key={item.id || idx} className="rounded-lg border border-slate-800 bg-[#0C111C] p-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition hover:border-slate-700">
                  <div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-orange-400 uppercase tracking-wider">Wholesale Inventory Row</span>
                    <div className="text-xs font-bold text-slate-200 mt-1">{item.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Supplier: {item.shop} · Location: {item.loc} · Stock: <span className="text-emerald-400 font-bold">{item.stock}</span></div>
                  </div>
                  <div className="flex items-center gap-3 justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/40 pt-2 sm:pt-0">
                    <div className="text-right"><div className="text-xs font-mono font-extrabold text-emerald-400">A${parseFloat(item.trade || item.price).toFixed(2)}</div></div>
                    <button onClick={() => handleAddToCart(item, 'local')} className="rounded bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold px-2.5 py-1.5 text-[10px] uppercase tracking-wider transition-all">Add to Basket</button>
                  </div>
                </div>
              ))}

              {/* Stream B: Render Live Crawled External Marketplace Ads */}
              {partsResultsData.facebook && partsResultsData.facebook.map((item, idx) => (
                <div key={item.id || idx} className="rounded-lg border border-slate-800 bg-[#101524] p-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition hover:border-slate-700">
                  <div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950/40 border border-blue-900/30 text-blue-400 uppercase tracking-wider">Live Web Scraper Consumer Ad</span>
                    <div className="text-xs font-bold text-slate-300 mt-1">{item.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Seller: {item.shop} · Area: {item.loc} · Distance: {item.distanceKm}km</div>
                  </div>
                  <div className="flex items-center gap-3 justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/40 pt-2 sm:pt-0">
                    <div className="text-right font-mono font-extrabold text-cyan-400 text-xs">A${parseFloat(item.price).toFixed(2)}</div>
                    <button onClick={() => handleAddToCart(item, 'facebook')} className="rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-2.5 py-1.5 text-[10px] uppercase tracking-wider transition-all">Source Item</button>
                  </div>
                </div>
              ))}

              {!partsLoading && (!partsResultsData.local?.length && !partsResultsData.facebook?.length) && (
                <p className="text-xs text-slate-500 text-center py-8 font-mono">Terminal Index Idle. Type a component keyword above to trigger parallel live searches across your Supabase tables and internet web scrapers.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Vehicle Lookup HUD Panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#101524] p-4 shadow-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">🏎️ Vehicle Registry Scanner Terminal</div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manual License Plate Search</label>
              <div className="flex gap-2">
                <input type="text" id="manual-rego-input-field" placeholder="e.g. NISSAN55, FORD123" className="flex-1 rounded-lg border border-slate-800 bg-[#0C111C] px-3 py-2 text-xs text-slate-100 font-mono outline-none uppercase tracking-widest" />
                <button onClick={() => { const el = document.getElementById('manual-rego-input-field'); if (el) handleRego(el.value, 'AU_VIC'); }} className="rounded-lg bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold px-3 text-xs uppercase tracking-wider">Lookup</button>
              </div>
            </div>

            {/* Real-time Vehicle Specification Readout Card */}
            {activeVehicleData && (
              <div className="mt-3 rounded-lg border border-emerald-900/30 bg-emerald-950/5 p-3 space-y-2">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">✓ Active Vehicle Matched</div>
                <div className="text-sm font-extrabold text-slate-200">{activeVehicleData.year} {activeVehicleData.make} {activeVehicleData.model}</div>
                <div className="text-xs text-slate-400 font-mono">{activeVehicleData.engine}</div>
                <div className="text-[10px] text-slate-500 font-mono border-t border-slate-800/60 pt-1.5 mt-1.5">VIN: {activeVehicleData.vin} · PLATES: {activeVehicleData.rego}</div>
              </div>
            )}
          </div>

          {/* Basket Sourcing Folder Overview Card */}
          <div className="rounded-xl border border-slate-800 bg-[#101524] p-4 shadow-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex justify-between items-center">
              <span>🛒 Sourcing Basket Folder</span>
              <span className="text-[10px] font-mono text-orange-400 bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/10 font-bold">{cart?.length || 0} items</span>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {cart && cart.map((c, i) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-slate-900 pb-1.5 font-mono">
                  <span className="text-slate-300 font-bold truncate max-w-[150px]">{c.title}</span>
                  <span className="text-emerald-400 font-black">A${parseFloat(c.unitPrice).toFixed(2)}</span>
                </div>
              ))}
              {(!cart || cart.length === 0) && <p className="text-[10px] text-slate-500 py-4 font-mono text-center">Sourcing list empty. Add parts from your searches above.</p>}
            </div>
            {cart && cart.length > 0 && (
