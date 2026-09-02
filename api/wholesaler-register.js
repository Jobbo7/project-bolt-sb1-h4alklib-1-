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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const auth = await requireUser(req, res, ['SELLER']);
  if (!auth) return;

  const submittedItems = Array.isArray(req.body?.items) ? req.body.items : [req.body];
  if (!submittedItems.length || submittedItems.length > MAX_ITEMS) {
    return res.status(400).json({ error: 'INVALID_BATCH_SIZE', maximum: MAX_ITEMS });
  }

  const businessName = cleanText(req.body?.businessName, 160) || 'Registered Partner Distributor';
  const defaultLocation = cleanText(req.body?.location, 240) || 'Melbourne VIC';
  const errors = [];
  const records = [];

  submittedItems.forEach((item, index) => {
    const sku = cleanText(item?.sku || item?.partNumber || item?.part_number, 120);
    const title = cleanText(item?.name || item?.title || item?.part, 240);
    const price = finiteNumber(item?.tradePrice ?? item?.price);
    const stock = finiteNumber(item?.stockQty ?? item?.stock ?? item?.qty);

    if (!sku) errors.push({ row: index + 2, field: 'sku', message: 'SKU is required.' });
    if (!title) errors.push({ row: index + 2, field: 'name', message: 'Part name is required.' });
    if (price === null || price < 0) errors.push({ row: index + 2, field: 'price', message: 'Price must be zero or greater.' });
    if (stock === null || stock < 0 || !Number.isInteger(stock)) errors.push({ row: index + 2, field: 'stock', message: 'Stock must be a whole number zero or greater.' });
    if (!sku || !title || price === null || price < 0 || stock === null || stock < 0 || !Number.isInteger(stock)) return;

    const yearFrom = finiteNumber(item?.yearFrom ?? item?.year_from);
    const yearTo = finiteNumber(item?.yearTo ?? item?.year_to);
    records.push({
      id: inventoryId(auth.user.id, sku), owner_id: auth.user.id, part: title,
      brand: cleanText(item?.brand, 120) || null, part_number: sku,
      oem_number: cleanText(item?.oemNumber ?? item?.oem_number, 120) || null,
      price, stock, location: cleanText(item?.location, 240) || defaultLocation,
      wholesaler_business_name: businessName,
      make: cleanText(item?.make, 100) || null, model: cleanText(item?.model, 100) || null,
      year_from: yearFrom === null ? null : Math.trunc(yearFrom),
      year_to: yearTo === null ? null : Math.trunc(yearTo),
      engine: cleanText(item?.engine, 120) || null,
      engine_code: cleanText(item?.engineCode ?? item?.engine_code, 120) || null,
      fitment_notes: cleanText(item?.fitmentNotes ?? item?.fitment_notes, 1000) || null,
      updated_at: new Date().toISOString(),
    });
  });

  if (errors.length) return res.status(400).json({ error: 'INVENTORY_VALIDATION_FAILED', errors });

  const { data, error } = await auth.supabase
    .from('seller_offers')
    .upsert(records, { onConflict: 'id' })
    .select('id,part,part_number,price,stock,location');

  if (error) return res.status(500).json({ error: 'INVENTORY_PUBLISH_FAILED', message: error.message });
  return res.status(200).json({ success: true, published: data?.length || records.length, records: data || [] });
}
