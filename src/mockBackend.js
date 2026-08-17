// PartsForge mock backend — mirrors real marketplace API response shapes.
// All exports are async to emulate network latency.

export const COURIER_BASE_FEE = 12.50; // flat base courier fee per seller storefront leg
export const TAX_RATE = 0.10; // 10% GST
// Shop markup applied to courier freight when finalizing a customer invoice.
// Rounds the raw freight up to the nearest $5 so the workshop recovers consumables overhead
// (hazmat disposal, shop rags, fluid containers) without exposing a "freight" line to the customer.
export const CONSUMABLES_MARKUP = (fee) => Math.ceil((fee || 0) / 5) * 5;

// ─── Worldwide Registration Fallback Profiles ──────────────────────────────
// When the live public rego-check site DOM is blocked or changes, these
// market-specific test vehicle profiles are returned so the mechanic's
// live test run never stalls. Each profile matches its global market layout.
const REGO_FALLBACK_PROFILES = {
  'AU_VIC': { year: 2018, make: 'TOYOTA', model: 'HILUX WORKMATE', engine: '2.7L Petrol', vin: 'AHT0HILX401234567', rego: '1XX2YY', state: 'VIC', country: 'Australia' },
  'AU_NSW': { year: 2018, make: 'TOYOTA', model: 'HILUX WORKMATE', engine: '2.7L Petrol', vin: 'AHT0HILX401234567', rego: '1XX2YY', state: 'NSW', country: 'Australia' },
  'AU_QLD': { year: 2018, make: 'TOYOTA', model: 'HILUX WORKMATE', engine: '2.7L Petrol', vin: 'AHT0HILX401234567', rego: '1XX2YY', state: 'QLD', country: 'Australia' },
  'AU_SA':  { year: 2018, make: 'TOYOTA', model: 'HILUX WORKMATE', engine: '2.7L Petrol', vin: 'AHT0HILX401234567', rego: '1XX2YY', state: 'SA', country: 'Australia' },
  'AU_WA':  { year: 2018, make: 'TOYOTA', model: 'HILUX WORKMATE', engine: '2.7L Petrol', vin: 'AHT0HILX401234567', rego: '1XX2YY', state: 'WA', country: 'Australia' },
  'AU_TAS': { year: 2018, make: 'TOYOTA', model: 'HILUX WORKMATE', engine: '2.7L Petrol', vin: 'AHT0HILX401234567', rego: '1XX2YY', state: 'TAS', country: 'Australia' },
  'AU_NT':  { year: 2018, make: 'TOYOTA', model: 'HILUX WORKMATE', engine: '2.7L Petrol', vin: 'AHT0HILX401234567', rego: '1XX2YY', state: 'NT', country: 'Australia' },
  'AU_ACT': { year: 2018, make: 'TOYOTA', model: 'HILUX WORKMATE', engine: '2.7L Petrol', vin: 'AHT0HILX401234567', rego: '1XX2YY', state: 'ACT', country: 'Australia' },
  'NZ':     { year: 2021, make: 'FORD', model: 'Ranger WILDTRAK', engine: '3.2L TDCi', vin: 'MNZ0FORD409876543', rego: 'ABC123', state: 'AUCKLAND', country: 'New Zealand' },
  'UK':     { year: 2019, make: 'VAUXHALL', model: 'CORSA SRI', engine: '1.4L Turbo', vin: 'VXK0CRSA401112223', rego: 'AB12CDE', state: 'LONDON', country: 'United Kingdom' },
  'US_CA':  { year: 2022, make: 'FORD', model: 'F-150 LIGHTNING', engine: 'Dual Electric', vin: '1FTV0F150202233344', rego: '8ABC123', state: 'CALIFORNIA', country: 'United States' },
  'US_NY':  { year: 2022, make: 'FORD', model: 'F-150 LIGHTNING', engine: 'Dual Electric', vin: '1FTV0F150202233344', rego: '8ABC123', state: 'NEW YORK', country: 'United States' },
  'US_TX':  { year: 2022, make: 'FORD', model: 'F-150 LIGHTNING', engine: 'Dual Electric', vin: '1FTV0F150202233344', rego: '8ABC123', state: 'TEXAS', country: 'United States' },
};

// ─── International Sourcing Tier Shipping Surcharges (AUD) ──────────────────
// Trans-Tasman (NZ) air freight duty surcharge and Global Direct (US/UK/JP)
// overseas air cargo courier duty surcharge. These are workshop operational
// ledger expenses — never passed to the customer invoice.
export const TRANS_TASMAN_FREIGHT_SURCHARGE = 45.00;
export const GLOBAL_DIRECT_FREIGHT_SURCHARGE = 85.00;

// Maps a sourcing tier to its geographical bucket and freight surcharge.
// 'local' = Fast Local (25km Hub), 'trans_tasman' = Trans-Tasman Trade (NZ),
// 'global_direct' = Global Direct (US/UK/JP Wholesalers).
export const SOURCING_TIERS = {
  local:          { label: '🇦🇺 Fast Local (25km Hub)',        freightSurcharge: 0,     flag: '🇦🇺' },
  trans_tasman:   { label: '🇳🇿 Trans-Tasman Trade',             freightSurcharge: TRANS_TASMAN_FREIGHT_SURCHARGE, flag: '🇳🇿' },
  global_direct:  { label: '🌐 Global Direct (US/UK/JP)',         freightSurcharge: GLOBAL_DIRECT_FREIGHT_SURCHARGE, flag: '🌐' },
};

