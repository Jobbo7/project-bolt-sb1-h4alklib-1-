import crypto from 'node:crypto';
import { requireUser } from './_lib/auth.js';

const MAX_ITEMS = 500;
const cleanText = (value, max = 240) => String(value ?? '').trim().slice(0, max);
const finiteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const inventoryId = (ownerId, sku) => {
  const digest = crypto.createHash('sha256').update(`${ownerId}|${sku.toUpperCase()}`).digest('hex').slice(0, 24);
  return `WHS-${digest}`;
};

export function prepareInventoryRecords({ ownerId, body, now = new Date().toISOString() }) {
  const submittedItems = Array.isArray(body?.items) ? body.items : [body];
  if (!submittedItems.length || submittedItems.length > MAX_ITEMS) {
    return { error: { status: 400, body: { error: 'INVALID_BATCH_SIZE', maximum: MAX_ITEMS } } };
  }

  const businessName = cleanText(body?.businessName, 160);
  const defaultLocation = cleanText(body?.location, 240);
  if (!businessName || !defaultLocation) {
    return { error: { status: 400, body: { error: 'SUPPLIER_PROFILE_REQUIRED', message: 'Business name and dispatch location are required.' } } };
  }

  const errors = [];
  const bySku = new Map();
  const duplicateSkus = new Set();

  submittedItems.forEach((item, index) => {
    const row = index + 2;
    const sku = cleanText(item?.sku || item?.partNumber || item?.part_number, 120);
    const title = cleanText(item?.name || item?.title || item?.part, 240);
    const price = finiteNumber(item?.tradePrice ?? item?.price);
    const stock = finiteNumber(item?.stockQty ?? item?.stock ?? item?.qty);
    const yearFrom = finiteNumber(item?.yearFrom ?? item?.year_from);
    const yearTo = finiteNumber(item?.yearTo ?? item?.year_to);

    if (!sku) errors.push({ row, field: 'sku', message: 'SKU is required.' });
    if (!title) errors.push({ row, field: 'name', message: 'Part name is required.' });
    if (price === null || price < 0 || price > 9999999999.99) errors.push({ row, field: 'price', message: 'Price must be between 0 and 9,999,999,999.99.' });
    if (stock === null || stock < 0 || !Number.isInteger(stock)) errors.push({ row, field: 'stock', message: 'Stock must be a whole number zero or greater.' });
    if (yearFrom !== null && (!Number.isInteger(yearFrom) || yearFrom < 1886 || yearFrom > 2100)) errors.push({ row, field: 'year_from', message: 'Start year must be a whole year between 1886 and 2100.' });
    if (yearTo !== null && (!Number.isInteger(yearTo) || yearTo < 1886 || yearTo > 2100)) errors.push({ row, field: 'year_to', message: 'End year must be a whole year between 1886 and 2100.' });
    if (yearFrom !== null && yearTo !== null && yearFrom > yearTo) errors.push({ row, field: 'year_to', message: 'End year cannot be earlier than start year.' });
    if (!sku || !title || price === null || price < 0 || price > 9999999999.99 || stock === null || stock < 0 || !Number.isInteger(stock)) return;
    if ((yearFrom !== null && (!Number.isInteger(yearFrom) || yearFrom < 1886 || yearFrom > 2100)) || (yearTo !== null && (!Number.isInteger(yearTo) || yearTo < 1886 || yearTo > 2100)) || (yearFrom !== null && yearTo !== null && yearFrom > yearTo)) return;

    const skuKey = sku.toUpperCase();
    if (bySku.has(skuKey)) duplicateSkus.add(skuKey);
    bySku.set(skuKey, {
      id: inventoryId(ownerId, sku), owner_id: ownerId, part: title,
      brand: cleanText(item?.brand, 120) || null, part_number: sku,
      oem_number: cleanText(item?.oemNumber ?? item?.oem_number, 120) || null,
      price, stock, location: cleanText(item?.location, 240) || defaultLocation,
      wholesaler_business_name: businessName,
      make: cleanText(item?.make, 100) || null, model: cleanText(item?.model, 100) || null,
      year_from: yearFrom, year_to: yearTo,
      engine: cleanText(item?.engine, 120) || null,
      engine_code: cleanText(item?.engineCode ?? item?.engine_code, 120) || null,
      fitment_notes: cleanText(item?.fitmentNotes ?? item?.fitment_notes, 1000) || null,
      updated_at: now,
    });
  });

  if (errors.length) return { error: { status: 400, body: { error: 'INVENTORY_VALIDATION_FAILED', errors } } };
  return { records: [...bySku.values()], duplicateSkus: [...duplicateSkus] };
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const auth = await requireUser(req, res, ['SELLER']);
  if (!auth) return;

  if (req.method === 'GET') {
    const { data, error } = await auth.supabase
      .from('seller_offers')
      .select('id,part,brand,part_number,oem_number,price,stock,location,wholesaler_business_name,make,model,year_from,year_to,engine,engine_code,fitment_notes,updated_at')
      .eq('owner_id', auth.user.id)
      .order('updated_at', { ascending: false })
      .limit(5000);
    if (error) return res.status(500).json({ error: 'INVENTORY_LOAD_FAILED', message: error.message });
    return res.status(200).json({ success: true, records: data || [] });
  }

  const prepared = prepareInventoryRecords({ ownerId: auth.user.id, body: req.body });
  if (prepared.error) return res.status(prepared.error.status).json(prepared.error.body);
  const { records, duplicateSkus } = prepared;

  const { data, error } = await auth.supabase
    .from('seller_offers')
    .upsert(records, { onConflict: 'id' })
    .select('id,part,part_number,price,stock,location');

  if (error) return res.status(500).json({ error: 'INVENTORY_PUBLISH_FAILED', message: error.message });
  return res.status(200).json({ success: true, published: data?.length || records.length, duplicateSkus, records: data || [] });
}
