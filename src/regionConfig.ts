export type RegionCode = 'AU' | 'UK' | 'US';

export interface USState {
  code: string;
  label: string;
  salesTaxRate: number;
}

export interface RegionConfig {
  code: RegionCode;
  label: string;
  country: string;
  currencySymbol: string;
  currencyCode: string;
  locale: string;
  taxLabel: string;
  taxRate: number;
  taxIsFlat: boolean;
  corpCodeLabel: string;
  corpCodePlaceholder: string;
  bankProvider: {
    name: string;
    label: string;
    description: string;
  };
  shardNode: {
    name: string;
    location: string;
    compliance: string;
  };
  courierNetworks: CourierNetwork[];
  consolidationHub: {
    name: string;
    city: string;
    lat: number;
    lng: number;
    handlingFee: number;
  };
  usStates?: USState[];
}

export interface CourierNetwork {
  id: string;
  name: string;
  api: string;
  tagline: string;
  baseFee: number;
  perKmRate: number;
  bookingFee: number;
  etaMinutes: number;
  maxKm: number;
  icon: string;
}

export const US_STATES: USState[] = [
  { code: 'CA', label: 'California', salesTaxRate: 0.0725 },
  { code: 'TX', label: 'Texas', salesTaxRate: 0.0625 },
  { code: 'NY', label: 'New York', salesTaxRate: 0.08 },
  { code: 'FL', label: 'Florida', salesTaxRate: 0.06 },
  { code: 'WA', label: 'Washington', salesTaxRate: 0.065 },
  { code: 'OR', label: 'Oregon', salesTaxRate: 0.0 },
  { code: 'IL', label: 'Illinois', salesTaxRate: 0.0625 },
  { code: 'PA', label: 'Pennsylvania', salesTaxRate: 0.06 },
  { code: 'OH', label: 'Ohio', salesTaxRate: 0.0575 },
  { code: 'GA', label: 'Georgia', salesTaxRate: 0.04 },
  { code: 'NC', label: 'North Carolina', salesTaxRate: 0.0475 },
  { code: 'MI', label: 'Michigan', salesTaxRate: 0.06 },
];