const DATA_MATRIX = {
  vehicles: {
    '1XX2YY': { year: 2015, make: 'Toyota', model: 'Hilux', engine: '3.0L D-4D', vin: 'MROER29G501234567' },
    'XYZ789': { year: 2018, make: 'Mazda', model: 'CX-5', engine: '2.5L SkyActiv', vin: 'JM3KF2W701023456' }
  },
  catalog: {
    'brake pads': {
      torque: 'Caliper Slide Pins: 32 Nm | Mounting Bracket Bolts: 105 Nm',
      video: 'O_S89b_Qk6s', videoTitle: 'ChrisFix: How to Change Brake Pads (Step-by-Step)',
      local: [{ id: 'l1', brand: 'Bendix', title: 'Heavy Duty Front Brake Pads Set', retail: 85.00, trade: 68.00, shop: 'Repco South Morang', lat: -37.6412, lon: 145.0754, time: 'Fast Delivery', stock: 6, img: 'https://unsplash.com' }],
      national: [{ id: 'n1', brand: 'Brembo', title: 'Premium Ceramic Brake Pads Front', retail: 62.00, trade: 52.00, shop: 'Sparesbox Sydney', lat: -33.8688, lon: 151.2093, time: '2 Days', stock: 12, img: 'https://unsplash.com' }],
      trans_tasman: [{ id: 'tt1', brand: 'TRW', title: 'Brake Pad Set Front Axle (OEM Spec)', retail: 72.00, trade: 55.00, shop: 'Repco NZ Auckland', lat: -36.8485, lon: 174.7633, time: '4 Days', stock: 9, img: 'https://unsplash.com', sourcingTier: 'trans_tasman' }],
      global_direct: [{ id: 'g1', brand: 'Akebono', title: 'ProACT Ultra-Premium Brake Pads', retail: 95.00, trade: 70.00, shop: 'RockAuto USA', lat: 43.0389, lon: -87.9065, time: '7 Days', stock: 20, img: 'https://unsplash.com', sourcingTier: 'global_direct' }],
      facebook: [{ id: 'f1', title: 'Toyota Hilux 2015 parting out wrecks', price: 30.00, loc: 'Epping, VIC', lat: -37.6521, lon: 145.0432, stock: 1, img: 'https://unsplash.com' }]
    },
    'oil filter': {
      torque: 'Oil Filter Cap: 25 Nm | Oil Pan Drain Plug Bolt: 40 Nm',
      video: '2e_Z8SloCgg', videoTitle: 'Mighty Car Mods: How to Change Engine Oil and Filter',
      local: [{ id: 'l2', brand: 'Ryco', title: 'Premium Z9 Engine Oil Filter', retail: 18.50, trade: 14.20, shop: 'Supercheap Auto Epping', lat: -37.6512, lon: 145.0254, time: 'Fast Delivery', stock: 20, img: 'https://unsplash.com' }],
      national: [{ id: 'n2', brand: 'K&N', title: 'Performance Gold Oil Filter spin-on', retail: 29.00, trade: 24.00, shop: 'Automotive Superstore', lat: -33.8012, lon: 151.1023, time: '3 Days', stock: 8, img: 'https://unsplash.com' }],
      trans_tasman: [{ id: 'tt2', brand: 'Sakura', title: 'OEM Spec Oil Filter JDM', retail: 22.00, trade: 16.50, shop: 'AutoParts NZ Wellington', lat: -41.2865, lon: 174.7762, time: '4 Days', stock: 15, img: 'https://unsplash.com', sourcingTier: 'trans_tasman' }],
      global_direct: [{ id: 'g2', brand: 'Mobil 1', title: 'M1-110 Extended Performance Oil Filter', retail: 35.00, trade: 26.00, shop: 'Amazon JP Tokyo', lat: 35.6762, lon: 139.6503, time: '8 Days', stock: 30, img: 'https://unsplash.com', sourcingTier: 'global_direct' }],
      facebook: [{ id: 'f2', title: 'Ryco Z9 oil filter brand new box unopened', price: 10.00, loc: 'South Morang, VIC', lat: -37.6321, lon: 145.0654, stock: 1, img: 'https://unsplash.com' }]
    },
    'spark plugs': {
      torque: 'Spark Plug: 18 Nm (NGK spec)',
      video: 'dQw4w9WgXcQ', videoTitle: 'ChrisFix: How to Replace Spark Plugs',
      local: [{ id: 'l3', brand: 'NGK', title: 'Iridium IX Spark Plug (set of 4)', retail: 48.00, trade: 36.00, shop: 'Repco South Morang', lat: -37.6412, lon: 145.0754, time: 'Fast Delivery', stock: 10, img: 'https://unsplash.com' }],
      national: [{ id: 'n3', brand: 'Denso', title: 'Iridium Power Spark Plug (set of 4)', retail: 55.00, trade: 44.00, shop: 'Sparesbox Sydney', lat: -33.8688, lon: 151.2093, time: '2 Days', stock: 15, img: 'https://unsplash.com' }],
      trans_tasman: [{ id: 'tt3', brand: 'NGK', title: 'Laser Iridium Spark Plug Set (JDM Spec)', retail: 62.00, trade: 48.00, shop: 'Repco NZ Christchurch', lat: -43.5321, lon: 172.6362, time: '4 Days', stock: 12, img: 'https://unsplash.com', sourcingTier: 'trans_tasman' }],
      global_direct: [{ id: 'g3', brand: 'Denso', title: 'Iridium TT Twin-Tip Spark Plugs (Iridium+Platinum)', retail: 78.00, trade: 58.00, shop: 'Summit Racing USA', lat: 40.7128, lon: -74.0060, time: '7 Days', stock: 25, img: 'https://unsplash.com', sourcingTier: 'global_direct' }],
      facebook: [{ id: 'f3', title: 'NGK iridium plugs removed from wreck low km', price: 18.00, loc: 'Epping, VIC', lat: -37.6521, lon: 145.0432, stock: 1, img: 'https://unsplash.com' }]
    },
    'air filter': {
      torque: 'Air Filter Cover: 7 Nm (hand tight)',
      video: 'dQw4w9WgXcQ', videoTitle: 'Mighty Car Mods: Air Filter Replacement',
      local: [{ id: 'l4', brand: 'Ryco', title: 'High Flow Panel Air Filter', retail: 35.00, trade: 26.00, shop: 'Supercheap Auto Epping', lat: -37.6512, lon: 145.0254, time: 'Fast Delivery', stock: 14, img: 'https://unsplash.com' }],
      national: [{ id: 'n4', brand: 'K&N', title: 'Performance Washable Air Filter', retail: 89.00, trade: 71.00, shop: 'Automotive Superstore', lat: -33.8012, lon: 151.1023, time: '3 Days', stock: 5, img: 'https://unsplash.com' }],
      trans_tasman: [{ id: 'tt4', brand: 'Mann-Filter', title: 'OEM Air Filter Element (German Spec)', retail: 42.00, trade: 31.00, shop: 'AutoParts NZ Hamilton', lat: -37.7870, lon: 175.2793, time: '4 Days', stock: 8, img: 'https://unsplash.com', sourcingTier: 'trans_tasman' }],
      global_direct: [{ id: 'g4', brand: 'HKS', title: 'Racing Suction Reloaded Air Filter', retail: 120.00, trade: 89.00, shop: 'RHDJapan Osaka', lat: 34.6937, lon: 135.5023, time: '9 Days', stock: 6, img: 'https://unsplash.com', sourcingTier: 'global_direct' }],
      facebook: [{ id: 'f4', title: 'K&N air filter used 5000km cleanable', price: 25.00, loc: 'South Morang, VIC', lat: -37.6321, lon: 145.0654, stock: 1, img: 'https://unsplash.com' }]
    }
  }
};

