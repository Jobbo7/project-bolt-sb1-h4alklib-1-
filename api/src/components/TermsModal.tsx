import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';

interface TermsModalProps {
  open: boolean;
  onAccept: () => void;
}

const CLAUSES = [
  {
    title: '1. Educational Purpose Only',
    body: 'All mechanical data, torque settings, and YouTube tutorials are for general info only. We do not guarantee accuracy or safety metrics of third-party repair tutorials. Users act at their own risk.',
  },
  {
    title: '2. Assumption of Risk',
    body: 'Automotive repair carries inherent hazards including severe injury, property damage, and system failure. You are solely responsible for a safe work environment, proper safety gear, and checking critical safety components (like brakes) before driving.',
  },
  {
    title: '3. Fitment & Parts Limitation',
    body: "The 'Guaranteed Fit' badge is based on vendor catalog feeds. Our liability is strictly limited to standard item return policies. We explicitly disclaim any liability for secondary damages, towing fees, workshop labor, or mechanical damage from incorrect parts or installation.",
  },
  {
    title: '4. Peer-to-Peer Marketplaces',
    body: 'This app is a neutral aggregator for Facebook Marketplace listings. We do not inspect, verify, or warrant items from private sellers. All private transactions and physical meetups are strictly at your own risk.',
  },
];

export function TermsModal({ open, onAccept }: TermsModalProps) {
  const [checked, setChecked] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (open) {
      setChecked(false);
      setLeaving(false);
    }
  }, [open]);

  if (!open) return null;

  const handleAccept = () => {
    if (!checked) return;
    setLeaving(true);
    setTimeout(() => onAccept(), 400);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-400 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`w-full max-w-sm max-h-[85vh] overflow-hidden flex flex-col bg-[#121824] border border-[#1F293D] rounded-2xl shadow-2xl text-white transition-all duration-400 ${
          leaving ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* High-impact checkerboard warning border */}
        <div className="checkerboard-border h-2 w-full flex-none" />

        {/* Warning header — dashboard cluster */}
        <div className="flex items-start gap-3 border-b border-[#1F293D] bg-gradient-to-r from-[#FF5A1F]/15 to-amber-950/30 px-4 py-3">
          <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#FF5A1F]/20 text-[#FF5A1F] ring-1 ring-[#FF5A1F]/40">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#FF5A1F]">
              ⚠️ Critical User Safety &amp; Liability Agreement — ForgedParts Pty Ltd
            </h2>
            <p className="mt-0.5 text-xs text-[#64748B]">
              Please read carefully before entering the garage.
            </p>
          </div>
        </div>

        {/* Scrollable clauses */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-3 px-5 pt-4 text-xs text-[#64748B]">
          {CLAUSES.map((c) => (
            <div key={c.title} className="rounded-xl bg-[#0A0D14]/60 p-3 border border-[#1F293D]">
              <p className="font-semibold text-[#E2E8F0]">{c.title}</p>
              <p className="mt-1 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        {/* Fixed footer: checkbox + button */}
        <div className="px-5 pb-5 pt-3 border-t border-[#1F293D]">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#0A0D14]/60 p-3 ring-1 ring-[#1F293D] transition hover:border-slate-600">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-none cursor-pointer accent-[#FF5A1F]"
            />
            <span className="text-xs leading-relaxed text-[#64748B]">
              I explicitly acknowledge the physical risks of DIY mechanics and agree to the
              Terms of Service.
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!checked}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
              checked
                ? 'bg-[#FF5A1F] text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)] hover:shadow-[0_0_20px_rgba(255,90,31,0.6)] active:scale-[0.98]'
                : 'cursor-not-allowed bg-slate-800/60 text-slate-500 ring-1 ring-[#1F293D]'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Accept &amp; Enter Garage
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
