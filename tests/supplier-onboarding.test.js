import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareInventoryRecords } from '../api/wholesaler-register.js';
import { mergeCatalogueMatches } from '../api/parts-search.js';

const ownerId = '11111111-1111-4111-8111-111111111111';

test('prepares a complete supplier inventory record', () => {
  const result = prepareInventoryRecords({
    ownerId,
    now: '2026-09-02T00:00:00.000Z',
    body: {
      businessName: 'Melbourne Parts Co',
      location: 'Epping VIC 3076',
      items: [{ sku: 'brk-001', name: 'Front pads', stock: 12, price: 79.95, make: 'Toyota', model: 'Corolla', year_from: 2018, year_to: 2022 }],
    },
  });
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].part_number, 'brk-001');
  assert.equal(result.records[0].owner_id, ownerId);
  assert.equal(result.records[0].wholesaler_business_name, 'Melbourne Parts Co');
});

test('consolidates duplicate SKUs using the final row', () => {
  const result = prepareInventoryRecords({ ownerId, body: {
    businessName: 'Supplier', location: 'Melbourne VIC', items: [
      { sku: 'ABC-1', name: 'Part', stock: 1, price: 10 },
      { sku: 'abc-1', name: 'Part updated', stock: 7, price: 12 },
    ],
  } });
  assert.equal(result.records.length, 1);
  assert.deepEqual(result.duplicateSkus, ['ABC-1']);
  assert.equal(result.records[0].stock, 7);
});

test('rejects missing supplier identity and invalid fitment years', () => {
  const missingProfile = prepareInventoryRecords({ ownerId, body: { items: [{ sku: 'A', name: 'Part', stock: 1, price: 1 }] } });
  assert.equal(missingProfile.error.body.error, 'SUPPLIER_PROFILE_REQUIRED');

  const invalidYear = prepareInventoryRecords({ ownerId, body: {
    businessName: 'Supplier', location: 'Melbourne VIC',
    items: [{ sku: 'A', name: 'Part', stock: 1, price: 1, year_from: 2025, year_to: 2020 }],
  } });
  assert.equal(invalidYear.error.body.error, 'INVENTORY_VALIDATION_FAILED');
  assert.equal(invalidYear.error.body.errors[0].field, 'year_to');
});

test('merges description, SKU and OEM search matches without duplicates', () => {
  const merged = mergeCatalogueMatches([
    { data: [{ id: 'one', part: 'Brake pads' }] },
    { data: [{ id: 'one', part: 'Brake pads' }, { id: 'two', part_number: 'BRK-002' }] },
    { data: [{ id: 'three', oem_number: '04465-02390' }] },
  ]);
  assert.deepEqual(merged.map(item => item.id), ['one', 'two', 'three']);
});