export const processFreeRegoLookup = async (plate, region = 'AU_VIC') => {
  await new Promise(r => setTimeout(r, 1200));
  const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const known = DATA_MATRIX.vehicles[clean];
  if (known) return hydrateVehicleSpecs({ ...known, rego: clean, state: region.split('_')[1] || region, country: 'Australia' }, region);
  const fallback = REGO_FALLBACK_PROFILES[region] || REGO_FALLBACK_PROFILES['AU_VIC'];
  return hydrateVehicleSpecs({ ...fallback, rego: clean || fallback.rego }, region);
};

// ─── VIN Spec Sweep API Handshake ──────────────────────────────────────────
// Decodes a 17-character VIN sequence and hydrates the full nested vehicle
// specification array. Falls back to a region-matched profile if the VIN
// is not in the known database.
export const processVinLookup = async (vin, region = 'AU_VIC') => {
  await new Promise(r => setTimeout(r, 1400));
  const clean = vin.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Search known vehicles by VIN
  for (const [plate, v] of Object.entries(DATA_MATRIX.vehicles)) {
    if (v.vin === clean) return hydrateVehicleSpecs({ ...v, rego: plate, state: region.split('_')[1] || region, country: 'Australia' }, region);
  }
  // Search fallback profiles by VIN
  for (const [regKey, profile] of Object.entries(REGO_FALLBACK_PROFILES)) {
    if (profile.vin === clean) return hydrateVehicleSpecs({ ...profile }, regKey);
  }
  // Unknown VIN — return a region-matched fallback with the typed VIN
  const fallback = REGO_FALLBACK_PROFILES[region] || REGO_FALLBACK_PROFILES['AU_VIC'];
  return hydrateVehicleSpecs({ ...fallback, vin: clean || fallback.vin, rego: fallback.rego }, region);
};

// Hydrates hidden nested vehicle specification arrays upon data arrival.
function hydrateVehicleSpecs(base, region) {
  const profile = REGO_FALLBACK_PROFILES[region] || {};
  return {
    ...base,
    exactYear: base.year || profile.year || 2018,
    exactMake: base.make || profile.make || 'TOYOTA',
    exactModel: base.model || profile.model || 'HILUX',
    engineCode: base.engine || profile.engine || '2.7L Petrol',
    factorySpecs: {
      oilViscosity: '5W-30 Full Synthetic',
      coolantType: 'Toyota Long Life Coolant (Red)',
      brakeFluidSpec: 'DOT 4',
      transmissionFluid: '75W-85 GL-4 Gear Oil',
      refrigerantType: 'R134a',
      batterySpec: 'Group 24F / 600 CCA',
      tirePressure: '32 PSI (Front) / 35 PSI (Rear)',
      wiperBlade: '26" Driver / 16" Passenger',
    },
    registeredCountry: base.country || profile.country || 'Australia',
    registeredState: base.state || profile.state || region.split('_')[1] || region,
  };
}

export const processPartsQuery = async (query, userLat = -37.6012, userLon = 145.1054) => {
  await new Promise(r => setTimeout(r, 600));
  const normalized = query.toLowerCase();
  let key = 'brake pads';
  if (normalized.includes('oil') || normalized.includes('filter')) key = 'oil filter';
  else if (normalized.includes('spark') || normalized.includes('plug')) key = 'spark plugs';
  else if (normalized.includes('air')) key = 'air filter';
  const data = DATA_MATRIX.catalog[key];

  const calcDist = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    return Math.round((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))) * 10) / 10;
  };

  const mapper = (item) => ({ ...item, distanceKm: calcDist(userLat, userLon, item.lat, item.lon) });
  return {
    torque: data.torque, video: data.video, videoTitle: data.videoTitle,
    local: data.local.map(mapper), national: data.national.map(mapper), facebook: data.facebook.map(mapper),
    trans_tasman: (data.trans_tasman || []).map(mapper), global_direct: (data.global_direct || []).map(mapper),
    tools: getToolsForComponent(query),
    consumables: getConsumablesForComponent(query),
    docs: getDocsForComponent(query),
  };
};

