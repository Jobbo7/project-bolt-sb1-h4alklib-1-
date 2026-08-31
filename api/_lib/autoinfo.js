const DEFAULT_URL = 'https://test.autoinfo.com.au/API/AutoInfoGateway.asmx';

function xmlEscape(value) {
  return String(value).replace(/[<>&'\"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '\"': '&quot;' })[char]);
}

function text(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '\"').replace(/&apos;/g, "'") : null;
}

export function autoInfoConfigured() {
  return Boolean(process.env.AUTOINFO_USER_ID && process.env.AUTOINFO_AUTH_CODE);
}

export async function partsList({ vehicleIds, partGroup = 0, subGroup = 0, callingIp = '' }) {
  if (!autoInfoConfigured()) throw Object.assign(new Error('AUTOINFO_NOT_CONFIGURED'), { code: 'AUTOINFO_NOT_CONFIGURED' });
  const ids = vehicleIds.map(id => `<long>${xmlEscape(id)}</long>`).join('');
  const body = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><PartsListDx xmlns="http://autoi.com.au/"><UserID>${xmlEscape(process.env.AUTOINFO_USER_ID)}</UserID><AuthCode>${xmlEscape(process.env.AUTOINFO_AUTH_CODE)}</AuthCode><CatType>${xmlEscape(process.env.AUTOINFO_CAT_TYPE || 0)}</CatType><VehicleID>${ids}</VehicleID><PartGroup>${xmlEscape(partGroup)}</PartGroup><SubGroup>${xmlEscape(subGroup)}</SubGroup><Layout>${xmlEscape(process.env.AUTOINFO_LAYOUT || 0)}</Layout><CallingIPAddress>${xmlEscape(callingIp)}</CallingIPAddress><UserCookie></UserCookie><UserAccount>${xmlEscape(process.env.AUTOINFO_USER_ACCOUNT || '')}</UserAccount></PartsListDx></soap:Body></soap:Envelope>`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(process.env.AUTOINFO_API_URL || DEFAULT_URL, {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: 'http://autoi.com.au/PartsListDx' },
      body,
    });
    const xml = await response.text();
    if (!response.ok || /<soap:Fault>|<faultcode>/i.test(xml)) throw Object.assign(new Error('AUTOINFO_PROVIDER_FAILED'), { status: response.status });
    const rows = [...xml.matchAll(/<PartsListing>([\s\S]*?)<\/PartsListing>/gi)].map(([, row]) => ({
      sku: text(row, 'SKU'), partNumber: text(row, 'Partno'), partId: Number(text(row, 'Partid')) || null,
      brand: text(row, 'Brand'), description: text(row, 'PartDescription') || text(row, 'SubCatDescription'),
      longDescription: text(row, 'LongPartDescription'), imageBaseUrl: text(row, 'baseimageurl'), thumbnailUrl: text(row, 'thumbimageurl'),
      partGroupId: Number(text(row, 'PartGroupID')) || null, subGroupId: Number(text(row, 'SubGroupID')) || null,
      unverified: text(row, 'Unverified') === '1', listPrice: text(row, 'List1'), netPrice: text(row, 'Nett1'), quantity: text(row, 'ItemQty'),
    }));
    return { parts: rows, recordsReturned: Number(text(xml, 'RecordsReturned')) || rows.length, recordsAvailable: Number(text(xml, 'RecordsAvailable')) || rows.length };
  } finally { clearTimeout(timer); }
}
