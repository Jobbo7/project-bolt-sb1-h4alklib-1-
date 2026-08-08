import { useState } from 'react';
import { CodeBlock } from '@/components/CodeBlock';
import { Server, Route, Search, MapPin, Youtube, ArrowRight } from 'lucide-react';

import controllerSrc from '../../server/src/controllers/searchController.ts?raw';
import inventorySrc from '../../server/src/services/inventoryService.ts?raw';
import youtubeSrc from '../../server/src/services/youtubeService.ts?raw';
import routesSrc from '../../server/src/routes/searchRoutes.ts?raw';
import appSrc from '../../server/src/app.ts?raw';
import distanceSrc from '../../server/src/utils/distance.ts?raw';

interface FileTab {
  label: string;
  filename: string;
  code: string;
  icon: typeof Server;
  blurb: string;
}

const tabs: FileTab[] = [
  {
    label: 'Controller',
    filename: 'controllers/searchController.ts',
    code: controllerSrc,
    icon: Search,
    blurb: 'searchParts(vehicleId, partQuery) — validates input, resolves the vehicle, then runs the inventory query and YouTube request concurrently with Promise.all.',
  },
  {
    label: 'Inventory',
    filename: 'services/inventoryService.ts',
    code: inventorySrc,
    icon: MapPin,
    blurb: 'Queries the ACES fitment table joined to seller Inventory, computes haversine distance, and splits results into Local Courier (≤25km) and National Shipping (>25km).',
  },
  {
    label: 'YouTube',
    filename: 'services/youtubeService.ts',
    code: youtubeSrc,
    icon: Youtube,
    blurb: 'Builds the strict query — [Year] [Make] [Model] [partQuery] repair replacement — and queries the YouTube Data API v3 for up to 5 tutorial videos.',
  },
  {
    label: 'Routes',
    filename: 'routes/searchRoutes.ts',
    code: routesSrc,
    icon: Route,
    blurb: 'Express router mounting the search controller at GET /api/search/parts.',
  },
  {
    label: 'App',
    filename: 'app.ts',
    code: appSrc,
    icon: Server,
    blurb: 'Express app wiring with JSON middleware, a health check, and the search router.',
  },
  {
    label: 'Distance',
    filename: 'utils/distance.ts',
    code: distanceSrc,
    icon: MapPin,
    blurb: 'Haversine formula returning kilometers between two lat/long points.',
  },
];

const sampleResponse = `{
  "localParts": [
    {
      "id": "a1b2c3",
      "part_id": "p-201",
      "title": "Front Brake Pad Set",
      "brand": "Bosch",
      "part_number": "BC-1450",
      "price": 64.99,
      "stock_quantity": 12,
      "delivery_type": "local_courier",
      "seller_id": "s-09",
      "latitude": 40.7128,
      "longitude": -74.006,
      "distance_km": 3.4
    }
  ],
  "nationalParts": [
    {
      "id": "d4e5f6",
      "part_id": "p-201",
      "title": "Front Brake Pad Set",
      "brand": "Bosch",
      "part_number": "BC-1450",
      "price": 58.99,
      "stock_quantity": 40,
      "delivery_type": "national_shipping",
      "seller_id": "s-22",
      "latitude": 34.0522,
      "longitude": -118.2437,
      "distance_km": 3941.2
    }
  ],
  "youtubeTutorials": [
    {
      "video_id": "dQw4w9WgXcQ",
      "title": "2018 Honda Civic Front Brake Pad Repair Replacement",
      "channel": "AutoFix DIY",
      "thumbnail": "https://i.ytimg.com/vi/.../mqdefault.jpg"
    }
  ]
}`;

export function ApiExplorer() {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <section id="api" className="border-t border-[#1F293D] bg-[#0A0D14]/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF5A1F]/15 text-[#FF5A1F] ring-1 ring-[#FF5A1F]/30">
            <Server className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#E2E8F0]">Parts search API</h2>
            <p className="mt-1 max-w-2xl text-[#64748B]">
              A modular Node.js + Express routing system. The controller runs the inventory query and
              the YouTube background request concurrently, then returns one merged payload.
            </p>
          </div>
        </div>

        {/* Request flow */}
        <div className="mt-10 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-lg border border-[#1F293D] bg-[#121824]/90 px-3 py-2 font-mono text-[#E2E8F0] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            GET /api/search/parts
          </span>
          <span className="text-slate-600">?</span>
          <span className="rounded-lg border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-3 py-2 font-mono text-[#00E5FF]">
            vehicleId=
          </span>
          <span className="rounded-lg border border-[#FF5A1F]/30 bg-[#FF5A1F]/10 px-3 py-2 font-mono text-[#FF5A1F]">
            partQuery=
          </span>
          <span className="rounded-lg border border-amber-700/40 bg-amber-500/10 px-3 py-2 font-mono text-amber-300">
            lat=&lng=
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-[#64748B]">
          <ArrowRight className="h-4 w-4" />
          <span>
            Strict YouTube query:{' '}
            <span className="font-mono text-[#E2E8F0]">
              [Year] [Make] [Model] [partQuery] repair replacement
            </span>
          </span>
        </div>

        {/* Tabs */}
        <div className="mt-10 flex flex-wrap gap-2">
          {tabs.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setActive(i)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                active === i
                  ? 'bg-[#FF5A1F] text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)]'
                  : 'bg-[#121824]/90 text-[#64748B] hover:bg-[#121824] hover:text-[#E2E8F0]'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        <p className="mt-5 text-sm leading-relaxed text-[#64748B]">{tab.blurb}</p>

        <div className="mt-4">
          <CodeBlock code={tab.code} filename={tab.filename} language="typescript" />
        </div>

        {/* Response shape */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-[#E2E8F0]">Response payload</h3>
          <p className="mt-1 text-sm text-[#64748B]">
            One JSON object with three buckets — local parts sorted by distance, national parts, and
            matched YouTube tutorials.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {[
              { key: 'localParts', icon: MapPin, color: 'text-[#FF5A1F]', note: '≤ 25km, sorted nearest-first' },
              { key: 'nationalParts', icon: ArrowRight, color: 'text-[#00E5FF]', note: '> 25km, sorted nearest-first' },
              { key: 'youtubeTutorials', icon: Youtube, color: 'text-rose-400', note: 'up to 5 videos' },
            ].map((b) => (
              <div key={b.key} className="rounded-xl border border-[#1F293D] bg-[#121824]/90 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                <div className="flex items-center gap-2">
                  <b.icon className={`h-5 w-5 ${b.color}`} />
                  <span className="font-mono text-sm text-[#E2E8F0]">{b.key}</span>
                </div>
                <p className="mt-2 text-xs text-[#64748B]">{b.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <CodeBlock code={sampleResponse} filename="response.json" language="typescript" />
          </div>
        </div>
      </div>
    </section>
  );
}