export const REGIONS: Record<RegionCode, RegionConfig> = {
  AU: {
    code: 'AU',
    label: 'Australia (AUD)',
    country: 'Australia',
    currencySymbol: 'A$',
    currencyCode: 'AUD',
    locale: 'en-AU',
    taxLabel: 'GST',
    taxRate: 0.10,
    taxIsFlat: true,
    corpCodeLabel: 'ABN/ACN',
    corpCodePlaceholder: '12 345 678 901',
    bankProvider: {
      name: 'Basiq',
      label: 'Basiq API Core v2 App Wrapper',
      description: 'Consumer Data Right (CDR) compliant open banking. Routes bank feed data via Basiq\'s consolidated API core.',
    },
    shardNode: {
      name: 'APAC SHARD NODE',
      location: 'Sydney Center',
      compliance: 'ACCC CDR Framework · Privacy Act 1988',
    },
    courierNetworks: [
      { id: 'uber_direct', name: 'Uber Direct', api: 'Uber Direct Developer API', tagline: 'Sub-15min local trade hot-shots', baseFee: 5.00, perKmRate: 1.45, bookingFee: 2.50, etaMinutes: 15, maxKm: 50, icon: 'zap' },
      { id: 'sherpa', name: 'Sherpa / DriveYello', api: 'Sherpa Fleet Nodes API', tagline: 'Regional workshop drops', baseFee: 4.50, perKmRate: 1.20, bookingFee: 2.00, etaMinutes: 30, maxKm: 120, icon: 'truck' },
    ],
    consolidationHub: {
      name: 'PartsForge APAC Consolidation Hub',
      city: 'Sydney NSW',
      lat: -33.8688,
      lng: 151.2093,
      handlingFee: 8.50,
    },
  },
  UK: {
    code: 'UK',
    label: 'United Kingdom (GBP)',
    country: 'United Kingdom',
    currencySymbol: '£',
    currencyCode: 'GBP',
    locale: 'en-GB',
    taxLabel: 'VAT',
    taxRate: 0.20,
    taxIsFlat: true,
    corpCodeLabel: 'UK Company House Reg / VAT Number',
    corpCodePlaceholder: 'GB123456789',
    bankProvider: {
      name: 'Tink',
      label: 'Tink API Open Banking Framework Network',
      description: 'PSD2 / Open Banking compliant. Enforces strict GDPR privacy data encryption loops, blocking cross-border data leakage.',
    },
    shardNode: {
      name: 'EMEA SHARD NODE',
      location: 'London / Frankfurt Center',
      compliance: 'GDPR · PSD2 · UK Open Banking Standard',
    },
    courierNetworks: [
      { id: 'gophr', name: 'Gophr', api: 'Gophr API Network', tagline: 'Rapid localized trade transit', baseFee: 3.50, perKmRate: 0.95, bookingFee: 1.80, etaMinutes: 20, maxKm: 40, icon: 'bike' },
      { id: 'stuart', name: 'Stuart Delivery', api: 'Stuart Delivery Hub Core', tagline: 'On-demand same-day courier loops', baseFee: 4.00, perKmRate: 1.10, bookingFee: 2.20, etaMinutes: 25, maxKm: 60, icon: 'package' },
    ],
    consolidationHub: {
      name: 'PartsForge EMEA Consolidation Hub',
      city: 'London',
      lat: 51.5074,
      lng: -0.1278,
      handlingFee: 5.50,
    },
  },
  US: {
    code: 'US',
    label: 'United States (USD)',
    country: 'United States',
    currencySymbol: '$',
    currencyCode: 'USD',
    locale: 'en-US',
    taxLabel: 'Sales Tax',
    taxRate: 0.0725,
    taxIsFlat: false,
    corpCodeLabel: 'Federal EIN',
    corpCodePlaceholder: '12-3456789',
    bankProvider: {
      name: 'Plaid',
      label: 'Plaid API Production Live Gateway Token',
      description: 'US sovereign data partition. Plaid production gateway with live bank-link token exchange for US financial institutions.',
    },
    shardNode: {
      name: 'AMER SHARD NODE',
      location: 'Oregon / Virginia Center',
      compliance: 'CCPA · GLBA · US Data Sovereignty',
    },
    courierNetworks: [
      { id: 'roadie', name: 'Roadie (A UPS Company)', api: 'Roadie API Platform', tagline: 'Instant city-wide component sourcing', baseFee: 4.00, perKmRate: 1.30, bookingFee: 2.00, etaMinutes: 20, maxKm: 80, icon: 'truck' },
      { id: 'taskrabbit', name: 'TaskRabbit Pro Trade', api: 'TaskRabbit Pro Trade Fleets API', tagline: 'Same-day local trade fleets', baseFee: 5.50, perKmRate: 1.50, bookingFee: 2.50, etaMinutes: 30, maxKm: 100, icon: 'wrench' },
    ],
    consolidationHub: {
      name: 'PartsForge AMER Consolidation Hub',
      city: 'Atlanta GA',
      lat: 33.7490,
      lng: -84.3880,
      handlingFee: 6.50,
    },
    usStates: US_STATES,
  },
};

export const REGION_LIST = Object.values(REGIONS);

export function getRegion(code: RegionCode): RegionConfig {
  return REGIONS[code];
}

export function getEffectiveTaxRate(region: RegionConfig, usStateCode?: string): number {
  if (region.code === 'US' && usStateCode) {
    const state = US_STATES.find(s => s.code === usStateCode);
    if (state) return state.salesTaxRate;
  }
  return region.taxRate;
}

export function formatCurrency(amount: number, region: RegionConfig): string {
  const value = (amount || 0).toFixed(2);
  return `${region.currencySymbol}${value}`;
}