// ─── Required Tools Catalog ──────────────────────────────────────────────────
// Dynamically recommends the exact tools needed for removal and installation
// based on the component searched. Mechanics can click Purchase Tool to add
// directly to their procurement cart.
const TOOLS_CATALOG = {
  'brake pads': [
    { id: 't1', title: '14mm Flare Nut Wrench', brand: 'GearWrench', retail: 28.00, trade: 22.00, shop: 'Supercheap Auto Epping', stock: 5, img: 'https://unsplash.com' },
    { id: 't2', title: 'Piston Retracting Tool (Caliper)', brand: 'Lisle', retail: 45.00, trade: 36.00, shop: 'Repco South Morang', stock: 3, img: 'https://unsplash.com' },
    { id: 't3', title: 'Torque Wrench 3/8" Drive (5-25 Nm)', brand: 'Toptul', retail: 89.00, trade: 71.00, shop: 'Supercheap Auto Epping', stock: 4, img: 'https://unsplash.com' },
    { id: 't4', title: 'C-Clamp Brake Piston Compressor', brand: 'Permatex', retail: 18.00, trade: 14.00, shop: 'Automotive Superstore', stock: 8, img: 'https://unsplash.com' },
  ],
  'oil filter': [
    { id: 't5', title: 'Oil Filter Wrench (76mm 14-flute)', brand: 'Toptul', retail: 15.00, trade: 11.00, shop: 'Supercheap Auto Epping', stock: 12, img: 'https://unsplash.com' },
    { id: 't6', title: '24mm Socket (Oil Drain Plug)', brand: 'GearWrench', retail: 12.00, trade: 9.00, shop: 'Repco South Morang', stock: 10, img: 'https://unsplash.com' },
    { id: 't7', title: 'Torque Wrench 1/2" Drive (20-100 Nm)', brand: 'Toptul', retail: 95.00, trade: 76.00, shop: 'Automotive Superstore', stock: 3, img: 'https://unsplash.com' },
  ],
  'spark plugs': [
    { id: 't8', title: '5/8" (16mm) Spark Plug Socket', brand: 'GearWrench', retail: 14.00, trade: 10.00, shop: 'Supercheap Auto Epping', stock: 8, img: 'https://unsplash.com' },
    { id: 't9', title: 'Magnetic Spark Plug Socket 12mm', brand: 'Lisle', retail: 22.00, trade: 17.00, shop: 'Repco South Morang', stock: 5, img: 'https://unsplash.com' },
    { id: 't10', title: 'Torque Wrench 3/8" Drive (5-25 Nm)', brand: 'Toptul', retail: 89.00, trade: 71.00, shop: 'Automotive Superstore', stock: 4, img: 'https://unsplash.com' },
  ],
  'air filter': [
    { id: 't11', title: 'Phillips #2 Screwdriver (Impact)', brand: 'Wera', retail: 19.00, trade: 15.00, shop: 'Supercheap Auto Epping', stock: 15, img: 'https://unsplash.com' },
    { id: 't12', title: '8mm Socket (Air Box Clips)', brand: 'GearWrench', retail: 8.00, trade: 6.00, shop: 'Repco South Morang', stock: 20, img: 'https://unsplash.com' },
  ],
};

// ─── Lubricants & Workshop Consumables Catalog ──────────────────────────────
// Vehicle-matched fluids indexed to factory oil viscosity weight, alongside
// workshop accessories (brake cleaner, towels, nitrile gloves).
const CONSUMABLES_CATALOG = {
  'brake pads': [
    { id: 'c1', title: 'Brake Cleaner Spray 400ml (Case of 12)', brand: 'Wurth', retail: 72.00, trade: 58.00, shop: 'Repco South Morang', stock: 6, category: 'cleaner', img: 'https://unsplash.com' },
    { id: 'c2', title: 'DOT 4 Brake Fluid 1L', brand: 'Castrol', retail: 28.00, trade: 22.00, shop: 'Supercheap Auto Epping', stock: 10, category: 'brake_fluid', img: 'https://unsplash.com' },
    { id: 'c3', title: 'Nitrile Gloves Box (100pc)', brand: 'Mechanix', retail: 24.00, trade: 18.00, shop: 'Automotive Superstore', stock: 15, category: 'accessory', img: 'https://unsplash.com' },
    { id: 'c4', title: 'Workshop Towel Rolls (Blue 2-Ply, 6 pack)', brand: 'WypAll', retail: 42.00, trade: 33.00, shop: 'Repco South Morang', stock: 8, category: 'accessory', img: 'https://unsplash.com' },
  ],
  'oil filter': [
    { id: 'c5', title: '5W-30 Full Synthetic Engine Oil 5L', brand: 'Castrol Edge', retail: 65.00, trade: 52.00, shop: 'Repco South Morang', stock: 8, category: 'oil', viscosity: '5W-30', img: 'https://unsplash.com' },
    { id: 'c6', title: 'Oil Drain Pan 8L', brand: 'Toptul', retail: 22.00, trade: 17.00, shop: 'Supercheap Auto Epping', stock: 5, category: 'accessory', img: 'https://unsplash.com' },
    { id: 'c7', title: 'Nitrile Gloves Box (100pc)', brand: 'Mechanix', retail: 24.00, trade: 18.00, shop: 'Automotive Superstore', stock: 15, category: 'accessory', img: 'https://unsplash.com' },
  ],
  'spark plugs': [
    { id: 'c8', title: 'Anti-Seize Thread Lubricant 8g', brand: 'Permatex', retail: 12.00, trade: 9.00, shop: 'Supercheap Auto Epping', stock: 12, category: 'lubricant', img: 'https://unsplash.com' },
    { id: 'c9', title: 'Dielectric Grease 7g', brand: 'Permatex', retail: 10.00, trade: 7.50, shop: 'Repco South Morang', stock: 10, category: 'lubricant', img: 'https://unsplash.com' },
  ],
  'air filter': [
    { id: 'c10', title: 'Compressed Air Duster 300ml', brand: 'Wurth', retail: 15.00, trade: 11.00, shop: 'Supercheap Auto Epping', stock: 8, category: 'cleaner', img: 'https://unsplash.com' },
  ],
};

// ─── Factory Documentation Summaries ────────────────────────────────────────
const DOCS_CATALOG = {
  'brake pads': [
    { id: 'd1', title: 'Front Brake Pad Removal & Installation', summary: 'Loosen wheel lug nuts. Jack and support vehicle. Remove caliper slide pins (14mm). Retract piston using C-clamp. Install new pads with wear sensor oriented inward. Torque slide pins to 32 Nm and bracket bolts to 105 Nm.', torqueSpecs: ['Caliper Slide Pins: 32 Nm', 'Mounting Bracket Bolts: 105 Nm', 'Wheel Lug Nuts: 103 Nm'] },
    { id: 'd2', title: 'Brake Bed-In Procedure', summary: 'Perform 10 moderate stops from 60 km/h to 20 km/h with 30-second cooling intervals. Avoid hard braking for the first 200 km to allow pad material transfer to rotor surface.', torqueSpecs: [] },
  ],
  'oil filter': [
    { id: 'd3', title: 'Engine Oil & Filter Change', summary: 'Warm engine to operating temperature. Position drain pan. Remove 24mm drain plug and drain oil. Replace drain plug with new washer, torque to 40 Nm. Remove filter with 76mm wrench. Lubricate new filter gasket with fresh oil. Hand-tighten filter. Refill with 5W-30 to spec volume.', torqueSpecs: ['Oil Filter Cap: 25 Nm', 'Oil Pan Drain Plug: 40 Nm'] },
  ],
  'spark plugs': [
    { id: 'd4', title: 'Spark Plug Replacement', summary: 'Remove ignition coils. Blow out spark plug wells with compressed air to prevent debris entry. Remove plugs with 5/8" socket. Apply anti-seize to threads. Gap to 0.043" (1.1mm). Install and torque to 18 Nm. Reconnect coils.', torqueSpecs: ['Spark Plug: 18 Nm (NGK spec)'] },
  ],
  'air filter': [
    { id: 'd5', title: 'Air Filter Element Replacement', summary: 'Open air filter housing by releasing clips or removing Phillips screws. Remove old filter element noting orientation. Clean housing interior with compressed air or damp cloth. Install new filter with airflow arrow pointing toward engine. Reinstall cover ensuring proper seal.', torqueSpecs: ['Air Filter Cover: 7 Nm (hand tight)'] },
  ],
};

