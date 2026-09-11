import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadWorkshopState, saveWorkshopState } from '../src/workshop-state.js';

function stateClient({ storedState = null, error = null } = {}) {
  const calls = [];
  const client = {
    calls,
    from(table) {
      calls.push(['from', table]);
      return {
        select(columns) { calls.push(['select', columns]); return this; },
        eq(column, value) { calls.push(['eq', column, value]); return this; },
        maybeSingle: async () => ({ data: storedState == null ? null : { state: storedState }, error }),
        upsert: async (value, options) => { calls.push(['upsert', value, options]); return { error }; },
      };
    },
  };
  return client;
}

test('workshop state loads and saves against the authenticated owner record', async () => {
  const client = stateClient({ storedState: { hoistJobs: [{ id: 'job-1' }] } });
  assert.deepEqual(await loadWorkshopState(client, 'owner-1'), { hoistJobs: [{ id: 'job-1' }] });
  assert.equal(await saveWorkshopState(client, 'owner-1', { unpaidInvoices: [] }), true);
  const upsert = client.calls.find(call => call[0] === 'upsert');
  assert.equal(upsert[1].owner_id, 'owner-1');
  assert.deepEqual(upsert[1].state, { unpaidInvoices: [] });
  assert.deepEqual(upsert[2], { onConflict: 'owner_id' });
});

test('workshop state refuses incomplete client-side save inputs', async () => {
  assert.equal(await loadWorkshopState(null, 'owner-1'), null);
  assert.equal(await saveWorkshopState(null, 'owner-1', {}), false);
  assert.equal(await saveWorkshopState(stateClient(), '', {}), false);
});

test('workshop state database policy is owner scoped and role restricted', async () => {
  const migration = await readFile(new URL('../supabase/migrations/20260911000000_workshop_state.sql', import.meta.url), 'utf8');
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /owner_id = \(select auth\.uid\(\)\)/i);
  assert.match(migration, /p\.role in \('MECHANIC', 'APPRENTICE'\)/i);
  assert.match(migration, /revoke all on table public\.workshop_state from anon, authenticated/i);
  assert.doesNotMatch(migration, /grant delete/i);
});
