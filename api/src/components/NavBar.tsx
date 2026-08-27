import { useEffect, useState } from 'react';
import { Cpu, LayoutDashboard, Code2, ShoppingCart } from 'lucide-react';

const links = [
  { href: '#schema', label: 'Tables' },
  { href: '#diagram', label: 'ER Diagram' },
  { href: '#decisions', label: 'Decisions' },
  { href: '#api', label: 'API' },
  { href: '#worker', label: 'Worker' },
  { href: '#code', label: 'Schema' },
];

type View = 'architecture' | 'dashboard';

interface NavBarProps {
  view: View;
  onViewChange: (v: View) => void;
  cartCount?: number;
  onCartClick?: () => void;
}

export function NavBar({ view, onViewChange, cartCount = 0, onCartClick }: NavBarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${
        scrolled || view === 'dashboard'
          ? 'border-b border-[#1F293D] bg-[#0A0D14]/90 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <button onClick={() => onViewChange('architecture')} className="flex items-center gap-2 text-slate-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5A1F] text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)]">
            <Cpu className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight text-[#E2E8F0]">PartsForge</span>
          <span className="ml-2 hidden text-xs text-[#64748B] sm:inline">
            {view === 'architecture' ? 'Backend Architecture' : 'DIY Dashboard'}
          </span>
        </button>

        <div className="flex items-center gap-3">
          {view === 'architecture' && (
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="rounded-md px-3 py-1.5 text-sm text-[#64748B] transition hover:bg-[#121824]/90 hover:text-[#E2E8F0]"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}

          {/* Single global cart icon — anchored permanently in the top-right header tray */}
          {onCartClick && (
            <button
              onClick={onCartClick}
              className="relative flex items-center gap-1.5 rounded-lg border border-[#1F293D] bg-[#121824] px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-[#FF5A1F]/40 hover:text-[#E2E8F0]"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF5A1F] px-1 text-[10px] font-bold text-slate-950">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-[#1F293D] bg-[#121824]/90 p-1 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <button
              onClick={() => onViewChange('architecture')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                view === 'architecture'
                  ? 'bg-[#FF5A1F] text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)]'
                  : 'text-[#64748B] hover:text-[#E2E8F0]'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Architecture</span>
            </button>
            <button
              onClick={() => onViewChange('dashboard')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                view === 'dashboard'
                  ? 'bg-[#FF5A1F] text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)]'
                  : 'text-[#64748B] hover:text-[#E2E8F0]'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
