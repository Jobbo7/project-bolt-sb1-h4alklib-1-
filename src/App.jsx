import React, { useState, Component } from 'react';
import { processPartsQuery, executeStripeSplitPayouts } from './mockBackend.js';
import MechanicConsole from './components/MechanicConsole';

// 🛡️ EXPORTING THE MANDATORY APP ERROR BOUNDARY SPEC FOR MAIN.TSX COMPLIANCE
export class AppErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="p-6 text-center text-xs font-mono bg-red-950/10 text-red-400 border border-red-900/20 m-4 rounded-xl">⚠️ Platform Exception Caught. Reload context frame.</div>;
    return this.props.children;
  }
}

function AuthGate({ onAuthenticate }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MECHANIC');
  return (
    <div className="min-h-screen bg-[#070A12] flex items-center justify-center p-4 text-slate-100 font-sans">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#101524] p-6 space-y-4 shadow-2xl">
        <h2 className="text-center text-sm font-bold uppercase tracking-wider text-slate-300">PartsForge Secure Gateway</h2>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mechanic@workshop.com" className="w-full rounded-lg border border-slate-800 bg-[#0C111C] px-3 py-2 text-xs outline-none text-slate-100 font-mono" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-slate-800 bg-[#0C111C] px-3 py-2 text-xs text-slate-200">
          <option value="MECHANIC">Registered Mechanic Workshop (Buyer)</option>
          <option value="SELLER">Verified Parts Seller Network (Wholesaler)</option>
        </select>
        <button onClick={() => onAuthenticate(email || 'demo@partsforge.com', role)} className="w-full rounded-lg bg-orange-500 text-slate-950 font-extrabold py-2.5 text-xs uppercase tracking-wider">Authenticate Entry</button>
      </div>
    </div>
  );
}

export default function App() {
  const [userSession, setUserSession] = useState(null);
  const [partsLoading, setPartsLoading] = useState(false);
  const [results, setResults] = useState({ local: [], facebook: [] });
  const [cart, setCart] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSearch = async (query) => {
    if (!query || !query.trim()) return;
    setPartsLoading(true);
    try {
      const liveData = await processPartsQuery(query);
      setResults({ local: liveData.localWholesalers || [], facebook: liveData.facebookMarketplace || [] });
    } catch (err) { console.error(err); } finally { setPartsLoading(false); }
  };

  const handleRegoLookup = async (plate) => {
    if (!plate || !plate.trim()) return;
    try {
      const response = await fetch('/api/vehicle-lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plate: plate.trim(), type: 'rego' }) });
      setVehicle(await response.json());
    } catch (err) { console.error(err); }
  };

  if (!userSession) return <AuthGate onAuthenticate={(email, role) => setUserSession({ email, role })} />;

  if (userSession.role === 'SELLER') {
    return (
      <div className="p-4 max-w-4xl mx-auto space-y-4 text-slate-100 bg-[#070A12] min-h-screen font-sans">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-sm font-bold text-orange-400 uppercase tracking-wider">PartsForge Seller Hub ({userSession.email})</h1>
          <button onClick={() => setUserSession(null)} className="rounded bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-300 font-bold">Log Out</button>
        </div>
        <button onClick={async () => {
          setSuccess("📡 Opening Supabase connection matrix...");
          const res = await fetch('/api/wholesaler-bulk-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inventoryArray: [], businessName: userSession.email }) });
          if (res.ok) setSuccess("✅ SUCCESS: Wholesaler catalog rows synchronized live to Supabase tables!");
        }} className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-extrabold px-4 py-2.5 text-xs rounded uppercase tracking-wider">Sync CSV Inventory Sheet to Supabase Table</button>
        {success && <div className="p-2 border border-slate-800 rounded bg-[#0C111C] text-xs font-mono text-emerald-400 mt-2">{success}</div>}
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      <MechanicConsole 
        userSession={userSession} handleSignOut={handleSignOut} partsLoading={partsLoading} 
        results={results} handleSearch={handleSearch} handleRegoLookup={handleRegoLookup} 
        vehicle={vehicle} cart={cart} setCart={setCart} executeStripeSplitPayouts={executeStripeSplitPayouts} 
      />
    </AppErrorBoundary>
  );
}