export const getToolsForComponent = (component) => {
  const key = component.toLowerCase();
  let catKey = 'brake pads';
  if (key.includes('oil') || key.includes('filter')) catKey = 'oil filter';
  else if (key.includes('spark') || key.includes('plug')) catKey = 'spark plugs';
  else if (key.includes('air')) catKey = 'air filter';
  return TOOLS_CATALOG[catKey] || [];
};

export const getConsumablesForComponent = (component) => {
  const key = component.toLowerCase();
  let catKey = 'brake pads';
  if (key.includes('oil') || key.includes('filter')) catKey = 'oil filter';
  else if (key.includes('spark') || key.includes('plug')) catKey = 'spark plugs';
  else if (key.includes('air')) catKey = 'air filter';
  return CONSUMABLES_CATALOG[catKey] || [];
};

export const getDocsForComponent = (component) => {
  const key = component.toLowerCase();
  let catKey = 'brake pads';
  if (key.includes('oil') || key.includes('filter')) catKey = 'oil filter';
  else if (key.includes('spark') || key.includes('plug')) catKey = 'spark plugs';
  else if (key.includes('air')) catKey = 'air filter';
  return DOCS_CATALOG[catKey] || [];
};

// ─── B2B Trade Loyalty & Membership Integration Ledger ───────────────────────
// Known wholesale trade accounts. When parts are added from commercial
// wholesalers (Repco Trade, Burson, RockAuto), the pricing engine cross-
// references the ABN/phone/EIN against this table and auto-deducts the
// membership tier percentage discount from the parts subtotal.
export const TRADE_ACCOUNTS = [
  { id: 'repco_pro',    name: 'Repco Trade Pro',     identifier: '12 345 678 901', phone: '+61412345678', tier: 'gold',   discountPct: 0.15, stores: ['Repco South Morang', 'Repco NZ Auckland', 'Repco NZ Christchurch'] },
  { id: 'burson_trade', name: 'Burson Trade Account', identifier: '98 765 432 109', phone: '+61487654321', tier: 'silver', discountPct: 0.10, stores: ['Burson Auto Parts'] },
  { id: 'rockauto_wh',  name: 'RockAuto Wholesale',  identifier: 'US-12-3456789', phone: '+13125551234', tier: 'bronze', discountPct: 0.05, stores: ['RockAuto USA'] },
  { id: 'sparesbox_biz', name: 'Sparesbox Business',  identifier: '55 123 456 789', phone: '+61400000000', tier: 'silver', discountPct: 0.10, stores: ['Sparesbox Sydney', 'Automotive Superstore'] },
];

export const MEMBERSHIP_TIERS = {
  bronze: { label: 'Bronze',  discountPct: 0.05, color: '#CD7F32' },
  silver: { label: 'Silver',  discountPct: 0.10, color: '#C0C0C0' },
  gold:   { label: 'Gold',    discountPct: 0.15, color: '#FFD700' },
  platinum: { label: 'Platinum', discountPct: 0.20, color: '#E5E4E2' },
};

// Cross-references a corporate profile (ABN/phone/EIN) against the trade
// accounts table. Returns the matched account or null.
export const resolveTradeAccount = (profile) => {
  if (!profile) return null;
  const { abn, phone, ein } = profile;
  const cleanAbn = (abn || '').replace(/\s/g, '');
  const cleanPhone = (phone || '').replace(/\s/g, '');
  const cleanEin = (ein || '').replace(/\s/g, '');
  return TRADE_ACCOUNTS.find((a) =>
    (cleanAbn && a.identifier.replace(/\s/g, '') === cleanAbn) ||
    (cleanPhone && a.phone === cleanPhone) ||
    (cleanEin && a.identifier.replace(/\s/g, '') === cleanEin)
  ) || null;
};

// ─── Saved Job Persistence (simulated local history) ─────────────────────────
// Generates a sequential Job ID and returns a timestamped snapshot envelope.
// In a production build this would persist to Supabase; here we simulate the
// round-trip so the UI can behave identically to the real async flow.
export const persistJobProgress = async (payload) => {
  await new Promise(r => setTimeout(r, 350));
  const jobId = `JOB-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`;
  const savedAt = new Date().toISOString();
  return { ...payload, jobId, savedAt, status: 'SAVED_PROGRESS' };
};

// ─── Tax & Accounting Integration Hub (mock SBR / ledger / accountant flows) ─
// Each export emulates a secure external handshake so the UI can behave identically
// to the real async integration round-trips used in production.
export const linkAtoSbr = async () => {
  // Simulates a 2-second secure federal handshake check via myGovID.
  await new Promise(r => setTimeout(r, 2000));
  return { ok: true, status: 'ATO_SBR_CONNECTED', abn: '12 345 678 901', verifiedAt: new Date().toISOString() };
};

export const connectAccountingSoftware = async (provider) => {
  // Simulates OAuth handshake + chart-of-accounts sync to the selected ledger.
  await new Promise(r => setTimeout(r, 1600));
  return { ok: true, provider, status: 'LEDGER_CONNECTED', syncedAt: new Date().toISOString() };
};

