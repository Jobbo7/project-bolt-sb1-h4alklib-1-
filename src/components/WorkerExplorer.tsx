import { useState } from 'react';
import { CodeBlock } from '@/components/CodeBlock';
import { Bot, MousePointerClick, Crosshair, Globe, Database, Terminal } from 'lucide-react';

import workerSrc from '../../server/src/workers/marketplaceWorker.ts?raw';
import selectorsSrc from '../../server/src/workers/selectors.ts?raw';
import proxySrc from '../../server/src/workers/proxy.ts?raw';
import cacheSrc from '../../server/src/workers/cache.ts?raw';
import typesSrc from '../../server/src/workers/types.ts?raw';

interface FileTab {
  label: string;
  filename: string;
  code: string;
  icon: typeof Bot;
  blurb: string;
}

const tabs: FileTab[] = [
  {
    label: 'Worker',
    filename: 'workers/marketplaceWorker.ts',
    code: workerSrc,
    icon: Bot,
    blurb: 'The entry point. Checks the Redis cache, launches a headless browser through the proxy, accepts cookies, scrapes listings, and writes results back to cache.',
  },
  {
    label: 'Selectors',
    filename: 'workers/selectors.ts',
    code: selectorsSrc,
    icon: Crosshair,
    blurb: 'Every Facebook DOM selector lives here. When Facebook changes its markup, this is the only file that needs updating — the API router never touches it.',
  },
  {
    label: 'Proxy',
    filename: 'workers/proxy.ts',
    code: proxySrc,
    icon: Globe,
    blurb: 'Standard proxy middleware. All browser traffic routes through this function. The placeholder block is where residential proxy credentials go.',
  },
  {
    label: 'Cache',
    filename: 'workers/cache.ts',
    code: cacheSrc,
    icon: Database,
    blurb: 'Redis-backed 30-minute cache. Duplicate queries return instantly without hitting Facebook a second time.',
  },
  {
    label: 'Types',
    filename: 'workers/types.ts',
    code: typesSrc,
    icon: Terminal,
    blurb: 'Shared shapes for listings, search params, and proxy config.',
  },
];

const flow = [
  { icon: Database, label: 'Redis cache check', detail: 'Hit? Return instantly.' },
  { icon: Globe, label: 'Proxy + headless launch', detail: 'Chromium via residential proxy.' },
  { icon: MousePointerClick, label: 'Cookie consent', detail: 'Accept dialog if present.' },
  { icon: Crosshair, label: 'Strict selectors', detail: 'Title, price, location, image, link.' },
  { icon: Database, label: 'Cache write (30 min TTL)', detail: 'Next query is instant.' },
];

export function WorkerExplorer() {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <section id="worker" className="border-t border-slate-800/60 bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800/70 text-amber-400">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-50">
              Facebook Marketplace fallback worker
            </h2>
            <p className="mt-1 max-w-2xl text-slate-400">
              A modular Playwright worker that acts as a fallback metasearch engine. It's fully
              isolated from the main API router so selectors can be updated independently.
            </p>
          </div>
        </div>

        {/* Flow diagram */}
        <div className="mt-10 grid gap-3 sm:grid-cols-5">
          {flow.map((step, i) => (
            <div key={step.label} className="relative">
              <div className="h-full rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center gap-2">
                  <step.icon className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Step {i + 1}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-200">{step.label}</p>
                <p className="mt-1 text-xs text-slate-500">{step.detail}</p>
              </div>
              {i < flow.length - 1 && (
                <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-slate-700 sm:block">
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        {/* CLI usage */}
        <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3">
          <code className="font-mono text-sm text-slate-300">
            <span className="text-emerald-400">tsx</span> server/src/workers/marketplaceWorker.ts{' '}
            <span className="text-sky-300">"brake pads"</span>{' '}
            <span className="text-sky-300">"new-york"</span>
          </code>
        </div>

        {/* Tabs */}
        <div className="mt-10 flex flex-wrap gap-2">
          {tabs.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setActive(i)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                active === i
                  ? 'bg-slate-100 text-slate-900'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        <p className="mt-5 text-sm leading-relaxed text-slate-400">{tab.blurb}</p>

        <div className="mt-4">
          <CodeBlock code={tab.code} filename={tab.filename} language="typescript" />
        </div>
      </div>
    </section>
  );
}
