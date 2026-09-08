begin;

create table if not exists public.collision_repair_jobs (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  job_type text not null check (job_type in ('INSURANCE','PRIVATE')),
  status text not null default 'DRAFT' check (status in ('DRAFT','READY_TO_SEND','SUBMITTED','APPROVED','DECLINED','COMPLETED')),
  customer_name text,
  customer_email text,
  insurer text,
  claim_number text,
  assessor_email text,
  vehicle jsonb not null default '{}'::jsonb,
  odometer_km integer,
  estimate jsonb not null default '{}'::jsonb,
  valuation jsonb not null default '{}'::jsonb,
  notes text,
  audit_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.collision_repair_jobs enable row level security;
revoke all on table public.collision_repair_jobs from anon;
grant select, insert, update on table public.collision_repair_jobs to authenticated;

drop policy if exists collision_jobs_owner_select on public.collision_repair_jobs;
create policy collision_jobs_owner_select on public.collision_repair_jobs for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists collision_jobs_owner_insert on public.collision_repair_jobs;
create policy collision_jobs_owner_insert on public.collision_repair_jobs for insert to authenticated with check (
  owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'MECHANIC')
);
drop policy if exists collision_jobs_owner_update on public.collision_repair_jobs;
create policy collision_jobs_owner_update on public.collision_repair_jobs for update to authenticated using (
  owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'MECHANIC')
) with check (owner_id = (select auth.uid()));

commit;
