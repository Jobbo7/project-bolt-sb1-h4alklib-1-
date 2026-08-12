/**
 * PartsForge B2B Mock Backend Simulator Engine
 * Architecture Version: v2.0.4 (Master Harmonized Dataset)
 * Target Zone: Mernda, South Morang, and Epping Trade Hubs
 */

// 1. FINANCIAL DESK CONSTANTS & CONFIGURATIONS
export const COURIER_BASE_FEE = 10.00;
export const TAX_RATE = 0.10; // 10% standard GST allocation
export const CONSUMABLES_MARKUP = 0.15; // 15% automatic workshop expense buffer

// 2. DISTRIBUTION AND MEMBERSHIP TIERS
export const SOURCING_TIERS = {
  LOCAL: { id: 'local', name: 'Epping Regional Hub (30km Hot-Shot Delivery)', speed: '45-Min Express' },
  NATIONAL: { id: 'national', name: 'Interstate Domestic Grid', speed: '24-Hour Air Freight' }
};

export const MEMBERSHIP_TIERS = {
  PILOT_FREE: { id: 'pilot_free', name: 'Northern Corridor Closed Pilot Bay Account', fee: 0.00 }
};

// 3. LIVE STOCK INVENTORY DATABASE ARRAY (WITH BATCH & LOCATION TAGGING)
export let mockInventory = [
  {
    sku_code: "DB1200-GCT",
    oem_reference: "04465-0K240",
    part_title: "Front Brake Pad Set - Ceramic Heavy Duty",
    manufacturer_brand: "Bendix",
    batch_lot_number: "B-2026-AUG-09",
    bin_location: "ROW-04-SHELF-B-SLOT-12",
    stock_qty_available: 14,
    wholesale_price_ex_gst: 64.50,
    warehouse_dispatch_postcode: 3076
  },
  {
    sku_code: "RT4566-XHD",
    oem_reference: "43512-0K090",
    part_title: "Heavy Duty Ventilated Front Brake Rotor",
    manufacturer_brand: "DBA",
    batch_lot_number: "B-2026-AUG-11",
    bin_location: "ROW-02-SHELF-A-SLOT-04",
    stock_qty_available: 8,
    wholesale_price_ex_gst: 110.00,
    warehouse_dispatch_postcode: 3076
  }
];

// 4. ACTIVE TRADE ACCOUNTS LEDGER DATABASE
export let TRADE_ACCOUNTS = [
  {
    workshop_id: "WS-3754-01",
    workshop_name: "Plenty Road Mechanical Care",
    available_trade_credit: 5000.00,
    active_pilot_status: "ACTIVE_NODE"
  }
];

// Re-assign for internal legacy matching logic tracks
export let mockTradeAccounts = TRADE_ACCOUNTS;

// 5. DATA SEARCH & VEHICLE DISCOVERY RESOLVERS
export function processFreeRegoLookup(regoString) {
  console.log(`🔍 Decoding Plate: ${regoString} via State Registry Link`);
  return { success: true, vin: "MOCKVIN1HG4LL3076", fitment_rego: regoString.toUpperCase() };
}

export function processVinLookup(vinString) {
  return { success: true, vin: vinString.toUpperCase(), vehicle_match: "2018 Toyota HiLux Utility Double Cab" };
}

export function processPartsQuery(queryParameters) {
  return mockInventory.filter(item => 
    item.part_title.toLowerCase().includes(queryParameters.toLowerCase()) ||
    item.sku_code.toLowerCase().includes(queryParameters.toLowerCase())
  );
}

// 6. FRONT-END AUXILIARY TOOL & INVENTORY FETCHERS
export function getToolsForComponent(componentId) {
  return [{ tool_id: "TL-01", name: "Heavy Duty Brake Caliper Piston Wind-Back Tool Kit" }];
}

export function getConsumablesForComponent(componentId) {
  return [{ consumable_id: "CS-04", name: "High-Temperature Silicone Brake Lubricant Aerosol", ex_gst: 8.50 }];
}

export function getDocsForComponent(componentId) {
  return [{ doc_id: "DOC-88", title: "OEM Torque Specification Reference Sheet" }];
}

export function resolveTradeAccount(accountId) {
  return TRADE_ACCOUNTS.find(acc => acc.workshop_id === accountId) || TRADE_ACCOUNTS[0];
}

// 7. AUTOMATED WORKFLOW FLOW SEGMENT PACKS
export function persistJobProgress(jobCardPayload) {
  console.log("💾 Active job card workflow checkpoint cached safely to repository:", jobCardPayload);
  return { status: "PERSISTED_SUCCESSFULLY", updated_at: new Date().toISOString() };
}

export function streamInvoiceToLedger(invoicePayload) {
  console.log("🧾 Legacy Ledger Sync: Invoice streamed to trade account balances.", invoicePayload);
  return { status: "STREAMED_SUCCESSFULLY", ledgerRef: `INV-${Date.now()}` };
}

export function connectAccountingSoftware(providerName) {
  console.log(`🔗 Legacy Integration: Connected natively to ${providerName} cloud accounting ledger.`);
  return { status: "CONNECTED", provider: providerName };
}

export function compileCustomerInvoice(orderObject) {
  return { invoice_id: `INV-${Date.now()}`, grand_total_inc_gst: orderObject.total * 1.10 };
}

export function dispatchInvoicePaymentRequest(invoiceId) {
  return { success: true, processing_status: "SETTLED_VIA_STRIPE_CONNECT" };
}

// 8. AUTOMATED UNIVERSAL WMS DATA TRANSLATION MAPPER
export function translateWMSPayload(rawIncomingArray) {
  return rawIncomingArray.map(item => ({
    sku_code: item.sku_code || item.ItemCode || item.PartNumber || "UNKNOWN_SKU",
    oem_reference: item.oem_reference || item.OEM_Ref || "UNIVERSAL_FIT",
    part_title: item.part_title || item.Description || "Automotive Component Kit",
    manufacturer_brand: item.manufacturer_brand || item.Brand || "Generic Aftermarket",
    batch_lot_number: item.batch_lot_number || item.BatchNo || item.LotID || "DEFAULT-BATCH",
    bin_location: item.bin_location || item.BinPath || item.ShelfLocation || "DISPATCH-BAY-01",
    stock_qty_available: parseInt(item.stock_qty_available || item.Qty || item.Quantity, 10) || 0,
    wholesale_price_ex_gst: parseFloat(item.wholesale_price_ex_gst || item.TradePrice || item.Cost || 0),
    warehouse_dispatch_postcode: parseInt(item.warehouse_dispatch_postcode || item.Postcode || item.BranchZip, 10) || 3076
  }));
}

// 9. AUTOMATED PICK-ROUTE OPTIMIZATION MODULE
export function generateOptimizedPickingPath(activeOrdersList) {
  return [...activeOrdersList].sort((a, b) => {
    if (a.bin_location < b.bin_location) return -1;
    if (a.bin_location > b.bin_location) return 1;
    return 0;
  });
}

// 10. ZERO-HOLD AUTOMATED TRADE CREDIT & RETURN INTERCEPTOR
export function executeInstantReturnLoop(workshopId, skuCode, creditValue) {
  const account = TRADE_ACCOUNTS.find(acc => acc.workshop_id === workshopId);
  
  const creditTokenReceipt = {
    receipt_id: `CRD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    target_workshop: workshopId,
    sku_returned: skuCode,
    refund_credit_value_aud: parseFloat(creditValue),
    ledger_status: "BALANCED"
  };

  if (account) {
    account.available_trade_credit += parseFloat(creditValue);
  }

  return creditTokenReceipt;
}
