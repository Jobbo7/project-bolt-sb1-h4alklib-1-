import React, { useState, Component } from 'react';
import SellerConsole from './components/SellerConsole';
import TableGrid from './components/TableGrid';
import NavBar from './components/NavBar';
import Hero from './components/Hero';
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
            <div className="text-red-500 font-extrabold text-xs">⚠️ SYSTEM OVERRIDE ACTIVE</div>
            <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-slate-900 text-[10px] font-bold rounded-lg border border-slate-800">Reset Workspace</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Interactive Authentication Node Gate View
function AuthGate({ onAuthenticate }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MECHANIC');
  return (
    <div className="min-h-screen bg-[#070A12] flex items-center justify-center p-4 text-slate-100 font-sans">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#101524] p-6 space-y-4 shadow-2xl">
        <h2 className="text-center text-sm font-bold uppercase tracking-wider text-slate-300">PartsForge Network Entry</h2>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="operator@workshop.com.au" className="w-full rounded-lg border border-slate-800 bg-[#0C111C] px-3 py-2 text-xs outline-none text-slate-100 font-mono" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-slate-800 bg-[#0C111C] px-3 py-2 text-xs outline-none text-slate-200">
          <option value="MECHANIC">Registered Mechanic Workshop (Buyer)</option>
          <option value="SELLER">Verified Parts Seller Network (Wholesaler)</option>
        </select>
        <button onClick={() => onAuthenticate(email || 'demo@partsforge.com.au', role)} className="w-full rounded-lg bg-orange-500 text-slate-950 font-extrabold py-2.5 text-xs uppercase tracking-wider shadow-md">Authenticate Secure Entry</button>
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

  const handleSearch = async (query) => {
    if (!query) return;
    setPartsLoading(true);
    try {
      const liveData = await processPartsQuery(query);
      setResults({ local: liveData.localWholesalers || [], facebook: liveData.facebookMarketplace || [] });
    } catch (err) { console.error(err); } finally { setPartsLoading(false); }
  };

  const handleRegoLookup = async (plate) => {
    if (!plate) return;
    try {
      const response = await fetch('/api/vehicle-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate: plate.trim() })
      });
      setVehicle(await response.json());
    } catch (err) { console.error(err); }
  };

  if (!userSession) return <AuthGate onAuthenticate={(email, role) => setUserSession({ email, role })} />;

  // 🏢 SELLER TIERS: ROUTE DIRECTLY TO YOUR TRUE EXTRACTED REPOSITORY CONSOLE
  if (userSession.role === 'SELLER') {
    return (
      <AppErrorBoundary>
        <SellerConsole session={userSession} onSignOut={() => setUserSession(null)} />
      </AppErrorBoundary>
    );
  }

  // ⚙️ MECHANIC TIERS: RESTORES YOUR PREMIUM TABLEGRID COMPONENT DESIGN SCHEME
  return (
    <AppErrorBoundary>
      <div className="min-h-screen bg-[#070A12] text-slate-100 font-sans flex flex-col">
        <NavBar session={userSession} onSignOut={() => setUserSession(null)} />
        <Hero onSearch={handleSearch} onRegoLookup={handleRegoLookup} vehicle={vehicle} loading={partsLoading} />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4">
          <TableGrid 
            results={results} 
            partsLoading={partsLoading} 
            cart={cart} 
            onAddToCart={(item) => setCart(p => [...p, item])} 
            onCheckout={() => executeStripeSplitPayouts(cart, cart.reduce((s,c) => s + (parseFloat(c.trade || c.price || 0)), 0))}
          />
        </main>
      </div>
    </AppErrorBoundary>
  );
}
