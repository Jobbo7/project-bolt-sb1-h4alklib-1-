// ─── PARTSFORGE CORE LIVE PRODUCTION EDGE PROXY BRIDGE ───
// FILE: src/mockBackend.js

const getOrigin = () => typeof window !== 'undefined' ? window.location.origin : '';

/**
 * Streams real-time parts queries down through your Vercel serverless edge paths
 * directly into your active global marketplace listings.
 */
export async function processPartsQuery(
  query,
  regionCode = 'AU_VIC',
  vehicle = null
) {
  if (!query || !query.trim()) {
    return {
      local: [],
      national: [],
      trans_tasman: [],
      global_direct: [],
      facebook: []
    };
  }

  try {
    const params = new URLSearchParams();

    params.set('q', query.trim());
    params.set('region', regionCode);

    // Attach the currently matched vehicle to the parts search.
    if (vehicle) {
      if (vehicle.vin) {
        params.set('vin', vehicle.vin);
      }

      if (vehicle.make) {
        params.set('make', vehicle.make);
      }

      if (vehicle.model) {
        params.set('model', vehicle.model);
      }

      if (vehicle.year) {
        params.set('year', String(vehicle.year));
      }

      if (vehicle.engine) {
        params.set('engine', vehicle.engine);
      }

      if (vehicle.engineCode) {
        params.set('engineCode', vehicle.engineCode);
      }

      if (vehicle.series) {
        params.set('series', vehicle.series);
      }

      if (vehicle.variant) {
        params.set('variant', vehicle.variant);
      }
    }

    console.log(
      `📡 PartsForge parts search: "${query}" | ` +
      `${vehicle?.year || ''} ${vehicle?.make || ''} ${vehicle?.model || ''}`
    );

    const response = await fetch(
      `${getOrigin()}/api/parts-search?${params.toString()}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
        `Serverless gateway rejection status code: ${response.status}`
      );
    }

    return data;

  } catch (error) {
    console.error(
      '❌ Live parts search pipeline failure:',
      error
    );

    return {
      error: error.message || 'Parts search failed.',
      local: [],
      national: [],
      trans_tasman: [],
      global_direct: [],
      facebook: []
    };
  }
}

/**
 * Handles live vehicle transport registration lookups using your tablet's rear camera lens snaps 
 * or manual dashboard alphanumeric inputs.
 */
export const processFreeRegoLookup = async (plate, region) => {
  if (!plate || !plate.trim()) return { make: "STANDBY", model: "AWAITING LOOKUP", year: 2026 };
  try {
    console.log(`📡 Shipping secure query down to Vercel API routes for plate: ${plate.toUpperCase()} (${region})`);
    const response = await fetch(`${getOrigin()}/api/vehicle-lookup?plate=${encodeURIComponent(plate.trim())}&region=${encodeURIComponent(region || 'AU_VIC')}`);
    if (!response.ok) throw new Error(`Gateway Error: ${response.status}`);
    return await response.json();
   } catch (err) {
    console.error("❌ Live rego lookup connection failure:", err);

    return {
      success: false,
      error: err.message || "Vehicle lookup failed.",
      code: "VEHICLE_LOOKUP_FAILED",
      rego: plate.toUpperCase(),
      region: region || "AU_VIC"
    };
  }
};

export const processVinLookup = async (vin) => {
  if (!vin || !vin.trim()) return { make: "STANDBY", model: "AWAITING LOOKUP", year: 2026 };
  try {
    console.log(`📡 Shipping secure query down to Vercel API routes for VIN: ${vin.toUpperCase()}`);
    const response = await fetch(`${getOrigin()}/api/vin-lookup?vin=${encodeURIComponent(vin.trim())}`);
    if (!response.ok) throw new Error(`Gateway Error: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error("❌ Live VIN lookup connection failure:", err);
    return { success: false, error: err.message || 'VIN lookup failed.', code: 'VIN_LOOKUP_FAILED', vin: vin.toUpperCase() };
  }
};

// ─── MANDATORY FRONTEND COMPLIANCE VARIABLE FOOTPRINTS FOR APP.JSX ───
export const SOURCING_TIERS = {
  local: { label: "Fast Local Delivery (Aisle Sync)" },
  national: { label: "National Retail Network" },
  trans_tasman: { label: "Trans-Tasman Freight Airway" },
  global_direct: { label: "Global Direct Air Freight" },
  facebook: { label: "Social Marketplace Network" }
};
export const TRADE_ACCOUNTS = [];
export const MEMBERSHIP_TIERS = [];
export const COURIER_BASE_FEE = 15.00;
export const TAX_RATE = 0.10;
export const CONSUMABLES_MARKUP = 0.15;
export const PLATFORM_LOGISTICS_MARKUP = 0.10;
export const TRANS_TASMAN_FREIGHT_SURCHARGE = 45.00;
export const GLOBAL_DIRECT_FREIGHT_SURCHARGE = 85.00;

export const executeWholesalerItemUpload = async () => ({ ok: false, status: 'AUTHENTICATED_SELLER_API_REQUIRED' });
export const executeStripeSplitPayouts = async () => ({ ok: false, status: 'STRIPE_CONNECT_NOT_CONFIGURED' });
export const persistJobProgress = async (payload) => ({ ...payload, storage: 'browser_only' });
export const getToolsForComponent = () => [];
export const getConsumablesForComponent = () => [];
export const getDocsForComponent = () => [];
export const resolveTradeAccount = () => null;

export const compileCustomerInvoice = (jobData, taxRate) => {
  const partsTotal = jobData.cart.reduce((s, c) => s + c.unitPrice * c.qty, 0);
  const consTotal = jobData.consumables.reduce((s, c) => s + (c.unitPrice || 0) * (c.qty || 1), 0);
  const laborTotal = (jobData.laborHours || 0) * (jobData.laborRate || 0);
  const subtotal = partsTotal + consTotal + laborTotal;
  const gst = jobData.taxOn ? subtotal * taxRate : 0;
  return {
    invoiceNo: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
    customer: jobData.custName || 'Walk-in Customer',
    vehicle: jobData.vehicle ? `${jobData.vehicle.year} ${jobData.vehicle.make} ${jobData.vehicle.model}` : 'General Service',
    date: new Date().toLocaleDateString('en-AU'),
    partsTotal,
    laborTotal,
    laborHours: jobData.laborHours,
    gst,
    grandTotal: subtotal + gst,
    cart: jobData.cart,
    consumables: jobData.consumables,
    paymentStatus: 'UNPAID'
  };
};

export const dispatchInvoicePaymentRequest = async (invoice) => {
  const response = await fetch(`${getOrigin()}/api/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [...(invoice.cart || []), ...(invoice.consumables || [])], currency: 'aud', orderId: invoice.invoiceNo }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || 'CHECKOUT_CREATION_FAILED');
  return { paymentLink: data.checkoutUrl, sessionId: data.sessionId, sentAt: new Date().toISOString() };
};
export const settleInvoiceViaCustomerPortal = async () => ({ ok: false, status: 'AWAITING_VERIFIED_STRIPE_WEBHOOK' });
export const connectOpenBankingFeed = async () => ({ ok: false, status: 'BASIQ_OAUTH_ADAPTER_REQUIRED' });
export const simulateInboundDeposit = async () => ({ ok: false, status: 'BANK_FEED_NOT_CONNECTED' });
export const startBasiqBankFeedListener = async () => ({ ok: false, status: 'BASIQ_NOT_CONFIGURED' });
export const triggerXeroAccountantSync = async () => ({ ok: false, status: 'XERO_OAUTH_NOT_CONFIGURED' });
export const linkAtoSbr = async () => ({ ok: false, status: 'ATO_SBR_PROVIDER_REQUIRED' });
export const connectAccountingSoftware = async (provider) => ({ ok: false, provider, status: 'OAUTH_CONFIGURATION_REQUIRED' });
export const inviteAccountant = async () => ({ ok: false, status: 'EMAIL_PROVIDER_NOT_CONFIGURED' });
export const streamInvoiceToLedger = async () => ({ ok: false, status: 'ACCOUNTING_LEDGER_NOT_CONNECTED' });
export const dispatchUberDirectDrivers = async () => ({ ok: false, status: 'UBER_DIRECT_NOT_CONFIGURED' });
export const dispatchConsolidatedFreight = async () => ({ ok: false, status: 'FREIGHT_PROVIDER_NOT_CONFIGURED' });
