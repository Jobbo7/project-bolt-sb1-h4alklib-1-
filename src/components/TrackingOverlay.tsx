import { useEffect, useRef, useState } from 'react';
import {
  Truck,
  Package,
  Home,
  Check,
  ArrowLeft,
  Navigation,
  Clock,
  Store,
  CircleDot,
  X,
} from 'lucide-react';

const STAGES = [
  { icon: Navigation, label: 'Assigning nearest courier driver…' },
  { icon: Store, label: 'Driver arrived at Repco South Morang. Picking up your parts…' },
  { icon: Truck, label: 'Driver is en route to your location…' },
  { icon: Home, label: 'Courier arrived! Your parts have been delivered safely.' },
];

// Waypoints the driver icon travels along (percentage coordinates on the map).
const ROUTE = [
  { x: 18, y: 78 }, // Repco store
  { x: 32, y: 62 },
  { x: 44, y: 70 },
  { x: 58, y: 48 },
  { x: 72, y: 52 },
  { x: 82, y: 30 }, // Home
];

function driverPosition(stage: number): { x: number; y: number } {
  if (stage <= 1) return ROUTE[0];
  if (stage >= 3) return ROUTE[ROUTE.length - 1];
  const t = 0.6;
  const a = ROUTE[1];
  const b = ROUTE[4];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function MapView({ stage }: { stage: number }) {
  const pos = driverPosition(stage);
  const moving = stage === 2;

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#1F293D] bg-[#0A0D14] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      {/* Grid backdrop */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#162032" strokeWidth="1" />
          </pattern>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF5A1F" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#FF5A1F" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect width="100%" height="100%" fill="url(#glow)" />
      </svg>

      {/* Roads */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 0 80 L 100 80" stroke="#1F293D" strokeWidth="3" fill="none" />
        <path d="M 30 0 L 30 100" stroke="#1F293D" strokeWidth="3" fill="none" />
        <path d="M 0 50 L 100 50" stroke="#1F293D" strokeWidth="3" fill="none" />
        <path d="M 70 0 L 70 100" stroke="#1F293D" strokeWidth="3" fill="none" />
      </svg>

      {/* Neon glowing route */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <filter id="neon" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Soft glow underlay */}
        <polyline
          points={ROUTE.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#FF5A1F"
          strokeWidth="3"
          strokeOpacity="0.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#neon)"
        />
        {/* Crisp animated neon line */}
        <polyline
          points={ROUTE.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#FF5A1F"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#neon)"
          className="animate-[neonflow_1s_linear_infinite]"
        />
      </svg>

      {/* Repco store marker */}
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={{ left: `${ROUTE[0].x}%`, top: `${ROUTE[0].y}%` }}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00E5FF]/20 text-[#00E5FF] ring-1 ring-[#00E5FF]/40">
          <Store className="h-4 w-4" />
        </span>
        <span className="mt-1 whitespace-nowrap rounded bg-[#0A0D14]/80 px-1.5 py-0.5 text-[9px] font-medium text-[#00E5FF]">
          Repco
        </span>
      </div>

      {/* Home marker */}
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={{ left: `${ROUTE[ROUTE.length - 1].x}%`, top: `${ROUTE[ROUTE.length - 1].y}%` }}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5A1F]/20 text-[#FF5A1F] ring-1 ring-[#FF5A1F]/40">
          <Home className="h-4 w-4" />
        </span>
        <span className="mt-1 whitespace-nowrap rounded bg-[#0A0D14]/80 px-1.5 py-0.5 text-[9px] font-medium text-[#FF5A1F]">
          Home
        </span>
      </div>

      {/* Driver icon */}
      <div
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear"
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#FF5A1F] text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)]">
          <Truck className="h-4 w-4" />
          {moving && (
            <span className="absolute inset-0 animate-ping rounded-full bg-[#FF5A1F]/60" />
          )}
        </span>
      </div>
    </div>
  );
}

function Timeline({ stage }: { stage: number }) {
  return (
    <div className="space-y-1">
      {STAGES.map((s, i) => {
        const done = i < stage;
        const active = i === stage;
        const Icon = s.icon;
        return (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs transition ${
                  done
                    ? 'bg-[#FF5A1F] text-slate-950'
                    : active
                    ? 'bg-[#FF5A1F]/20 text-[#FF5A1F] ring-2 ring-[#FF5A1F]/50'
                    : 'bg-[#1F293D] text-slate-600'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              {i < STAGES.length - 1 && (
                <span className={`my-0.5 h-6 w-0.5 rounded ${done ? 'bg-[#FF5A1F]' : 'bg-[#1F293D]'}`} />
              )}
            </div>
            <p
              className={`pt-1 text-sm leading-snug transition ${
                active
                  ? 'font-bold text-[#E2E8F0]'
                  : done
                  ? 'text-[#64748B]'
                  : 'text-slate-600'
              }`}
            >
              {s.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

interface TrackingOverlayProps {
  partName: string;
  onReset: () => void;
}

const NOTIFICATIONS = [
  '📱 PARTSFORGE: Courier assigned! John is heading to the store counter...',
  '📱 PARTSFORGE: John has collected your parts from the counter.',
  '📱 PARTSFORGE: Your driver is en route with your parts. Tap to open your live delivery map.',
  '📱 PARTSFORGE: Delivery complete! Your parts are at your doorstep.',
];

function NotificationBanner({
  message,
  visible,
  onDismiss,
}: {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-3 transition-all duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'
      }`}
    >
      <div
        className={`pointer-events-auto mt-3 w-full max-w-sm overflow-hidden rounded-2xl border border-[#1F293D] bg-[#121824]/95 text-slate-200 shadow-2xl shadow-black/50 backdrop-blur-xl ${
          visible ? 'animate-[notiflash_0.6s_ease-out]' : ''
        }`}
      >
        <div className="flex items-start gap-3 p-3">
          {/* App icon branding */}
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#FF5A1F] text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)]">
            <Truck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#E2E8F0]">PARTSFORGE</span>
                <span className="text-[10px] text-[#64748B]">now</span>
              </div>
              <button
                onClick={onDismiss}
                className="rounded p-0.5 text-slate-400 transition-all duration-200 hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-0.5 text-sm leading-snug text-[#64748B]">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrackingOverlay({ partName, onReset }: TrackingOverlayProps) {
  const [stage, setStage] = useState(0);
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifMessage, setNotifMessage] = useState(NOTIFICATIONS[0]);
  const [chimeFlash, setChimeFlash] = useState(false);
  const prevStage = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStage((s) => (s < 3 ? s + 1 : s));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Fire a push-style notification whenever the stage advances.
  useEffect(() => {
    if (stage === prevStage.current) return;
    prevStage.current = stage;

    setNotifMessage(NOTIFICATIONS[stage]);
    setNotifVisible(true);

    // Tactile feedback — vibrate on supported devices, visual chime flash otherwise.
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(stage === 3 ? [60, 40, 60] : 80);
      } catch {
        setChimeFlash(true);
        setTimeout(() => setChimeFlash(false), 600);
      }
    } else {
      setChimeFlash(true);
      setTimeout(() => setChimeFlash(false), 600);
    }

    const t = setTimeout(() => setNotifVisible(false), 3500);
    return () => clearTimeout(t);
  }, [stage]);

  const current = STAGES[stage];

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-200 antialiased">
      {/* Visual chime flash overlay */}
      <div
        className={`pointer-events-none fixed inset-0 z-40 bg-[#FF5A1F]/10 transition-opacity duration-500 ${
          chimeFlash ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Floating push notification banner */}
      <NotificationBanner
        message={notifMessage}
        visible={notifVisible}
        onDismiss={() => setNotifVisible(false)}
      />

      <div className="mx-auto max-w-md px-4 pb-10 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#64748B]">
            <Package className="h-3.5 w-3.5 text-[#FF5A1F]" />
            Live Tracking
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5A1F]/10 px-2.5 py-1 text-xs font-medium text-[#FF5A1F] ring-1 ring-[#FF5A1F]/30">
            <CircleDot className="h-3 w-3 animate-pulse" />
            {stage < 3 ? 'In Transit' : 'Delivered'}
          </span>
        </div>

        {/* Map */}
        <div className="mt-4">
          <MapView stage={stage} />
        </div>

        {/* Current status banner */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#FF5A1F]/20 bg-[#FF5A1F]/5 p-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[#FF5A1F]/15 text-[#FF5A1F]">
            <current.icon className="h-4 w-4" />
          </span>
          <p className="text-sm font-bold text-[#E2E8F0]">{current.label}</p>
        </div>

        {/* Timeline */}
        <div className="mt-5 rounded-2xl border border-[#1F293D] bg-[#121824]/90 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            Delivery Timeline
          </h3>
          <Timeline stage={stage} />
        </div>

        {/* Order summary */}
        <div className="mt-4 rounded-2xl border border-[#1F293D] bg-[#121824]/90 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Order Summary
          </h3>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-[#00E5FF]/15 text-[#00E5FF] ring-1 ring-[#00E5FF]/30">
              <Package className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#E2E8F0]">{partName}</p>
              <p className="text-xs text-[#64748B]">Fast Local Delivery · Repco South Morang</p>
            </div>
          </div>
        </div>

        {/* Back to Garage */}
        <button
          onClick={onReset}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#1F293D] bg-[#121824]/90 py-3 text-sm font-bold text-[#E2E8F0] shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-200 hover:border-slate-500 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Garage
        </button>
      </div>
    </div>
  );
}
