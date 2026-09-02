import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import healthHandler from '../api/health.js';
import checkoutHandler from '../api/create-checkout-session.js';
import webhookHandler from '../api/stripe-webhook.js';

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function withoutEnvironment(names, callback) {
  const saved = Object.fromEntries(names.map(name => [name, process.env[name]]));
  names.forEach(name => delete process.env[name]);
  return Promise.resolve(callback()).finally(() => {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });
}

test('health reports missing production configuration without exposing values', async () => {
  const names = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'PLATE_API_KEY', 'OCR_SPACE_API_KEY'];
  await withoutEnvironment(names, async () => {
    const res = responseRecorder();
    healthHandler({ method: 'GET' }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.status, 'configuration_required');
    assert.deepEqual([...res.body.missing].sort(), [...names].sort());
    assert.equal(JSON.stringify(res.body).includes('secret_'), false);
  });
});

test('checkout fails closed before authentication when Stripe is not configured', async () => {
  await withoutEnvironment(['STRIPE_SECRET_KEY', 'PUBLIC_APP_URL'], async () => {
    const res = responseRecorder();
    await checkoutHandler({ method: 'POST', headers: {}, body: { items: [{ id: 'offer-1', qty: 1 }] } }, res);
    assert.equal(res.statusCode, 503);
    assert.deepEqual(res.body, { error: 'CHECKOUT_NOT_CONFIGURED' });
  });
});

test('webhook fails closed when signing secrets are not configured', async () => {
  await withoutEnvironment(['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'], async () => {
    const res = responseRecorder();
    await webhookHandler({ method: 'POST', headers: {} }, res);
    assert.equal(res.statusCode, 503);
    assert.deepEqual(res.body, { error: 'STRIPE_WEBHOOK_NOT_CONFIGURED' });
  });
});

test('sensitive endpoints reject unsupported methods', async () => {
  const checkoutRes = responseRecorder();
  await checkoutHandler({ method: 'GET', headers: {} }, checkoutRes);
  assert.equal(checkoutRes.statusCode, 405);
  assert.equal(checkoutRes.headers.Allow, 'POST');

  const webhookRes = responseRecorder();
  await webhookHandler({ method: 'GET', headers: {} }, webhookRes);
  assert.equal(webhookRes.statusCode, 405);
  assert.equal(webhookRes.headers.Allow, 'POST');
});

test('latest signup migration ignores user-supplied authorization roles', async () => {
  const migration = await readFile(new URL('../supabase/migrations/20260902010000_lock_public_signup_roles.sql', import.meta.url), 'utf8');
  assert.match(migration, /'DIY'/);
  assert.doesNotMatch(migration, /raw_user_meta_data\s*->>\s*'tier'/);
  assert.match(migration, /revoke update on table public\.profiles from authenticated/i);
});
