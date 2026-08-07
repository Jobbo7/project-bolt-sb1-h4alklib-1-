import { useRef, useEffect, useState } from 'react';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Edge {
  from: string;
  to: string;
  label: string;
}

const nodes: Node[] = [
  { id: 'users', label: 'Users', x: 40, y: 200, w: 150, h: 70 },
  { id: 'vehicles', label: 'Vehicles', x: 270, y: 60, w: 150, h: 70 },
  { id: 'parts', label: 'Parts', x: 270, y: 340, w: 150, h: 70 },
  { id: 'fitment', label: 'PartFitment', x: 500, y: 200, w: 160, h: 70 },
  { id: 'inventory', label: 'Inventory', x: 500, y: 380, w: 150, h: 70 },
  { id: 'reviews', label: 'Reviews', x: 40, y: 420, w: 150, h: 70 },
];

const edges: Edge[] = [
  { from: 'users', to: 'vehicles', label: '1 : N' },
  { from: 'users', to: 'inventory', label: '1 : N' },
  { from: 'users', to: 'reviews', label: '1 : N' },
  { from: 'parts', to: 'fitment', label: '1 : N' },
  { from: 'parts', to: 'inventory', label: '1 : N' },
];

function center(n: Node) {
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

function anchor(from: Node, to: Node) {
  const a = center(from);
  const b = center(to);
  // pick the side of `from` closest to `to`
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return { x: dx > 0 ? from.x + from.w : from.x, y: a.y };
  }
  return { x: a.x, y: dy > 0 ? from.y + from.h : from.y };
}

const palette: Record<string, string> = {
  users: 'border-sky-500/40 bg-sky-500/5 text-sky-300',
  vehicles: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300',
  parts: 'border-fuchsia-500/40 bg-fuchsia-500/5 text-fuchsia-300',
  fitment: 'border-fuchsia-500/40 bg-fuchsia-500/5 text-fuchsia-300',
  inventory: 'border-amber-500/40 bg-amber-500/5 text-amber-300',
  reviews: 'border-rose-500/40 bg-rose-500/5 text-rose-300',
};

export function ERDiagram() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      setScale(Math.min(1, w / 720));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section id="diagram" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-3xl font-bold tracking-tight text-slate-50">Entity relationships</h2>
      <p className="mt-2 max-w-2xl text-slate-400">
        One user owns many vehicles; one part fits many vehicles and is stocked by many sellers;
        reviews connect any two users.
      </p>

      <div ref={wrapRef} className="mt-10 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40 p-6">
        <div style={{ width: 700 * scale, height: 520 * scale }}>
          <svg
            viewBox="0 0 700 520"
            className="h-full w-full"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
          >
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#475569" />
              </marker>
            </defs>

            {edges.map((e, i) => {
              const from = nodes.find((n) => n.id === e.from)!;
              const to = nodes.find((n) => n.id === e.to)!;
              const a = anchor(from, to);
              const b = anchor(to, from);
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              return (
                <g key={i}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="#334155"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    markerEnd="url(#arrow)"
                  />
                  <text x={mx} y={my - 4} textAnchor="middle" className="fill-slate-500 text-[10px]">
                    {e.label}
                  </text>
                </g>
              );
            })}

            {nodes.map((n) => {
              const c = center(n);
              return (
                <g key={n.id}>
                  <rect
                    x={n.x}
                    y={n.y}
                    width={n.w}
                    height={n.h}
                    rx={10}
                    className="fill-slate-900 stroke-slate-700"
                    strokeWidth={1.5}
                  />
                  <text
                    x={c.x}
                    y={c.y - 2}
                    textAnchor="middle"
                    className="fill-slate-100 text-[13px] font-semibold"
                  >
                    {n.label}
                  </text>
                  <text
                    x={c.x}
                    y={c.y + 14}
                    textAnchor="middle"
                    className="fill-slate-500 text-[10px] font-mono"
                  >
                    {n.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {nodes.map((n) => (
            <span
              key={n.id}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${palette[n.id]}`}
            >
              {n.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
