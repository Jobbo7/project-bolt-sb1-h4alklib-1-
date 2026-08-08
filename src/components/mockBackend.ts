export interface MockPart {
  id: string;
  title: string;
  brand: string;
  price: number;
  distance: string;
  eta: string;
  rating: number;
  seller: string;
  url?: string;
  imageUrl: string;
  lat: number;
  lng: number;
}

export interface MockTutorial {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
}

export interface MockTorqueSpec {
  label: string;
  value: string;
}

export interface MockSearchResult {
  localParts: MockPart[];
  nationalParts: MockPart[];
  facebookParts: MockPart[];
  youtubeTutorials: MockTutorial[];
  torqueSpecs: MockTorqueSpec[];
  torqueTitle: string;
}

export interface MockVehicle {
  make: string;
  model: string;
  year: number;
  engine: string;
  fuel: string;
  drivetrain: string;
}

export interface MockRegoResult {
  plate: string;
  state: string;
  vehicle: MockVehicle;
}

export interface MockPhotoResult {
  component: string;
  confidence: number;
  searchQuery: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
}

const DATASETS: Record<string, MockSearchResult> = {
  'brake pads': {
    localParts: [
      { id: 'l1', title: 'Front Brake Pad Set', brand: 'Bosch', price: 64.99, distance: '3.4 km', eta: '45 mins', rating: 4.8, seller: 'AutoZone Midtown', imageUrl: 'https://images.pexels.com/photos/4489702/pexels-photo-4489702.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.8136, lng: 144.9631 },
      { id: 'l2', title: 'OEM Brake Rotor (LH)', brand: 'Toyota', price: 89.0, distance: '5.1 km', eta: '45 mins', rating: 4.9, seller: 'PartsPlus', imageUrl: 'https://images.pexels.com/photos/4489712/pexels-photo-4489712.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.823, lng: 144.998 },
      { id: 'l3', title: 'Brake Caliper Assembly', brand: 'Akebono', price: 142.5, distance: '7.8 km', eta: '50 mins', rating: 4.7, seller: 'Hilux Spares', imageUrl: 'https://images.pexels.com/photos/4480205/pexels-photo-4480205.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.767, lng: 144.962 },
    ],
    nationalParts: [
      { id: 'n1', title: 'Brake Master Cylinder', brand: 'Denso', price: 178.99, distance: '12 km', eta: '2-3 days', rating: 4.6, seller: 'RockAuto', imageUrl: 'https://images.pexels.com/photos/4480134/pexels-photo-4480134.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -33.8688, lng: 151.2093 },
      { id: 'n2', title: 'Brake Fluid DOT 4 (1L)', brand: 'Castrol', price: 18.5, distance: '—', eta: '2-3 days', rating: 4.9, seller: 'eEuroparts', imageUrl: 'https://images.pexels.com/photos/4480705/pexels-photo-4480705.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -27.4698, lng: 153.0251 },
      { id: 'n3', title: 'Flex Brake Hose Kit', brand: 'TRW', price: 34.99, distance: '—', eta: '2-3 days', rating: 4.5, seller: 'AutoPartsWay', imageUrl: 'https://images.pexels.com/photos/4480509/pexels-photo-4480509.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -31.9522, lng: 115.8589 },
    ],
    facebookParts: [
      { id: 'f1', title: 'Used Hilux Front Axle', brand: 'OEM', price: 220.0, distance: '1.2 km', eta: 'Contact', rating: 4.2, seller: 'Mike S.', url: 'https://www.facebook.com/marketplace/item/1001', imageUrl: 'https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.803, lng: 144.965 },
      { id: 'f2', title: 'Rear Brake Drums (pair)', brand: 'Toyota', price: 60.0, distance: '4.0 km', eta: 'Contact', rating: 4.0, seller: 'Jen R.', url: 'https://www.facebook.com/marketplace/item/1002', imageUrl: 'https://images.pexels.com/photos/4480479/pexels-photo-4480479.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.79, lng: 144.979 },
    ],
    youtubeTutorials: [
      { videoId: 'dQw4w9WgXcQ', title: '2015 Hilux 3.0L Front Brake Pad Replacement', channel: 'AutoFix DIY', thumbnail: 'https://images.pexels.com/photos/4489702/pexels-photo-4489702.jpeg?auto=compress&cs=tinysrgb&w=640', duration: '12:34' },
      { videoId: 'abc2', title: 'Hilux Brake Rotor Swap — Step by Step', channel: 'Wrenching with Sam', thumbnail: 'https://images.pexels.com/photos/4489712/pexels-photo-4489712.jpeg?auto=compress&cs=tinysrgb&w=640', duration: '08:12' },
    ],
    torqueTitle: '2015 Hilux 3.0L — Front Brake Pad Replacement',
    torqueSpecs: [
      { label: 'Caliper bracket bolts', value: '88 Nm (65 lb-ft)' },
      { label: 'Caliper guide pins', value: '34 Nm (25 lb-ft)' },
      { label: 'Wheel lug nuts', value: '103 Nm (76 lb-ft)' },
    ],
  },

  'oil filter': {
    localParts: [
      { id: 'l1', title: 'OEM Oil Filter', brand: 'Toyota', price: 12.99, distance: '2.1 km', eta: '45 mins', rating: 4.9, seller: 'AutoZone Midtown', imageUrl: 'https://images.pexels.com/photos/4489722/pexels-photo-4489722.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.8136, lng: 144.9631 },
      { id: 'l2', title: 'Synthetic Oil 5W-30 (4L)', brand: 'Mobil 1', price: 38.5, distance: '3.0 km', eta: '45 mins', rating: 4.8, seller: 'PartsPlus', imageUrl: 'https://images.pexels.com/photos/4480705/pexels-photo-4480705.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.823, lng: 144.998 },
      { id: 'l3', title: 'Oil Drain Plug Washer', brand: 'Toyota', price: 2.5, distance: '4.5 km', eta: '45 mins', rating: 4.7, seller: 'Hilux Spares', imageUrl: 'https://images.pexels.com/photos/4480479/pexels-photo-4480479.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.767, lng: 144.962 },
    ],
    nationalParts: [
      { id: 'n1', title: 'Oil Filter Wrench (74mm)', brand: 'Lisle', price: 14.99, distance: '—', eta: '2-3 days', rating: 4.5, seller: 'RockAuto', imageUrl: 'https://images.pexels.com/photos/4480509/pexels-photo-4480509.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -33.8688, lng: 151.2093 },
      { id: 'n2', title: 'Engine Oil Flush Kit', brand: 'Liqui Moly', price: 22.0, distance: '—', eta: '2-3 days', rating: 4.6, seller: 'eEuroparts', imageUrl: 'https://images.pexels.com/photos/4480134/pexels-photo-4480134.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -27.4698, lng: 153.0251 },
    ],
    facebookParts: [
      { id: 'f1', title: 'Bulk Oil Filters (5-pack)', brand: 'Toyota', price: 35.0, distance: '2.8 km', eta: 'Contact', rating: 4.1, seller: 'Dave K.', url: 'https://www.facebook.com/marketplace/item/2001', imageUrl: 'https://images.pexels.com/photos/4489722/pexels-photo-4489722.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.767, lng: 144.962 },
      { id: 'f2', title: 'Used Oil Drain Pan', brand: 'Generic', price: 8.0, distance: '5.2 km', eta: 'Contact', rating: 3.9, seller: 'Lisa M.', url: 'https://www.facebook.com/marketplace/item/2002', imageUrl: 'https://images.pexels.com/photos/4480479/pexels-photo-4480479.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.82, lng: 144.967 },
    ],
    youtubeTutorials: [
      { videoId: 'oil1', title: '2015 Hilux 3.0L Oil & Filter Change', channel: 'AutoFix DIY', thumbnail: 'https://images.pexels.com/photos/4489722/pexels-photo-4489722.jpeg?auto=compress&cs=tinysrgb&w=640', duration: '09:48' },
      { videoId: 'oil2', title: 'Hilux Diesel Oil Change — The Right Way', channel: 'Wrenching with Sam', thumbnail: 'https://images.pexels.com/photos/4489732/pexels-photo-4489732.jpeg?auto=compress&cs=tinysrgb&w=640', duration: '11:02' },
    ],
    torqueTitle: '2015 Hilux 3.0L — Oil & Filter Change',
    torqueSpecs: [
      { label: 'Oil drain plug', value: '40 Nm (30 lb-ft)' },
      { label: 'Oil filter (canister)', value: '25 Nm (18 lb-ft)' },
      { label: 'Oil capacity', value: '6.7 L (7.1 qt)' },
    ],
  },

  alternator: {
    localParts: [
      { id: 'l1', title: 'Reman Alternator 120A', brand: 'Denso', price: 189.0, distance: '3.4 km', eta: '45 mins', rating: 4.8, seller: 'AutoZone Midtown', imageUrl: 'https://images.pexels.com/photos/4480134/pexels-photo-4480134.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.8136, lng: 144.9631 },
      { id: 'l2', title: 'Voltage Regulator (OEM)', brand: 'Toyota', price: 74.5, distance: '5.1 km', eta: '45 mins', rating: 4.9, seller: 'PartsPlus', imageUrl: 'https://images.pexels.com/photos/4480205/pexels-photo-4480205.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.823, lng: 144.998 },
      { id: 'l3', title: 'Alternator Belt Drive', brand: 'Gates', price: 28.99, distance: '7.8 km', eta: '50 mins', rating: 4.7, seller: 'Hilux Spares', imageUrl: 'https://images.pexels.com/photos/4480509/pexels-photo-4480509.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.767, lng: 144.962 },
    ],
    nationalParts: [
      { id: 'n1', title: 'New Alternator 150A Upgrade', brand: 'Bosch', price: 312.0, distance: '—', eta: '2-3 days', rating: 4.7, seller: 'RockAuto', imageUrl: 'https://images.pexels.com/photos/4480134/pexels-photo-4480134.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -33.8688, lng: 151.2093 },
      { id: 'n2', title: 'Battery Terminal Kit', brand: 'TruckPro', price: 16.5, distance: '—', eta: '2-3 days', rating: 4.6, seller: 'eEuroparts', imageUrl: 'https://images.pexels.com/photos/4480705/pexels-photo-4480705.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -27.4698, lng: 153.0251 },
    ],
    facebookParts: [
      { id: 'f1', title: 'Used Hilux Alternator', brand: 'OEM', price: 95.0, distance: '1.2 km', eta: 'Contact', rating: 4.2, seller: 'Mike S.', url: 'https://www.facebook.com/marketplace/item/4001', imageUrl: 'https://images.pexels.com/photos/4480134/pexels-photo-4480134.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.803, lng: 144.965 },
    ],
    youtubeTutorials: [
      { videoId: 'alt1', title: '2015 Hilux 3.0L Alternator Replacement', channel: 'AutoFix DIY', thumbnail: 'https://images.pexels.com/photos/4480134/pexels-photo-4480134.jpeg?auto=compress&cs=tinysrgb&w=640', duration: '15:42' },
      { videoId: 'alt2', title: 'Testing Alternator Output — Diesel Hilux', channel: 'Wrenching with Sam', thumbnail: 'https://images.pexels.com/photos/4480205/pexels-photo-4480205.jpeg?auto=compress&cs=tinysrgb&w=640', duration: '07:58' },
    ],
    torqueTitle: '2015 Hilux 3.0L — Alternator Replacement',
    torqueSpecs: [
      { label: 'Alternator mounting bolts', value: '44 Nm (33 lb-ft)' },
      { label: 'Adjuster lock nut', value: '19 Nm (14 lb-ft)' },
      { label: 'Battery terminal (B+)', value: '10 Nm (7 lb-ft)' },
    ],
  },
};

const FALLBACK: MockSearchResult = {
  localParts: [
    { id: 'l1', title: 'Universal Wrench Set', brand: 'Stanley', price: 29.99, distance: '3.0 km', eta: '45 mins', rating: 4.5, seller: 'AutoZone Midtown', imageUrl: 'https://images.pexels.com/photos/4480205/pexels-photo-4480205.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.8136, lng: 144.9631 },
  ],
  nationalParts: [
    { id: 'n1', title: 'Mechanic Gloves (L)', brand: 'Mechanix', price: 24.99, distance: '—', eta: '2-3 days', rating: 4.7, seller: 'RockAuto', imageUrl: 'https://images.pexels.com/photos/4480134/pexels-photo-4480134.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -33.8688, lng: 151.2093 },
  ],
  facebookParts: [
    { id: 'f1', title: 'Assorted Hardware Bin', brand: 'Generic', price: 15.0, distance: '6.0 km', eta: 'Contact', rating: 4.0, seller: 'Tom B.', url: 'https://www.facebook.com/marketplace/item/3001', imageUrl: 'https://images.pexels.com/photos/4480479/pexels-photo-4480479.jpeg?auto=compress&cs=tinysrgb&w=400', lat: -37.867, lng: 144.974 },
  ],
  youtubeTutorials: [
    { videoId: 'gen1', title: '2015 Hilux General Maintenance', channel: 'AutoFix DIY', thumbnail: 'https://images.pexels.com/photos/4489702/pexels-photo-4489702.jpeg?auto=compress&cs=tinysrgb&w=640', duration: '14:20' },
  ],
  torqueTitle: '2015 Hilux 3.0L — General Service',
  torqueSpecs: [
    { label: 'Wheel lug nuts', value: '103 Nm (76 lb-ft)' },
    { label: 'Oil drain plug', value: '40 Nm (30 lb-ft)' },
  ],
};

/**
 * Haversine formula — straight-line distance between two GPS points, in km.
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const GEOCODE_POINTS: { match: string; lat: number; lng: number; label: string }[] = [
  { match: 'sydney', lat: -33.8688, lng: 151.2093, label: 'Sydney NSW' },
  { match: 'brisbane', lat: -27.4698, lng: 153.0251, label: 'Brisbane QLD' },
  { match: 'perth', lat: -31.9522, lng: 115.8589, label: 'Perth WA' },
  { match: 'adelaide', lat: -34.9285, lng: 138.6007, label: 'Adelaide SA' },
  { match: 'hobart', lat: -42.8821, lng: 147.3272, label: 'Hobart TAS' },
  { match: 'canberra', lat: -35.2809, lng: 149.13, label: 'Canberra ACT' },
  { match: 'darwin', lat: -12.4634, lng: 130.8456, label: 'Darwin NT' },
  { match: 'richmond', lat: -37.823, lng: 144.998, label: 'Richmond VIC' },
  { match: 'dandenong', lat: -37.99, lng: 145.21, label: 'Dandenong VIC' },
  { match: 'brunswick', lat: -37.767, lng: 144.962, label: 'Brunswick VIC' },
  { match: 'carlton', lat: -37.803, lng: 144.965, label: 'Carlton VIC' },
  { match: 'fitzroy', lat: -37.79, lng: 144.979, label: 'Fitzroy VIC' },
  { match: 'southbank', lat: -37.82, lng: 144.967, label: 'Southbank VIC' },
  { match: 'st kilda', lat: -37.867, lng: 144.974, label: 'St Kilda VIC' },
  { match: 'flinders', lat: -37.8174, lng: 144.9673, label: 'Flinders St, Melbourne VIC' },
  { match: 'melbourne', lat: -37.8136, lng: 144.9631, label: 'Melbourne VIC' },
];

/**
 * Simulates geocoding a street address to GPS coordinates.
 * Recognises Australian city/suburb keywords; falls back to Melbourne CBD.
 */
export function simulateGeocode(address: string): Promise<GeocodeResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const key = address.trim().toLowerCase();
      const hit = GEOCODE_POINTS.find((p) => key.includes(p.match));
      resolve(
        hit
          ? { lat: hit.lat, lng: hit.lng, label: hit.label }
          : { lat: -37.8136, lng: 144.9631, label: 'Melbourne VIC' },
      );
    }, 600);
  });
}

/**
 * Simulates a network request to the parts search endpoint.
 * Returns parts, YouTube tutorials, and torque specs matching the query.
 * Simulates a 500ms network delay.
 */
export function simulateSearchEndpoint(query: string): Promise<MockSearchResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const key = query.trim().toLowerCase();
      resolve(DATASETS[key] ?? FALLBACK);
    }, 500);
  });
}

/**
 * Simulates a registration plate lookup.
 * Any plate + state combination resolves to the demo Hilux after 1.5s.
 */
export function simulateRegoLookup(plate: string, state: string): Promise<MockRegoResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        plate: plate.toUpperCase(),
        state,
        vehicle: {
          make: 'Toyota',
          model: 'Hilux',
          year: 2015,
          engine: '3.0L D-4D',
          fuel: 'Diesel',
          drivetrain: '4×4',
        },
      });
    }, 1500);
  });
}

/**
 * Simulates an AI photo-recognition scan of an engine bay component.
 * Always detects "Alternator" with 94% confidence after 2s.
 */
export function simulatePhotoScan(): Promise<MockPhotoResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        component: 'Alternator',
        confidence: 94,
        searchQuery: 'alternator',
      });
    }, 2000);
  });
}
