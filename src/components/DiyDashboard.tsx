import { useEffect, useRef, useState } from 'react';
import {
  Search,
  Car,
  Play,
  ScanLine,
  Truck,
  Package,
  Facebook,
  MapPin,
  Star,
  ChevronRight,
  Wrench,
  Gauge,
  CircleDot,
  ExternalLink,
  Loader2,
  ShoppingCart,
  GraduationCap,
  FileText,
  Camera,
  ChevronDown,
  CheckCircle2,
  Cpu,
  Zap,
  User,
} from 'lucide-react';
import { simulateSearchEndpoint, simulateRegoLookup, simulateGeocode, haversineKm, type MockPart, type MockTutorial, type MockTorqueSpec, type MockVehicle, type GeocodeResult } from './mockBackend';
import { TrackingOverlay } from './TrackingOverlay';
import { TutorialHub } from './TutorialHub';
import { VinScanner } from './VinScanner';
import { PhotoScanner } from './PhotoScanner';
import { TermsModal } from './TermsModal';
import { JobCard, AddToJobCardButton, type BomLine } from './JobCard';

type DeliveryTab = 'local' | 'national' | 'facebook';
type EntryMode = 'rego' | 'search';
type Role = 'diy' | 'pro';

const AUS_STATES = ['VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const;
type AusState = typeof AUS_STATES[number];

interface TabDef {
  key: DeliveryTab;
  label: string;
  sub: string;
  icon: typeof Truck;
  color: string;
  bg: string;
  ring: string;
}

const TAB_DEFS: TabDef[] = [
  { key: 'local', label: 'Fast Local Delivery', sub: 'Fast', icon: Truck, color: 'text-[#FF5A1F]', bg: 'bg-[#FF5A1F]/10', ring: 'ring-[#FF5A1F]/40' },
  { key: 'national', label: 'National Shipping', sub: '2-3 days', icon: Package, color: 'text-[#00E5FF]', bg: 'bg-[#00E5FF]/10', ring: 'ring-[#00E5FF]/40' },
  { key: 'facebook', label: 'Facebook Marketplace', sub: 'Used nearby', icon: Facebook, color: 'text-slate-300', bg: 'bg-slate-500/10', ring: 'ring-slate-500/40' },
];

const CARD = 'bg-[#121824]/90 border border-[#1F293D] shadow-[0_4px_20px_rgba(0,0,0,0.4)]';

function PartCard({
  part,
  tab,
  onCheckout,
  onAddToJobCard,
  showAddToJobCard,
  distanceKm,
}: {
  part: MockPart;
  tab: DeliveryTab;
  onCheckout?: (part: MockPart) => void;
  onAddToJobCard?: (part: MockPart) => void;
  showAddToJobCard?: boolean;
  distanceKm?: number;
}) {
  const accent =
    tab === 'local'
      ? 'border-l-[#FF5A1F]'
      : tab === 'national'
      ? 'border-l-[#00E5FF]'
      : 'border-l-slate-500';

  const isLocal = distanceKm !== undefined && distanceKm <= 25;
  const distanceLabel = distanceKm !== undefined
    ? distanceKm < 10
      ? `${distanceKm.toFixed(1)} km`
      : `${Math.round(distanceKm)} km`
    : part.distance;
  const distanceIcon = isLocal ? Zap : Package;
  const DistanceIcon = distanceIcon;

  const cardBase = `w-full border-l-4 ${CARD} p-3 text-left transition-all duration-200 hover:border-[#3a4a66] active:scale-[0.98]`;

  const inner = (
    <div className="flex items-start gap-4">
      {/* Product thumbnail */}
      <div className="h-20 w-20 flex-none overflow-hidden rounded-xl bg-slate-800 shadow-inner">
        <img
          src={part.imageUrl}
          alt={part.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Part details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#E2E8F0]">{part.title}</p>
            <p className="mt-0.5 truncate text-xs text-[#64748B]">{part.brand} · {part.seller}</p>
          </div>
          <span className="flex-none font-mono text-base font-bold text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/20 px-2.5 py-1 rounded-md">
            ${part.price.toFixed(2)}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
          <span
            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 font-semibold transition-all duration-300 ${
              isLocal
                ? 'bg-[#FF5A1F]/10 text-[#FF5A1F] ring-1 ring-[#FF5A1F]/20'
                : distanceKm !== undefined
                ? 'bg-[#00E5FF]/10 text-[#00E5FF] ring-1 ring-[#00E5FF]/20'
                : ''
            }`}
          >
            {distanceKm !== undefined ? <DistanceIcon className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
            {distanceLabel} away
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-400" />
            {part.rating}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 font-medium text-[#64748B]">
            {tab === 'local' && <Truck className="h-3 w-3 text-[#FF5A1F]" />}
            {tab === 'national' && <Package className="h-3 w-3 text-[#00E5FF]" />}
            {tab === 'facebook' && <Facebook className="h-3 w-3 text-slate-400" />}
            <span className="font-mono text-[#00E5FF]">{part.eta}</span>
          </span>
        </div>
        {tab === 'facebook' && part.url && (
          <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-300">
            <ExternalLink className="h-3 w-3" />
            View Link
          </div>
        )}
        {tab === 'local' && onCheckout && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCheckout(part);
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#FF5A1F]/15 py-2 text-xs font-semibold text-[#FF5A1F] ring-1 ring-[#FF5A1F]/30 transition-all duration-200 hover:bg-[#FF5A1F]/25 hover:shadow-[0_0_15px_rgba(255,90,31,0.4)] active:scale-[0.98]"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Get · Fast Local Delivery
          </button>
        )}
        {showAddToJobCard && onAddToJobCard && (
          <AddToJobCardButton part={part} onAdd={onAddToJobCard} />
        )}
      </div>
    </div>
  );

  if (tab === 'facebook' && part.url) {
    return (
      <a
        href={part.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block bg-gradient-to-r from-slate-700/20 to-slate-800/20 ${cardBase} ${accent}`}
      >
        {inner}
      </a>
    );
  }

  return (
    <div className={`${cardBase} ${accent}`}>
      {inner}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className={`border-l-4 border-l-slate-700 ${CARD} p-3`}>
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 flex-none animate-pulse rounded-xl bg-slate-700/50" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-slate-700/60" />
          <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-700/40" />
          <div className="mt-3 flex gap-3">
            <div className="h-2.5 w-12 animate-pulse rounded bg-slate-700/40" />
            <div className="h-2.5 w-8 animate-pulse rounded bg-slate-700/40" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonEducation() {
  return (
    <div className={`overflow-hidden rounded-2xl ${CARD}`}>
      <div className="aspect-video w-full animate-pulse bg-slate-700/40" />
      <div className="p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-700/60" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-[#0A0D14]/60 px-3 py-2">
              <div className="h-2.5 w-32 animate-pulse rounded bg-slate-700/40" />
              <div className="h-2.5 w-20 animate-pulse rounded bg-slate-700/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DiyDashboard() {
  const [tab, setTab] = useState<DeliveryTab>('local');
  const [searchQuery, setSearchQuery] = useState('brake pads');
  const [loading, setLoading] = useState(true);

  const [localParts, setLocalParts] = useState<MockPart[]>([]);
  const [nationalParts, setNationalParts] = useState<MockPart[]>([]);
  const [facebookParts, setFacebookParts] = useState<MockPart[]>([]);

  // Delivery address + geocoding state
  const [address, setAddress] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoResult, setGeoResult] = useState<GeocodeResult | null>(null);
  const [allParts, setAllParts] = useState<MockPart[]>([]);
  const geoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tutorials, setTutorials] = useState<MockTutorial[]>([]);
  const [torqueSpecs, setTorqueSpecs] = useState<MockTorqueSpec[]>([]);
  const [torqueTitle, setTorqueTitle] = useState('');

  const [isTracking, setIsTracking] = useState(false);
  const [trackingPartName, setTrackingPartName] = useState('Bendix Heavy Duty Brake Pads');
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [photoScannerOpen, setPhotoScannerOpen] = useState(false);
  const [vinToast, setVinToast] = useState<string | null>(null);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  // Role + Job Card state
  const [role, setRole] = useState<Role>('diy');
  const [bom, setBom] = useState<BomLine[]>([]);
  const [workOrderToast, setWorkOrderToast] = useState<string | null>(null);

  // Rego lookup state
  const [entryMode, setEntryMode] = useState<EntryMode>('rego');
  const [regoPlate, setRegoPlate] = useState('');
  const [regoState, setRegoState] = useState<AusState>('VIC');
  const [regoLoading, setRegoLoading] = useState(false);
  const [regoVerified, setRegoVerified] = useState(false);
  const [vehicle, setVehicle] = useState<MockVehicle | null>(null);
  const [photoToast, setPhotoToast] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // handleSearch — debounced so typing fires the mock endpoint after 350ms of quiet.
  // After fetching, all parts are pooled and reclassified by Haversine distance from
  // the user's delivery address (if geocoded), or split by the dataset's default tier.
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const result = await simulateSearchEndpoint(query);
      setTutorials(result.youtubeTutorials);
      setTorqueSpecs(result.torqueSpecs);
      setTorqueTitle(result.torqueTitle);
      const pooled = [...result.localParts, ...result.nationalParts, ...result.facebookParts];
      setAllParts(pooled);
      reclassifyByDistance(pooled, geoResult);
      setLoading(false);
    }, 350);
  };

  // Reclassify pooled parts into local / national / facebook tiers using the
  // Haversine distance from the user's geocoded delivery address. Local Courier
  // is sorted nearest-first. Without a geocoded address, fall back to dataset tiers.
  const reclassifyByDistance = (parts: MockPart[], geo: GeocodeResult | null) => {
    if (!geo) {
      const local = parts.filter((p) => parseFloat(p.distance) > 0 && p.distance !== '—');
      const national = parts.filter((p) => p.distance === '—');
      const facebook = parts.filter((p) => p.url);
      setLocalParts(local);
      setNationalParts(national);
      setFacebookParts(facebook);
      return;
    }
    const withDist = parts.map((p) => ({
      part: p,
      km: haversineKm(geo.lat, geo.lng, p.lat, p.lng),
    }));
    const local = withDist
      .filter((d) => d.km <= 25)
      .sort((a, b) => a.km - b.km)
      .map((d) => d.part);
    const national = withDist
      .filter((d) => d.km > 25 && !d.part.url)
      .sort((a, b) => a.km - b.km)
      .map((d) => d.part);
    const facebook = withDist
      .filter((d) => d.km > 25 && d.part.url)
      .sort((a, b) => a.km - b.km)
      .map((d) => d.part);
    setLocalParts(local);
    setNationalParts(national);
    setFacebookParts(facebook);
  };

  // Geocode the typed delivery address, then reclassify existing parts.
  const handleAddressSearch = (value: string) => {
    setAddressInput(value);
    if (geoDebounceRef.current) clearTimeout(geoDebounceRef.current);
    geoDebounceRef.current = setTimeout(async () => {
      if (!value.trim()) {
        setGeoResult(null);
        setAddress('');
        reclassifyByDistance(allParts, null);
        return;
      }
      setGeoLoading(true);
      const result = await simulateGeocode(value);
      setGeoResult(result);
      setAddress(result.label);
      setGeoLoading(false);
      reclassifyByDistance(allParts, result);
    }, 600);
  };

  // Initial load.
  useEffect(() => {
    handleSearch('brake pads');
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // Initial demo load only; subsequent searches are user driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTab = TAB_DEFS.find((t) => t.key === tab)!;
  const tabParts = tab === 'local' ? localParts : tab === 'national' ? nationalParts : facebookParts;
  const totalCount = localParts.length + nationalParts.length + facebookParts.length;
  const partDistance = (part: MockPart): number | undefined =>
    geoResult ? haversineKm(geoResult.lat, geoResult.lng, part.lat, part.lng) : undefined;
  const tutorial = tutorials[0];

  // Checkout — start the simulated courier tracking overlay.
  const handleCheckout = (part: MockPart) => {
    setTrackingPartName(part.title);
    setIsTracking(true);
  };

  const resetTracking = () => {
    setIsTracking(false);
  };

  if (isTracking) {
    return <TrackingOverlay partName={trackingPartName} onReset={resetTracking} />;
  }

  const handleVinDetected = (vin: string) => {
    setVinToast(`VIN decoded: ${vin}`);
    handleSearch('brake pads');
    setTimeout(() => setVinToast(null), 4000);
  };

  // Rego lookup — 1.5s spinner then verified vehicle badge.
  const handleRegoCheck = async () => {
    if (!regoPlate.trim()) return;
    setRegoLoading(true);
    setRegoVerified(false);
    const result = await simulateRegoLookup(regoPlate, regoState);
    setVehicle(result.vehicle);
    setRegoLoading(false);
    setRegoVerified(true);
  };

  // Photo scan — 2s processing then toast + auto-search.
  const handlePhotoResult = (component: string, confidence: number, searchQuery: string) => {
    setPhotoToast(`AI Object Match: ${component} detected with ${confidence}% fitment confidence! Loading matching local inventory…`);
    handleSearch(searchQuery);
    setTimeout(() => setPhotoToast(null), 5000);
  };

  // Add a part to the Job Card BOM (shared state lifted here so PartCard can write).
  const handleAddToJobCard = (part: MockPart) => {
    setBom((prev) => {
      if (prev.some((l) => l.id === part.id)) return prev;
      return [...prev, { id: part.id, title: part.title, brand: part.brand, vendor: part.seller, price: part.price }];
    });
  };

  const handleWorkOrderSaved = (msg: string) => {
    setWorkOrderToast(msg);
    setBom([]);
    setTimeout(() => setWorkOrderToast(null), 4500);
  };

  return (
    <>
      <TermsModal
        open={!hasAcceptedTerms}
        onAccept={() => setHasAcceptedTerms(true)}
      />

      <div className={`min-h-screen bg-[#0A0D14] text-slate-200 antialiased transition-all duration-400 ${
        hasAcceptedTerms ? 'blur-0' : 'blur-sm'
      }`}>
      <TutorialHub open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      <VinScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleVinDetected}
      />
      <PhotoScanner
        open={photoScannerOpen}
        onClose={() => setPhotoScannerOpen(false)}
        onResult={handlePhotoResult}
      />

      {/* ── Role Switcher ────────────────────────────────────────────── */}
      <div className={`mx-auto max-w-md px-4 pt-4 ${hasAcceptedTerms ? '' : 'pointer-events-none'}`}>
        <div className="flex items-center gap-1 rounded-full border border-[#1F293D] bg-[#121824]/90 p-1 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <button
            onClick={() => setRole('diy')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
              role === 'diy'
                ? 'bg-[#FF5A1F] text-slate-950 shadow-[0_0_12px_rgba(255,90,31,0.4)]'
                : 'text-[#64748B] hover:text-[#E2E8F0]'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            DIY Driver
          </button>
          <button
            onClick={() => setRole('pro')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
              role === 'pro'
                ? 'bg-[#FF5A1F] text-slate-950 shadow-[0_0_12px_rgba(255,90,31,0.4)]'
                : 'text-[#64748B] hover:text-[#E2E8F0]'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            Pro Workshop
          </button>
        </div>
      </div>

      {/* ── Header Block ─────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-40 mt-4 border-b border-[#1F293D] bg-[#0A0D14]/90 backdrop-blur-md ${
        hasAcceptedTerms ? '' : 'pointer-events-none'
      }`}>
        <div className="mx-auto max-w-md px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#64748B]">
              <Wrench className="h-3.5 w-3.5 text-[#FF5A1F]" />
              ⚡ PartsForge Garage
            </div>
            <button
              onClick={() => setTutorialOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FF5A1F]/15 to-[#00E5FF]/15 px-3 py-1.5 text-xs font-bold text-[#FF5A1F] ring-1 ring-[#FF5A1F]/30 transition-all duration-200 hover:shadow-[0_0_15px_rgba(255,90,31,0.4)] active:scale-[0.98]"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              PartsForge Academy
            </button>
          </div>

          {/* Vehicle badge */}
          <div className={`mt-3 flex items-center gap-3 rounded-xl ${CARD} p-3 transition-all duration-200 hover:border-[#3a4a66] ${
            regoVerified ? 'ring-1 ring-[#FF5A1F]/40 shadow-[0_0_15px_rgba(255,90,31,0.2)]' : ''
          }`}>
            <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${
              regoVerified
                ? 'bg-[#FF5A1F]/20 text-[#FF5A1F] ring-1 ring-[#FF5A1F]/40'
                : 'bg-gradient-to-br from-[#FF5A1F]/20 to-[#00E5FF]/20 text-[#FF5A1F] ring-1 ring-[#1F293D]'
            }`}>
              {regoVerified ? <CheckCircle2 className="h-5 w-5" /> : <Car className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              {regoVerified && vehicle ? (
                <>
                  <p className="truncate text-base font-bold text-[#E2E8F0]">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-xs text-[#FF5A1F]">
                    Verified: {vehicle.engine} · {vehicle.fuel} · {vehicle.drivetrain}
                  </p>
                </>
              ) : (
                <>
                  <p className="truncate text-base font-bold text-[#E2E8F0]">
                    2015 Toyota Hilux
                  </p>
                  <p className="text-xs text-[#64748B]">3.0L · Diesel · 4×4</p>
                </>
              )}
            </div>
            <ChevronRight className="ml-auto h-5 w-5 flex-none text-slate-600" />
          </div>

          {/* Entry-mode toggle: Enter Rego / Search & Scan */}
          <div className="mt-3 flex gap-1.5">
            <button
              onClick={() => setEntryMode('rego')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 active:scale-[0.98] ${
                entryMode === 'rego'
                  ? 'bg-[#FF5A1F] text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)]'
                  : `${CARD} text-[#64748B] hover:text-[#E2E8F0]`
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Enter Rego
            </button>
            <button
              onClick={() => setEntryMode('search')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 active:scale-[0.98] ${
                entryMode === 'search'
                  ? 'bg-[#FF5A1F] text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)]'
                  : `${CARD} text-[#64748B] hover:text-[#E2E8F0]`
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              Search / Scan
            </button>
          </div>

          {/* Rego entry mode */}
          {entryMode === 'rego' && (
            <div className="mt-3 space-y-3">
              {/* Australian rego plate */}
              <div className="flex gap-2">
                {/* State dropdown */}
                <div className="relative flex-none">
                  <select
                    value={regoState}
                    onChange={(e) => setRegoState(e.target.value as AusState)}
                    className="h-full appearance-none rounded-lg border-2 border-[#0A5C2A] bg-[#0A5C2A] px-3 pr-7 font-mono text-sm font-bold text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition hover:border-[#0A7A35] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/30"
                  >
                    {AUS_STATES.map((s) => (
                      <option key={s} value={s} className="bg-[#0A5C2A] text-white">{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/80" />
                </div>

                {/* White plate body */}
                <div className="relative flex-1 overflow-hidden rounded-lg border-2 border-[#0A0D14] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                  {/* Blue header strip */}
                  <div className="flex items-center justify-between bg-[#1B3A6B] px-2 py-0.5">
                    <span className="font-mono text-[8px] font-bold tracking-wider text-white">VICTORIA</span>
                    <span className="font-mono text-[8px] font-bold tracking-wider text-white">·</span>
                  </div>
                  <input
                    value={regoPlate}
                    onChange={(e) => setRegoPlate(e.target.value.toUpperCase())}
                    placeholder="1XX-2YY"
                    maxLength={7}
                    className="w-full bg-transparent px-3 py-2.5 text-center font-mono text-2xl font-bold uppercase tracking-[0.15em] text-black placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Check Rego button */}
              <button
                onClick={handleRegoCheck}
                disabled={!regoPlate.trim() || regoLoading}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
                  regoLoading || !regoPlate.trim()
                    ? 'cursor-not-allowed bg-slate-800/60 text-slate-500 ring-1 ring-[#1F293D]'
                    : 'bg-[#FF5A1F] text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)] hover:shadow-[0_0_20px_rgba(255,90,31,0.6)] active:scale-[0.98]'
                }`}
              >
                {regoLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking Rego…
                  </>
                ) : regoVerified ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Re-Verify Rego
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Check Rego
                  </>
                )}
              </button>

              {/* Verified flash banner */}
              {regoVerified && vehicle && (
                <div className="flex items-center gap-2 rounded-xl border border-[#FF5A1F]/30 bg-[#FF5A1F]/10 px-3 py-2.5 animate-[notiflash_0.6s_ease-out]">
                  <CheckCircle2 className="h-4 w-4 flex-none text-[#FF5A1F]" />
                  <p className="text-xs font-semibold text-[#FF5A1F]">
                    Verified: {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.engine}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Search / Scan mode */}
          {entryMode === 'search' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(searchQuery);
              }}
              className="relative mt-3"
            >
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search parts for this vehicle…"
                className={`w-full rounded-xl ${CARD} py-3 pl-10 pr-24 text-sm text-[#E2E8F0] transition-all duration-200 placeholder:text-slate-500 hover:border-[#3a4a66] focus:border-[#FF5A1F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20`}
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPhotoScannerOpen(true)}
                  aria-label="Photo ID — AI part recognition"
                  className="flex h-8 items-center gap-1 rounded-lg bg-gradient-to-br from-[#FF5A1F]/25 to-[#00E5FF]/15 px-2 text-[10px] font-bold text-[#FF5A1F] ring-1 ring-[#FF5A1F]/30 transition-all duration-200 hover:from-[#FF5A1F]/35 hover:to-[#00E5FF]/25 hover:shadow-[0_0_15px_rgba(255,90,31,0.4)] active:scale-95"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Photo ID
                </button>
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  aria-label="Scan VIN or barcode"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF5A1F]/20 to-[#00E5FF]/20 text-[#FF5A1F] ring-1 ring-[#FF5A1F]/30 transition-all duration-200 hover:from-[#FF5A1F]/30 hover:to-[#00E5FF]/30 active:scale-95"
                >
                  <ScanLine className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Delivery address bar — geocodes to GPS, drives Haversine proximity filtering */}
          <div className="relative mt-3">
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#FF5A1F]" />
            <input
              value={addressInput}
              onChange={(e) => handleAddressSearch(e.target.value)}
              placeholder="📍 Delivery Address: Enter Street Address…"
              className={`w-full rounded-xl ${CARD} py-3 pl-10 pr-28 text-sm text-[#E2E8F0] transition-all duration-200 placeholder:text-slate-500 hover:border-[#3a4a66] focus:border-[#FF5A1F]/50 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20`}
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
              {geoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#FF5A1F]" />
              ) : address ? (
                <span className="flex items-center gap-1 rounded-lg bg-[#FF5A1F]/10 px-2 py-1 text-[10px] font-bold text-[#FF5A1F] ring-1 ring-[#FF5A1F]/30">
                  <CheckCircle2 className="h-3 w-3" />
                  {address}
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-500">Set location</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-md space-y-4 px-4 pb-24 ${
        hasAcceptedTerms ? '' : 'pointer-events-none'
      }`}>
        {/* Pro Workshop renders the Job Card sheet alongside the parts finder. */}
        {role === 'pro' && (
          <JobCard vehicle={vehicle} bom={bom} setBom={setBom} onSavedToast={handleWorkOrderSaved} />
        )}
        {/* ── Marketplace Block ───────────────────────────────────────── */}
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            <Truck className="h-3.5 w-3.5 text-[#FF5A1F]" />
            Matching Parts · {loading ? '…' : totalCount}
          </h2>

          {/* Segmented tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {TAB_DEFS.map((t) => {
              const isActive = t.key === tab;
              const count =
                t.key === 'local' ? localParts.length :
                t.key === 'national' ? nationalParts.length :
                facebookParts.length;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex flex-none items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 active:scale-[0.98] ${
                    isActive
                      ? `${t.bg} ${t.color} ring-1 ${t.ring}`
                      : `${CARD} text-[#64748B] hover:text-[#E2E8F0]`
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  <span className="whitespace-nowrap">{t.label}</span>
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive ? 'bg-[#0A0D14]/40 text-[#E2E8F0]' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {loading ? '…' : count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active tab header — flashing amber warning light for Local Courier */}
          <div
            className={`mt-3 flex items-center gap-2 rounded-lg border ${CARD} px-3 py-2 ${
              tab === 'local'
                ? 'border-[#FF5A1F]/40 animate-[localpulse_2s_ease-in-out_infinite]'
                : 'border-[#1F293D]'
            }`}
          >
            <activeTab.icon className={`h-4 w-4 ${activeTab.color}`} />
            <span className="text-sm font-semibold text-[#E2E8F0]">{activeTab.label}</span>
            <span className="text-xs text-[#64748B]">· {activeTab.sub}</span>
          </div>

          {/* Parts list */}
          <div className="space-y-4">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : tabParts.map((part) => (
                  <PartCard
                    key={part.id}
                    part={part}
                    tab={tab}
                    onCheckout={handleCheckout}
                    showAddToJobCard={role === 'pro'}
                    onAddToJobCard={handleAddToJobCard}
                    distanceKm={partDistance(part)}
                  />
                ))}
          </div>
        </section>

        {/* ── Education Block ─────────────────────────────────────────── */}
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            <Gauge className="h-3.5 w-3.5 text-[#FF5A1F]" />
            Learn Before You Wrench
          </h2>

          {loading ? (
            <SkeletonEducation />
          ) : (
            <div className={`overflow-hidden rounded-2xl ${CARD}`}>
              {/* Video thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
                {tutorial && (
                  <img
                    src={tutorial.thumbnail}
                    alt={tutorial.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14]/80 via-[#0A0D14]/20 to-transparent" />
                <button className="absolute inset-0 flex items-center justify-center transition-all duration-200 active:scale-95">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF5A1F] text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)] ring-4 ring-[#FF5A1F]/20 transition-all duration-200 hover:scale-105">
                    <Play className="ml-0.5 h-6 w-6 fill-current" />
                  </span>
                </button>
                {tutorial && (
                  <>
                    <span className="absolute bottom-2 left-2 rounded-md bg-[#0A0D14]/70 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                      {tutorial.duration}
                    </span>
                    <span className="absolute bottom-2 right-2 rounded-md bg-[#FF5A1F]/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Tutorial
                    </span>
                  </>
                )}
              </div>

              {/* Torque spec snippet */}
              <div className="p-4">
                <p className="text-sm font-bold text-[#E2E8F0]">
                  {torqueTitle || '2015 Hilux 3.0L — Front Brake Pad Replacement'}
                </p>
                <div className="mt-3 space-y-2">
                  {torqueSpecs.map((row) => (
                    <div
                      key={row.label}
                      className={`flex items-center justify-between rounded-lg bg-[#0A0D14]/60 px-3 py-2`}
                    >
                      <span className="flex items-center gap-2 text-xs text-[#64748B]">
                        <CircleDot className="h-3 w-3 text-[#FF5A1F]" />
                        {row.label}
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/20 px-2.5 py-1 rounded-md">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-[#64748B]">
                  Factory torque specs per Toyota service manual. Always tighten in a star pattern and
                  use a calibrated torque wrench.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Work Order saved toast */}
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 transition-all duration-300 ${
          workOrderToast ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-[#FF5A1F]/30 bg-[#0A0D14]/90 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#FF5A1F] text-slate-950">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold text-[#FF5A1F]">{workOrderToast}</p>
        </div>
      </div>

      {/* AI Photo recognition toast */}
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 transition-all duration-300 ${
          photoToast ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}
      >
        <div className={`pointer-events-auto flex items-start gap-3 rounded-2xl border border-[#FF5A1F]/30 bg-[#0A0D14]/90 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl`}>
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#FF5A1F] text-slate-950">
            <Cpu className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold text-[#FF5A1F]">{photoToast}</p>
        </div>
      </div>

      {/* VIN detected toast */}
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 transition-all duration-300 ${
          vinToast ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}
      >
        <div className={`pointer-events-auto flex items-center gap-3 rounded-2xl border border-[#00E5FF]/30 bg-[#0A0D14]/90 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl`}>
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#00E5FF] text-slate-950">
            <ScanLine className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold text-[#00E5FF]">{vinToast}</p>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#1F293D] bg-[#0A0D14]/95 backdrop-blur-md ${
        hasAcceptedTerms ? '' : 'pointer-events-none'
      }`}>
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <button className="flex items-center gap-2 text-sm text-[#64748B] transition-all duration-200 hover:text-[#E2E8F0]">
            <Car className="h-4 w-4" />
            Garage
          </button>
          <button className="flex items-center gap-2 rounded-full bg-[#FF5A1F] px-5 py-2.5 text-sm font-bold text-slate-950 shadow-[0_0_15px_rgba(255,90,31,0.4)] transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,90,31,0.6)] active:scale-[0.98]">
            <Wrench className="h-4 w-4" />
            Finish Job
          </button>
          <button className="flex items-center gap-2 text-sm text-[#64748B] transition-all duration-200 hover:text-[#E2E8F0]">
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