export const inviteAccountant = async (email) => {
  // Simulates dispatching a secure read-only API access link to the accountant.
  await new Promise(r => setTimeout(r, 900));
  return { ok: true, email, status: 'INVITATION_DISPATCHED', sentAt: new Date().toISOString() };
};

// Dispatches an unpaid invoice payment-request link to the customer via SMS/email.
// In production this would fire a Stripe Payment Link / Xero invoice email.
export const dispatchInvoicePaymentRequest = async (invoice) => {
  await new Promise(r => setTimeout(r, 1100));
  const paymentLink = `https://partsforgeapp.com${invoice.invoiceNo}`;
  return {
    ok: true,
    status: 'PAYMENT_REQUEST_DISPATCHED',
    channel: 'SMS + Email',
    paymentLink,
    sentAt: new Date().toISOString(),
    invoice,
  };
};

// Simulates a Stripe-encrypted customer checkout settlement for an outstanding invoice.
// Returns a paid receipt after a 1.5s processing delay.
export const settleInvoiceViaCustomerPortal = async (invoiceNo, paymentMethod) => {
  await new Promise(r => setTimeout(r, 1500));
  return {
    ok: true,
    status: 'PAYMENT_SETTLED',
    invoiceNo,
    paymentMethod,
    receiptId: `RCPT-${Date.now()}`,
    settledAt: new Date().toISOString(),
  };
};

// Simulates a secure Open Banking CDR (Consumer Data Right) bank feed connection.
// Returns the connected bank name and masked account number after a 2s handshake.
export const connectOpenBankingFeed = async () => {
  await new Promise(r => setTimeout(r, 2000));
  return {
    ok: true,
    status: 'OPEN_BANKING_CONNECTED',
    bankName: 'CommBank Biz',
    accountLast4: '4820',
    bsb: '062-000',
    connectedAt: new Date().toISOString(),
  };
};

// Simulates an inbound OSKO/EFT customer deposit landing in the bank feed,
// matching the exact grand total of a specific outstanding invoice by reference ID.
export const simulateInboundDeposit = async (invoice) => {
  await new Promise(r => setTimeout(r, 1500));
  return {
    ok: true,
    status: 'DEPOSIT_MATCHED',
    invoiceNo: invoice.invoiceNo,
    amount: invoice.grandTotal,
    channel: 'OSKO/EFT',
    reference: invoice.invoiceNo,
    depositedAt: new Date().toISOString(),
  };
};

// 🚚 UBER DIRECT LIVE COURIER FREIGHT ESTIMATION ENGINE (v1.0.1)
// Simulates the Uber Direct OAuth2 client-credentials handshake + delivery quote
// round-trip. Mirrors the real response shape so the UI behaves identically to a
// production integration without requiring live credentials or network access.
export const createLiveCourierQuote = async (storeLocation, workshopLocation) => {
  // 1) Secure background token authorization (client_credentials grant)
  await new Promise(r => setTimeout(r, 900));
  const token = `uber_token_${Date.now()}`;
  const customerId = 'partsforge_vendor_1';

  // 2) Build the delivery quote payload (mirrors Uber Direct API schema)
  const quotePayload = {
    pickup_address: JSON.stringify({
      street_address: [storeLocation.street],
      city: storeLocation.city,
      state: storeLocation.state,
      zip_code: storeLocation.postcode,
      country: 'AU',
    }),
    dropoff_address: JSON.stringify({
      street_address: [workshopLocation.street],
      city: workshopLocation.city,
      state: workshopLocation.state,
      zip_code: workshopLocation.postcode,
      country: 'AU',
    }),
    pickup_latitude: parseFloat(storeLocation.lat),
    pickup_longitude: parseFloat(storeLocation.lng),
    dropoff_latitude: parseFloat(workshopLocation.lat),
    dropoff_longitude: parseFloat(workshopLocation.lng),
    pickup_phone_number: storeLocation.phone || '+61412345678',
    dropoff_phone_number: workshopLocation.phone || '+61412345678',
    manifest_total_value: Math.round((workshopLocation.cartValueCents || 5000)),
    external_store_id: storeLocation.id || 'partsforge_vendor_1',
  };

  // 3) Request the delivery quote (simulated 700ms network latency)
  await new Promise(r => setTimeout(r, 700));

  // Haversine distance between pickup and dropoff
  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const distanceKm = haversine(
    quotePayload.pickup_latitude, quotePayload.pickup_longitude,
    quotePayload.dropoff_latitude, quotePayload.dropoff_longitude
  );

  // Uber Direct pricing model: base fee + per-km rate + booking fee
  const BASE_FEE = 5.00;
  const PER_KM = 1.45;
  const BOOKING_FEE = 2.50;
  const quoteFee = +(BASE_FEE + (distanceKm * PER_KM) + BOOKING_FEE).toFixed(2);
  const etaMinutes = Math.max(15, Math.round(distanceKm * 2.5) + 15);

  return {
    ok: true,
    status: 'UBER_DIRECT_QUOTE_SYNCED',
    quoteId: `UBR-${Date.now()}`,
    customerId,
    token: `${token.slice(0, 12)}…`,
    payload: quotePayload,
    quote: {
      currency: 'AUD',
      fee: quoteFee,
      distance_km: +distanceKm.toFixed(2),
      eta_minutes: etaMinutes,
      service: 'Uber Direct',
    },
    syncedAt: new Date().toISOString(),
  };
};

// Streams a finalized, paid invoice record directly into the connected accounting
// ledger so the workshop's chart of accounts stays balanced without manual export.
// Platform logistics markup applied on top of raw Uber Direct courier quotes.
// Covers PartsForge routing overhead, insurance, and driver re-dispatch margin.
export const PLATFORM_LOGISTICS_MARKUP = 1.15; // +15% on top of raw Uber Direct fee

