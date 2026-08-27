import { designDecisions } from '@/data/schema';
import { Layers, GitBranch, Map, Truck, Database, Gauge } from 'lucide-react';

const icons = [Layers, GitBranch, Database, Map, Truck, Gauge];

export function DesignDecisions() {
  return (
    <section id="decisions" className="border-y border-[#1F293D] bg-[#0A0D14]/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold tracking-tight text-[#E2E8F0]">Design decisions</h2>
        <p className="mt-2 max-w-2xl text-[#64748B]">
          The choices that keep this schema efficient, standards-aligned, and ready for real traffic.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {designDecisions.map((d, i) => {
            const Icon = icons[i % icons.length];
            return (
              <div
                key={d.title}
                className="rounded-2xl border border-[#1F293D] bg-[#121824]/90 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition hover:border-slate-600 hover:bg-[#121824]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF5A1F]/15 text-[#FF5A1F] ring-1 ring-[#FF5A1F]/30">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-[#E2E8F0]">{d.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{d.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
