import { useEffect, useState } from 'react';
import {
  X,
  Play,
  Check,
  GraduationCap,
  Wrench,
  Store,
  Users,
  Lightbulb,
  CheckCircle2,
  Upload,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';

interface TutorialModule {
  id: string;
  audience: string;
  title: string;
  summary: string;
  icon: typeof Wrench;
  accent: string;
  ring: string;
  badge: string;
  thumb: string;
}

const MODULES: TutorialModule[] = [
  {
    id: 'diy',
    audience: 'For DIYers',
    title: 'How to scan your VIN and match parts without making mistakes.',
    summary:
      'Learn to decode your VIN in seconds and let PartsForge filter every listing to your exact vehicle. No more guessing trim levels, engine codes, or brake pad variants at the counter.',
    icon: Wrench,
    accent: 'text-[#FF5A1F]',
    ring: 'ring-[#FF5A1F]/40',
    badge: 'bg-[#FF5A1F]/10 text-[#FF5A1F] ring-[#FF5A1F]/30',
    thumb: 'https://images.pexels.com/photos/4116224/pexels-photo-4116224.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'sellers',
    audience: 'For Parts Sellers',
    title: "Step-by-step guide to uploading your store's inventory using bulk CSV spreadsheets or live API sync.",
    summary:
      'Push your entire catalogue live in minutes with a drag-and-drop CSV import or a persistent API connection. We cover field mapping, stock thresholds, and multi-store sync.',
    icon: Store,
    accent: 'text-[#00E5FF]',
    ring: 'ring-[#00E5FF]/40',
    badge: 'bg-[#00E5FF]/10 text-[#00E5FF] ring-[#00E5FF]/30',
    thumb: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 'mechanics',
    audience: 'For Mechanics',
    title: 'How to toggle trade pricing and manage up to 50 customer cars in your virtual garage.',
    summary:
      'Switch on trade pricing to see wholesale rates across every supplier, and juggle dozens of customer builds in one garage. Assign jobs, log torque specs, and bill parts per vehicle.',
    icon: Users,
    accent: 'text-amber-400',
    ring: 'ring-amber-500/40',
    badge: 'bg-amber-500/10 text-amber-400 ring-amber-500/30',
    thumb: 'https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

function ModuleCard({
  module,
  completed,
  onToggle,
  action,
}: {
  module: TutorialModule;
  completed: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
}) {
  const Icon = module.icon;
  return (
    <div className="overflow-hidden rounded-2xl border border-[#1F293D] bg-[#121824]/90 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-200 hover:border-slate-500">
      {/* Thumbnail with play overlay */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
        <img
          src={module.thumb}
          alt={module.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14]/90 via-[#0A0D14]/30 to-transparent" />
        <button className="absolute inset-0 flex items-center justify-center transition-all duration-200 active:scale-95">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF5A1F] text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)] ring-4 ring-[#FF5A1F]/20 transition-all duration-200 hover:scale-105">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </button>
        {/* Audience badge */}
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${module.badge}`}
        >
          <Icon className="h-3 w-3" />
          {module.audience}
        </span>
        {completed && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#FF5A1F]/90 px-2 py-0.5 text-[10px] font-bold text-slate-950">
            <Check className="h-3 w-3" />
            Done
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-sm font-bold leading-snug text-[#E2E8F0]">{module.title}</p>
        <p className="mt-2 text-xs leading-relaxed text-[#64748B]">{module.summary}</p>

        {action}

        {/* Mark as completed */}
        <button
          onClick={onToggle}
          className={`mt-4 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
            completed
              ? 'border-[#FF5A1F]/40 bg-[#FF5A1F]/10 text-[#FF5A1F]'
              : 'border-[#1F293D] bg-[#0A0D14]/60 text-[#64748B] hover:border-slate-500'
          }`}
        >
          <span className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                completed
                  ? 'border-[#FF5A1F] bg-[#FF5A1F] text-slate-950'
                  : 'border-slate-600 text-transparent'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
            </span>
            Mark as Completed
          </span>
          {completed && <CheckCircle2 className="h-4 w-4 text-[#FF5A1F]" />}
        </button>
      </div>
    </div>
  );
}

interface TutorialHubProps {
  open: boolean;
  onClose: () => void;
}

const SAMPLE_CSV_FIELDS = [
  'sku_vendor',
  'part_number_global',
  'price_trade',
  'fitment_years',
  'product_image_url',
];

function SellerCsvAction({ onToast }: { onToast: (message: string) => void }) {
  const [parsing, setParsing] = useState(false);

  const handleParse = () => {
    setParsing(true);
    // Simulate the network/parse latency of a 1,420-row automotive CSV.
    setTimeout(() => {
      setParsing(false);
      onToast('CSV Parsed Successfully: 1,420 parts imported and matched to ACES fitment data!');
    }, 1800);
  };

  return (
    <div className="mt-4 rounded-xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#00E5FF]">
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Sample Inventory CSV
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SAMPLE_CSV_FIELDS.map((field) => (
          <span
            key={field}
            className="rounded-md bg-[#0A0D14]/60 px-2 py-1 font-mono text-[10px] text-[#00E5FF] ring-1 ring-[#1F293D]"
          >
            {field}
          </span>
        ))}
      </div>
      <button
        onClick={handleParse}
        disabled={parsing}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00E5FF] py-2.5 text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {parsing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Parsing & matching fitment…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Simulate CSV Upload
          </>
        )}
      </button>
    </div>
  );
}

export function TutorialHub({ open, onClose }: TutorialHubProps) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  // Load progress from localStorage so completion persists across opens.
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem('appfinder_academy_progress');
      if (raw) setCompleted(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    try {
      localStorage.setItem('appfinder_academy_progress', JSON.stringify(completed));
    } catch {
      /* ignore */
    }
  }, [completed, open]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Auto-dismiss the toast after 4 seconds.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!open) return null;

  const doneCount = Object.values(completed).filter(Boolean).length;

  const toggle = (id: string) =>
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));

  const showToast = (message: string) => setToast(message);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#0A0D14] text-slate-200 antialiased">
      <div className="mx-auto min-h-full max-w-md px-4 pb-10">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1F293D] bg-[#0A0D14]/90 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF5A1F]/20 to-[#00E5FF]/20 text-[#FF5A1F] ring-1 ring-[#1F293D]">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#E2E8F0]">PartsForge Academy</p>
              <p className="text-[11px] text-[#64748B]">
                {doneCount}/{MODULES.length} modules completed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl border border-[#1F293D] bg-[#121824]/90 px-3 py-2 text-xs font-bold text-[#E2E8F0] shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-200 hover:border-slate-500 active:scale-[0.98]"
          >
            <X className="h-4 w-4" />
            Return to Garage
          </button>
        </div>

        {/* Intro */}
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#1F293D] bg-[#121824]/90 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
            <Lightbulb className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-[#E2E8F0]">Learn PartsForge in 3 short modules</p>
            <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
              Whether you're turning wrenches in your driveway, selling parts across the country, or
              running a busy workshop — there's a fast walkthrough here for you.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#121824]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF5A1F] to-[#00E5FF] transition-all duration-500"
            style={{ width: `${(doneCount / MODULES.length) * 100}%` }}
          />
        </div>

        {/* Modules */}
        <div className="mt-4 space-y-4">
          {MODULES.map((m) => (
            <ModuleCard
              key={m.id}
              module={m}
              completed={!!completed[m.id]}
              onToggle={() => toggle(m.id)}
              action={
                m.id === 'sellers' ? (
                  <SellerCsvAction onToast={showToast} />
                ) : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Success toast */}
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 transition-all duration-300 ${
          toast ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-[#FF5A1F]/30 bg-[#0A0D14]/90 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#FF5A1F] text-slate-950">
            <Check className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold text-[#FF5A1F]">
            {toast}
          </p>
        </div>
      </div>
    </div>
  );
}
