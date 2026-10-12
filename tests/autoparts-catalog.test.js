import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAutoPartsTarget } from '../api/autoparts-catalog.js';

test('uses Australian English passenger-vehicle catalogue routes', () => {
  assert.equal(buildAutoPartsTarget({ action: 'models', manufacturerId: '5' }).path, '/v2/models/list/type-id/1/manufacturer-id/5/lang-id/4/country-filter-id/21');
  assert.equal(buildAutoPartsTarget({ action: 'parts', vehicleId: '19942', categoryId: '100260' }).path, '/v2/articles/list/type-id/1/vehicle-id/19942/category-id/100260/lang-id/4');
});

test('rejects arbitrary actions and unsafe identifiers', () => {
  assert.throws(() => buildAutoPartsTarget({ action: 'proxy', path: 'https://example.com' }), /INVALID_ACTION/);
  assert.throws(() => buildAutoPartsTarget({ action: 'parts', vehicleId: '../secret', categoryId: '1' }), /INVALID_vehicle_id/i);
});
