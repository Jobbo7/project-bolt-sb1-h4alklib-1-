import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL('../supabase/migrations/20260921000000_workshop_pro_tenancy.sql', import.meta.url);

test('Workshop Pro migration creates every normalized tenant table', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  const tables = [
    'workshops', 'workshop_members', 'customers', 'vehicles', 'repair_jobs',
    'job_items', 'job_events', 'invoices', 'invoice_items', 'purchase_requests',
    'purchase_approvals', 'subscriptions', 'subscription_events',
    'workshop_entitlements', 'vehicle_lookup_usage',
  ];
  for (const table of tables) {
    assert.match(sql, new RegExp(`create table public\\.${table}\\b`, 'i'), `${table} must be normalized`);
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'), `${table} must enable RLS`);
  }
});

test('operational records are workshop scoped and cannot reference another workshop parent', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  for (const table of ['customers', 'vehicles', 'repair_jobs', 'job_items', 'job_events', 'invoices', 'invoice_items', 'purchase_requests', 'purchase_approvals', 'subscriptions', 'subscription_events', 'workshop_entitlements', 'vehicle_lookup_usage']) {
    const tableBlock = sql.match(new RegExp(`create table public\\.${table} \\(([\\s\\S]*?)\\n\\);`, 'i'))?.[1] || '';
    assert.match(tableBlock, /workshop_id uuid not null/i, `${table} requires workshop_id`);
  }
  assert.match(sql, /foreign key \(workshop_id, customer_id\) references public\.customers\(workshop_id, id\)/i);
  assert.match(sql, /foreign key \(workshop_id, vehicle_id\) references public\.vehicles\(workshop_id, id\)/i);
  assert.match(sql, /foreign key \(workshop_id, repair_job_id\) references public\.repair_jobs\(workshop_id, id\)/i);
});

test('RLS resolves access through active workshop membership and protects billing writes', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /member\.user_id = \(select auth\.uid\(\)\)[\s\S]*member\.status = 'ACTIVE'/i);
  assert.match(sql, /create policy customers_member_select[\s\S]*public\.is_workshop_member\(workshop_id\)/i);
  assert.match(sql, /create policy jobs_member_select[\s\S]*public\.is_workshop_member\(workshop_id\)/i);
  assert.match(sql, /create policy invoices_member_select[\s\S]*public\.is_workshop_member\(workshop_id\)/i);
  assert.doesNotMatch(sql, /grant (insert|update|delete)[^;]*public\.subscriptions to authenticated/i);
  assert.doesNotMatch(sql, /grant (insert|update|delete)[^;]*public\.workshop_entitlements to authenticated/i);
  assert.doesNotMatch(sql, /grant (insert|update|delete)[^;]*public\.subscription_events to authenticated/i);
});

test('purchase approval and payment states are separate', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /request_status text not null default 'PENDING'/i);
  assert.match(sql, /payment_status text not null default 'NOT_STARTED'/i);
  assert.match(sql, /purchase_approvals_owner_insert[\s\S]*public\.is_workshop_owner\(workshop_id\)/i);
});

test('legacy workshop state remains available only as a compatibility path', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.doesNotMatch(sql, /drop table[^;]*workshop_state/i);
  assert.match(sql, /Legacy compatibility state/i);
});

test('Preview integration fixture checks Workshop A cannot read, update or delete Workshop B data', async () => {
  const fixture = await readFile(new URL('../supabase/tests/workshop_tenancy_rls.sql', import.meta.url), 'utf8');
  assert.match(fixture, /Workshop A read Workshop B customer/);
  assert.match(fixture, /Workshop A updated Workshop B customer/);
  assert.match(fixture, /Workshop A deleted Workshop B customer/);
  assert.match(fixture, /reset role;\s*rollback;/i);
});