// ─── Stripe Connect Split Payouts Engine ──────────────────────────────────
// Simulates checkout.session.completed firing → backend routing loop using
// STRIPE_SECRET_KEY to split the single transaction total into individual
// vendor transfer payouts. Mirrors the real Stripe Connect Express account flow.
export const executeStripeSplitPayouts = async (cart, grandTotal) => {
  try {
    console.log("📡 Rerouting split financial intents via Vercel secure edge...");

    // 1) Compile cart descriptions into a clean reference string
    const summary = Array.isArray(cart) 
      ? cart.map(item => `${item.qty || 1}x ${item.item || item.part || 'Item'}`).join(', ')
      : 'PartsForge Split Trade Order';

    // 2) Call your secure Vercel API backend route to use your STRIPE_SECRET_KEY safely
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount: grandTotal, 
        description: summary.substring(0, 500)
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Vercel backend proxy rejected handshake');
    }

    console.log("✅ Secure Payment Intent Initialised:", data.clientSecret);

    // 3) Group cart items by vendor seller to compute each payout share (Original App Logic)
    const vendorTotals = new Map();
    cart.forEach((c) => {
      const lineTotal = c.unitPrice * c.qty;
      vendorTotals.set(c.seller, (vendorTotals.get(c.seller) || 0) + lineTotal);
    });

    // 4) Build per-vendor Stripe Connect transfer objects (Original App Logic)
    const transfers = Array.from(vendorTotals.entries()).map(([seller, amount], i) => ({
      transferId: `tr_${Date.now()}_${i}`,
      destinationAccount: `acct_${seller.replace(/\s+/g, '').toLowerCase().slice(0, 12)}`,
      seller,
      amount: +amount.toFixed(2),
      currency: 'aud',
      status: 'TRANSFERRED',
      settledAt: new Date().toISOString(),
    }));

    // 5) Return the exact response structure your dashboard expects
    return {
      ok: true,
      status: 'STRIPE_SPLIT_PAYOUTS_COMPLETED',
      sessionId: data.clientSecret || `cs_live_${Date.now()}`,
      grandTotal: +grandTotal.toFixed(2),
      vendorCount: transfers.length,
      transfers,
      syncedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error("❌ Production Stripe Connection Failed:", error.message);
    // Graceful fallback response structure to prevent UI layout lockups
    return { 
      ok: false, 
      status: 'STRIPE_SPLIT_PAYOUTS_FAILED',
      error: error.message 
    };
  }
};

// ─── Uber Direct Multi-Store Driver Dispatch Engine ─────────────────────────
// Simulates firing independent driver dispatch signals to Uber Direct for each
// distinct store location using the unified UBER_DIRECT_CUSTOMER_ID account.
export const dispatchUberDirectDrivers = async (sellerLegs, workshopLocation) => {
  // 1) Simulate Uber Direct OAuth2 token refresh
  await new Promise(r => setTimeout(r, 600));
  const token = `uber_direct_token_${Date.now()}`;
  const customerId = 'partsforge_unified_account';

  // 2) Fire independent dispatch requests per store leg
  const dispatches = await Promise.all(sellerLegs.map(async (leg, i) => {
    await new Promise(r => setTimeout(r, 400 + i * 200));
    return {
      dispatchId: `uber_disp_${Date.now()}_${i}`,
      customerId,
      token: `${token.slice(0, 14)}…`,
      pickupStore: leg.seller,
      pickupLat: leg.lat,
      pickupLon: leg.lon,
      dropoffLat: workshopLocation.lat,
      dropoffLon: workshopLocation.lon,
      manifestItems: leg.items.length,
      status: 'DRIVER_DISPATCHED',
      etaMinutes: Math.max(15, Math.round((leg.distanceKm || 10) * 2.5) + 15),
      dispatchedAt: new Date().toISOString(),
    };
  }));

  return {
    ok: true,
    status: 'UBER_DIRECT_DRIVERS_DISPATCHED',
    dispatchCount: dispatches.length,
    dispatches,
    syncedAt: new Date().toISOString(),
  };
};

// ─── Multi-Supplier Freight Consolidation Hub Dispatch Engine ────────────────
// Simulates the two-tier consolidation flow:
//   Tier A: Each seller hot-shots individual parcels to the regional hub node.
//   Tier B: Hub aggregates all parcels into ONE manifest, single driver to workshop.
export const dispatchConsolidatedFreight = async (cart, hubNode, workshopLocation) => {
  // Tier A — sellers dispatch to hub
  await new Promise(r => setTimeout(r, 500));
  const sellers = [...new Set(cart.map(c => c.shop || c.loc || c.seller || 'Unknown'))];
  const tierALegs = await Promise.all(sellers.map(async (seller, i) => {
    await new Promise(r => setTimeout(r, 300 + i * 150));
    const items = cart.filter(c => (c.shop || c.loc || c.seller || 'Unknown') === seller);
    return {
      legId: `hub_inbound_${Date.now()}_${i}`,
      seller,
      itemCount: items.length,
      status: 'PARCEL_RECEIVED_AT_HUB',
      arrivedAt: new Date().toISOString(),
    };
  }));

  // Tier B — hub consolidates into single manifest, dispatches one driver
  await new Promise(r => setTimeout(r, 700));
  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  const hubToWorkshopKm = haversine(hubNode.lat, hubNode.lng, workshopLocation.lat, workshopLocation.lng);
  const tierBLeg = {
    manifestId: `MANIFEST-${Date.now()}`,
    parcelCount: cart.length,
    sellerCount: sellers.length,
    hubName: hubNode.name,
    distanceKm: +hubToWorkshopKm.toFixed(2),
    status: 'CONSOLIDATED_DISPATCHED',
    etaMinutes: Math.max(30, Math.round(hubToWorkshopKm * 2.5) + 30),
    dispatchedAt: new Date().toISOString(),
  };

  return {
    ok: true,
    status: 'CONSOLIDATED_FREIGHT_DISPATCHED',
    tierA: { legs: tierALegs, count: tierALegs.length },
    tierB: tierBLeg,
    syncedAt: new Date().toISOString(),
  };
};

export const streamInvoiceToLedger = async (invoice) => {
  await new Promise(r => setTimeout(r, 1200));
  return {
    ok: true,
    status: 'LEDGER_ENTRY_BALANCED',
    ledger: 'Xero',
    entryId: `XRO-${Math.floor(100000 + Math.random() * 900000)}`,
    syncedAt: new Date().toISOString(),
    invoice,
  };
};

