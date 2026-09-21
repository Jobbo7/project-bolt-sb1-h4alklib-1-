-- Run against an isolated local/Preview Supabase database after all migrations.
-- The transaction is rolled back and must never be run against Production.
begin;

insert into auth.users (id, email, encrypted_password, email_confirmed_at, aud, role, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000001', 'workshop-a-rls@example.invalid', '', now(), 'authenticated', 'authenticated', now(), now()),
  ('20000000-0000-4000-8000-000000000002', 'workshop-b-rls@example.invalid', '', now(), 'authenticated', 'authenticated', now(), now());

insert into public.workshops (id, owner_id, name)
values
  ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'RLS Workshop A'),
  ('b0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'RLS Workshop B');

insert into public.workshop_members (workshop_id, user_id, role, status, joined_at)
values
  ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'OWNER', 'ACTIVE', now()),
  ('b0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'OWNER', 'ACTIVE', now());

insert into public.customers (id, workshop_id, display_name, created_by)
values
  ('aa000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Workshop A Customer', '10000000-0000-4000-8000-000000000001'),
  ('bb000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'Workshop B Customer', '20000000-0000-4000-8000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
  affected integer;
begin
  if not exists (select 1 from public.customers where id = 'aa000000-0000-4000-8000-000000000001') then
    raise exception 'RLS_TEST_FAILED: Workshop A cannot read its own customer';
  end if;

  if exists (select 1 from public.customers where id = 'bb000000-0000-4000-8000-000000000002') then
    raise exception 'RLS_TEST_FAILED: Workshop A read Workshop B customer';
  end if;

  update public.customers set display_name = 'ILLEGAL UPDATE'
  where id = 'bb000000-0000-4000-8000-000000000002';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'RLS_TEST_FAILED: Workshop A updated Workshop B customer';
  end if;

  delete from public.customers
  where id = 'bb000000-0000-4000-8000-000000000002';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'RLS_TEST_FAILED: Workshop A deleted Workshop B customer';
  end if;
end;
$$;

reset role;
rollback;
