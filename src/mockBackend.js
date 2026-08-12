/**
 * PartsForge B2B Mock Backend Simulator Engine
 * Architecture Version: v2.0.3 (Harmonized WMS & Bookkeeping Rollout)
 * Target Zone: Mernda, South Morang, and Epping Trade Hubs
 */

// 1. Live Active Stock Inventory Database Array
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

// 2. Active Trade Accounts Database Array (Tracks Workshop Credit Wallet Limits)
export let mockTradeAccounts = [
  {
    workshop_id: "WS-3754-01",
    workshop_name: "Plenty Road Mechanical Care",
    available_trade_credit: 5000.00,
    active_pilot_status: "ACTIVE_NODE"
  }
];

// 3. LEGACY COMPATIBILITY HOOKS (Fixes the SellerConsole.tsx Imports)
export function streamInvoiceToLedger(invoicePayload) {
  console.log("🧾 Legacy Ledger Sync: Invoice streamed to trade account balances.", invoicePayload);
  return { status: "STREAMED_SUCCESSFULLY", ledgerRef: `INV-${Date.now()}` };
}

export function connectAccountingSoftware(providerName) {
  console.log(`🔗 Legacy Integration: Connected natively to ${providerName} cloud accounting ledger.`);
  return { status: "CONNECTED", provider: providerName };
}

// 4. AUTOMATED UNIVERSAL WMS DATA TRANSLATION MAPPER
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

// 5. AUTOMATED PICK-ROUTE OPTIMIZATION MODULE
export function generateOptimizedPickingPath(activeOrdersList) {
  return [...activeOrdersList].sort((a, b) => {
    if (a.bin_location < b.bin_location) return -1;
    if (a.bin_location > b.bin_location) return 1;
    return 0;
  });
}

// 6. ZERO-HOLD AUTOMATED TRADE CREDIT & RETURN INTERCEPTOR
export function executeInstantReturnLoop(workshopId, skuCode, creditValue) {
  const account = mockTradeAccounts.find(acc => acc.workshop_id === workshopId);
  
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
