// 🟢 PERFECT INLINE STRUCTURE BYPASSES THE MISSING FILE
const tables = { offers: [], localWholesalers: [], facebookMarketplace: [] };

import { KeyRound, Link2, Hash } from 'lucide-react';

const sideColors: Record<string, string> = {
  'All sides': 'text-sky-400 border-sky-500/30 bg-sky-500/5',
  'DIYers & Mechanics': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  Catalog: 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/5',
  Sellers: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  Trust: 'text-rose-400 border-rose-500/30 bg-rose-500/5',
};

export function TableGrid() {
  return (
    <section id="schema" className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-50">The schema, table by table</h2>
          <p className="mt-2 max-w-2xl text-slate-400">
            Six models cover identity, the virtual garage, the parts catalog, ACES fitment, geospatial
            inventory, and marketplace trust.
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {tables.map((t) => (
          <article
            key={t.name}
            className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-slate-700 hover:bg-slate-900/60"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-lg font-semibold text-slate-100">{t.label}</h3>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${sideColors[t.side] ?? 'text-slate-400 border-slate-700 bg-slate-800/40'}`}
              >
                {t.side}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{t.purpose}</p>

            <div className="mt-5 overflow-hidden rounded-lg border border-slate-800">
              <table className="w-full text-left text-sm">
                <tbody>
                  {t.columns.map((c) => (
                    <tr key={c.name} className="border-b border-slate-800/60 last:border-0">
                      <td className="px-3 py-2 font-mono text-slate-200">{c.name}</td>
                      <td className="px-3 py-2 font-mono text-sky-400/90">{c.type}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{c.note ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                <Hash className="h-3.5 w-3.5" /> Indexes
              </div>
              <div className="flex flex-wrap gap-2">
                {t.indexes.map((idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-800/60 px-2.5 py-1 font-mono text-xs text-slate-300"
                  >
                    {idx}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5 text-amber-400" /> @id primary key
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5 text-sky-400" /> foreign key relation
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5 text-emerald-400" /> indexed column
        </span>
      </div>
    </section>
  );
}
