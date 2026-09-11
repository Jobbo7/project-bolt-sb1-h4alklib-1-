import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isAdminDemoAccount, rejectAdminDemoMutation } from '../api/_lib/admin-demo.js';
import { resolveEffectiveWorkshopType } from '../src/dashboard-role.js';

test('only the designated authenticated ADMIN account is recognized as the demo account', () => {
  assert.equal(isAdminDemoAccount({ role: 'ADMIN', user: { email: 'ADMIN@PARTSFORGE.TEST' } }), true);
  assert.equal(isAdminDemoAccount({ role: 'DIY', user: { email: 'admin@partsforge.test' } }), false);
  assert.equal(isAdminDemoAccount({ role: 'ADMIN', user: { email: 'customer@example.com' } }), false);
});

test('admin demo mutations fail closed with a stable response', () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  const rejected = rejectAdminDemoMutation({ role: 'ADMIN', user: { email: 'admin@partsforge.test' } }, res);
  assert.equal(rejected, true);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'ADMIN_DEMO_MODE_MUTATION_BLOCKED');
});

test('admin demo workshop personas cannot inherit the collision dashboard', () => {
  assert.equal(resolveEffectiveWorkshopType('WORKSHOP', 'COLLISION'), 'MECHANICAL');
  assert.equal(resolveEffectiveWorkshopType('COLLISION', 'MECHANICAL'), 'COLLISION');
  assert.equal(resolveEffectiveWorkshopType(null, 'collision'), 'COLLISION');
});

test('every customer-facing production mutation endpoint applies the server demo guard', async () => {
  const files = [
    '../api/create-checkout-session.js',
    '../api/_lib/routes/wholesaler-register.js',
    '../api/collision.js',
  ];
  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(source, /rejectAdminDemoMutation\(auth, res\)/, `${file} must reject the demo admin server-side`);
  }
});

test('visible admin demo contains no simulated operational or revenue claims', async () => {
  const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const visibleAdmin = source.split('// ─── Admin demo controller')[1].split('// Kept temporarily for reference')[0];
  assert.match(visibleAdmin, /Truthful release state/);
  assert.match(visibleAdmin, /Demo personas are read-only/);
  assert.doesNotMatch(visibleAdmin, /Consolidated Platform Revenue|REAL-TIME|OTA patch|FORCE OVERRIDE|Sydney Center/);
});