// ─── Workshop Business Identity (embedded on compiled tax invoices) ──────────
export const WORKSHOP_BUSINESS = {
  legalName: 'ForgedParts Pty Ltd',
  tradingAs: 'PartsForge Network Workshop',
  abn: '12 345 678 901',
  acn: '123 456 789',
  address: '45 Workshop Rd, Sydney NSW 2000',
  phone: '+61 2 9876 5432',
  email: 'accounts@partsforge.io',
  gstRegistered: true,
};

// ─── Professional Invoice Compiler ──────────────────────────────────────────
// Compiles a professional customer tax invoice embedding the mechanic's ABN,
// business details, itemised BOM, labor, and a secure embedded payment link.
export const compileCustomerInvoice = (jobData, taxRate = TAX_RATE) => {
  const invoiceNo = `INV-2026-${String(Math.floor(10000 + Math.random() * 90000))}`;
  const invoiceDate = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  const paymentLink = `https://partsforge.pay/${invoiceNo}`;

  const partsTotal = (jobData.cart || []).reduce((s, c) => s + c.unitPrice * c.qty, 0);
  const laborTotal = (jobData.laborHours || 0) * (jobData.laborRate || 0);
  // Courier freight is reclassified as workshop consumables — never shown as shipping
  const consumables = jobData.consumables || 0;
  // Shipping/freight is absorbed as a workshop operating expense — never charged to customer
  const subtotal = partsTotal + laborTotal;
  const gst = jobData.taxOn ? subtotal * taxRate : 0;
  const grandTotal = subtotal + gst;

  return {
    invoiceNo,
    date: invoiceDate,
    business: WORKSHOP_BUSINESS,
    customer: jobData.custName || '—',
    customerEmail: jobData.custEmail || '—',
    customerPhone: jobData.custPhone || '—',
    vehicle: jobData.vehicle ? `${jobData.vehicle.make || ''} ${jobData.vehicle.model || ''}`.trim() || '—' : '—',
    vehicleRego: jobData.vehicle?.rego || '—',
    parts: (jobData.cart || []).map((c) => `${c.brand ? c.brand + ' ' : ''}${c.title}`).join(', '),
    bom: (jobData.cart || []).map((c) => ({
      label: `${c.brand ? c.brand + ' ' : ''}${c.title}`,
      qty: c.qty,
      unit: c.unitPrice,
      total: c.unitPrice * c.qty,
    })),
    laborHours: jobData.laborHours || 0,
    laborRate: jobData.laborRate || 0,
    laborTotal,
    partsTotal,
    // freightTotal stores the consumables amount internally — never displayed as "freight"
    freightTotal: consumables,
    gst,
    grandTotal,
    paymentStatus: 'UNPAID',
    isSyncedToAccounting: false,
    paymentLink,
    compiledAt: new Date().toISOString(),
  };
};

// ─── Autonomous Basiq Bank Reconciliation Feed ──────────────────────────────
// Background event listener that monitors incoming bank data streams via
// BASIQ_API_KEY. Parses statement text for Invoice Number + cross-references
// the exact dollar amount. When both match, the invoice status flips to PAID.
export const startBasiqBankFeedListener = (invoices, onMatch) => {
  // Simulates connecting to the Basiq open-banking stream
  const listenerId = `basiq_${Date.now()}`;
  let polling = true;

  const checkFeed = async () => {
    if (!polling) return;
    // Find any UNPAID invoice to simulate an inbound deposit match
    const unpaid = invoices.find((inv) => inv.paymentStatus !== 'PAID');
    if (unpaid) {
      await new Promise((r) => setTimeout(r, 2000));
      if (!polling) return;
      // Parse the statement description for the invoice number
      const statementDesc = `OSKO INBOUND · INV REF: ${unpaid.invoiceNo}`;
      const parsedInvoiceNo = statementDesc.match(/INV-\d{4}-\d{5}/)?.[0];
      const parsedAmount = unpaid.grandTotal;
      // Cross-reference both parameters
      if (parsedInvoiceNo === unpaid.invoiceNo && parsedAmount === unpaid.grandTotal) {
        onMatch({
          ok: true,
          status: 'BASIQ_DEPOSIT_MATCHED',
          invoiceNo: parsedInvoiceNo,
          amount: parsedAmount,
          channel: 'OSKO',
          reference: parsedInvoiceNo,
          statementDesc,
          matchedAt: new Date().toISOString(),
        });
      }
    }
  };

  // Start polling after initial delay
  setTimeout(checkFeed, 3000);

  return {
    listenerId,
    stop: () => { polling = false; },
  };
};

// ─── Instant Xero / Accountant Sync Webhook ─────────────────────────────────
// Triggered the instant a bank feed matches a payment. Uploads the finalized
// paid invoice ledger summary to Xero/MYOB, or emails the tax data sheet to
// the linked accountant. Uses XERO_CLIENT_SECRET for authentication.
export const triggerXeroAccountantSync = async (invoice, accountantEmail) => {
  // 1) Xero OAuth2 client-credentials handshake using XERO_CLIENT_SECRET
  await new Promise((r) => setTimeout(r, 900));
  const xeroToken = `xero_token_${Date.now().slice(-8)}`;

  // 2) Upload the finalized invoice ledger summary to Xero chart of accounts
  const ledgerEntry = {
    entryId: `XRO-${Math.floor(100000 + Math.random() * 900000)}`,
    invoiceNo: invoice.invoiceNo,
    grandTotal: invoice.grandTotal,
    gst: invoice.gst,
    accountCode: '400-SALES',
    status: 'POSTED',
    postedAt: new Date().toISOString(),
  };

  // 3) If accountant email is linked, dispatch the tax data sheet
  let accountantDispatch = null;
  if (accountantEmail) {
    await new Promise((r) => setTimeout(r, 600));
    accountantDispatch = {
      email: accountantEmail,
      status: 'TAX_DATA_SHEET_DISPATCHED',
      sentAt: new Date().toISOString(),
    };
  }

  return {
    ok: true,
    status: 'XERO_ACCOUNTANT_SYNC_COMPLETE',
    xeroToken: `${xeroToken.slice(0, 12)}…`,
    ledgerEntry,
    accountantDispatch,
    syncedAt: new Date().toISOString(),
  };
};
