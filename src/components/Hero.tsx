import { Wrench, Car, Store, Database, MapPin, ShieldCheck } from 'lucide-react';

const sides = [
  {
    icon: Wrench,
    label: 'DIYers',
    desc: 'Browse a virtual garage, find parts that fit, and buy from nearby sellers.',
    accent: 'text-[#FF5A1F]',
    ring: 'ring-[#FF5A1F]/30',
  },
  {
    icon: Car,
    label: 'Mechanics',
    desc: 'Look up fitment by vehicle, source stock across sellers, and review suppliers.',
    accent: 'text-[#00E5FF]',
    ring: 'ring-[#00E5FF]/30',
  },
  {
    icon: Store,
    label: 'Sellers',
    desc: 'List inventory with price, stock, delivery options, and geospatial location.',
    accent: 'text-[#FF5A1F]',
    ring: 'ring-[#FF5A1F]/30',
  },
];

const pillars = [
  { icon: Database, label: 'ACES / PIES fitment' },
  { icon: MapPin, label: 'PostGIS proximity' },
  { icon: ShieldCheck, label: 'Row-level ownership' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#FF5A1F]/20 blur-[120px]" />
        <div className="absolute right-[-8rem] top-32 h-96 w-96 rounded-full bg-[#00E5FF]/10 blur-[120px]" />
        <div className="absolute left-[-6rem] top-48 h-80 w-80 rounded-full bg-[#FF5A1F]/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#FF5A1F]">
          <span className="h-px w-8 bg-[#FF5A1F]/60" />
          Backend Architecture
        </div>
        <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-[#E2E8F0] sm:text-5xl">
          A three-sided auto parts marketplace,
          <span className="bg-gradient-to-r from-[#FF5A1F] via-[#FF5A1F] to-[#00E5FF] bg-clip-text text-transparent">
            {' '}built on PostgreSQL + Prisma
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#64748B]">
          The foundational data layer for DIYers, mechanics, and sellers. Vehicle fitment follows the
          ACES standard, product attributes follow PIES, and seller inventory is geospatially indexed
          for fast proximity search.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {sides.map((s) => (
            <div
              key={s.label}
              className={`group rounded-2xl border border-[#1F293D] bg-[#121824]/90 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] ring-1 ${s.ring} transition hover:-translate-y-1 hover:bg-[#121824]`}
            >
              <s.icon className={`h-7 w-7 ${s.accent}`} />
              <h3 className="mt-4 text-lg font-semibold text-[#E2E8F0]">{s.label}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#64748B]">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {pillars.map((p) => (
            <span
              key={p.label}
              className="inline-flex items-center gap-2 rounded-full border border-[#1F293D] bg-[#121824]/90 px-4 py-2 text-sm text-[#E2E8F0] shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
            >
              <p.icon className="h-4 w-4 text-[#FF5A1F]" />
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
