begin;

create extension if not exists pgcrypto;

create table public.workshops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (length(trim(name)) between 2 and 160),
  legal_name text,
  abn text check (abn is null or abn ~ '^[0-9]{11}$'),
  email text,
  phone text,
  address jsonb not null default '{}'::jsonb check (jsonb_typeof(address) = 'object'),
  timezone text not null default 'Australia/Sydney',
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SUSPENDED','CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

create table public.workshop_members (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('OWNER','MANAGER','TECHNICIAN')),
  status text not null default 'ACTIVE' check (status in ('INVITED','ACTIVE','SUSPENDED','REMOVED')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workshop_id, user_id)
);

create or replace function public.is_workshop_member(target_workshop_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workshop_members member
    where member.workshop_id = target_workshop_id
      and member.user_id = (select auth.uid())
      and member.status = 'ACTIVE'
  );
$$;

create or replace function public.is_workshop_owner(target_workshop_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workshop_members member
    where member.workshop_id = target_workshop_id
      and member.user_id = (select auth.uid())
      and member.role = 'OWNER'
      and member.status = 'ACTIVE'
  );
$$;

revoke all on function public.is_workshop_member(uuid) from public;
revoke all on function public.is_workshop_owner(uuid) from public;
grant execute on function public.is_workshop_member(uuid) to authenticated;
grant execute on function public.is_workshop_owner(uuid) to authenticated;

create or replace function public.create_owned_workshop(
  workshop_name text,
  workshop_legal_name text default null,
  workshop_abn text default null
)
returns public.workshops
language plpgsql security definer set search_path = '' as $$
declare
  created public.workshops;
begin
  if (select auth.uid()) is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if exists (select 1 from public.workshops w where w.owner_id = (select auth.uid())) then
    raise exception 'WORKSHOP_ALREADY_EXISTS';
  end if;
  insert into public.workshops (owner_id, name, legal_name, abn)
  values ((select auth.uid()), trim(workshop_name), nullif(trim(workshop_legal_name), ''), nullif(regexp_replace(coalesce(workshop_abn,''), '[^0-9]', '', 'g'), ''))
  returning * into created;
  insert into public.workshop_members (workshop_id, user_id, role, status, joined_at)
  values (created.id, (select auth.uid()), 'OWNER', 'ACTIVE', now());
  return created;
end;
$$;

revoke all on function public.create_owned_workshop(text,text,text) from public;
grant execute on function public.create_owned_workshop(text,text,text) to authenticated;

create table public.customers (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops(id) on delete cascade,
  display_name text not null, email text, phone text, address jsonb not null default '{}'::jsonb check (jsonb_typeof(address) = 'object'),
  notes text, version bigint not null default 1, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (workshop_id, id)
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops(id) on delete cascade,
  customer_id uuid, registration text, registration_state text, vin text, year integer, make text, model text, series text, variant text, engine text,
  notes text, version bigint not null default 1, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (workshop_id, id),
  foreign key (workshop_id, customer_id) references public.customers(workshop_id, id) on delete set null
);

create table public.repair_jobs (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops(id) on delete cascade,
  customer_id uuid, vehicle_id uuid, job_number text not null, status text not null default 'DRAFT' check (status in ('DRAFT','OPEN','ON_HOLD','COMPLETED','CANCELLED')),
  hoist_bay text, complaint text, diagnosis text, work_performed text, opened_at timestamptz not null default now(), completed_at timestamptz,
  version bigint not null default 1, created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (workshop_id, id), unique (workshop_id, job_number),
  foreign key (workshop_id, customer_id) references public.customers(workshop_id, id) on delete restrict,
  foreign key (workshop_id, vehicle_id) references public.vehicles(workshop_id, id) on delete restrict
);

create table public.job_items (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops(id) on delete cascade,
  repair_job_id uuid not null, item_type text not null check (item_type in ('LABOUR','PART','CONSUMABLE','OTHER')),
  description text not null, quantity numeric(12,3) not null check (quantity > 0), unit_price_cents bigint not null check (unit_price_cents >= 0), unit_cost_cents bigint check (unit_cost_cents is null or unit_cost_cents >= 0), taxable boolean not null default true,
  version bigint not null default 1, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (workshop_id, id), foreign key (workshop_id, repair_job_id) references public.repair_jobs(workshop_id, id) on delete cascade
);

create table public.job_events (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops(id) on delete cascade,
  repair_job_id uuid not null, event_type text not null, event_data jsonb not null default '{}'::jsonb check (jsonb_typeof(event_data) = 'object'),
  actor_id uuid not null references auth.users(id), created_at timestamptz not null default now(),
  foreign key (workshop_id, repair_job_id) references public.repair_jobs(workshop_id, id) on delete cascade
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops(id) on delete cascade,
  repair_job_id uuid, customer_id uuid, vehicle_id uuid, invoice_number text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT','ISSUED','PAID','VOID','OVERDUE')),
  currency text not null default 'AUD' check (currency ~ '^[A-Z]{3}$'), subtotal_cents bigint not null default 0 check (subtotal_cents >= 0), gst_cents bigint not null default 0 check (gst_cents >= 0), total_cents bigint not null default 0 check (total_cents >= 0),
  business_snapshot jsonb not null default '{}'::jsonb, customer_snapshot jsonb not null default '{}'::jsonb, vehicle_snapshot jsonb not null default '{}'::jsonb,
  issued_at timestamptz, due_at timestamptz, paid_at timestamptz, version bigint not null default 1, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (workshop_id, id), unique (workshop_id, invoice_number),
  foreign key (workshop_id, repair_job_id) references public.repair_jobs(workshop_id, id) on delete restrict,
  foreign key (workshop_id, customer_id) references public.customers(workshop_id, id) on delete restrict,
  foreign key (workshop_id, vehicle_id) references public.vehicles(workshop_id, id) on delete restrict
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops(id) on delete cascade,
  invoice_id uuid not null, item_type text not null check (item_type in ('LABOUR','PART','CONSUMABLE','OTHER')),
  description text not null, quantity numeric(12,3) not null check (quantity > 0), unit_price_cents bigint not null check (unit_price_cents >= 0), line_subtotal_cents bigint not null check (line_subtotal_cents >= 0), gst_cents bigint not null default 0 check (gst_cents >= 0), line_total_cents bigint not null check (line_total_cents >= 0),
  created_at timestamptz not null default now(), foreign key (workshop_id, invoice_id) references public.invoices(workshop_id, id) on delete cascade
);

create table public.purchase_requests (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops(id) on delete cascade,
  repair_job_id uuid, requested_by uuid not null references auth.users(id), description text not null, amount_cents bigint not null default 0 check (amount_cents >= 0),
  request_status text not null default 'PENDING' check (request_status in ('PENDING','APPROVED','REJECTED','CANCELLED')),
  payment_status text not null default 'NOT_STARTED' check (payment_status in ('NOT_STARTED','PAYMENT_PENDING','PAID','PAYMENT_FAILED','REFUNDED')),
  version bigint not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (workshop_id, id), foreign key (workshop_id, repair_job_id) references public.repair_jobs(workshop_id, id) on delete set null
);

create table public.purchase_approvals (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops(id) on delete cascade,
  purchase_request_id uuid not null, decided_by uuid not null references auth.users(id), decision text not null check (decision in ('APPROVED','REJECTED')),
  reason text, decided_at timestamptz not null default now(),
  foreign key (workshop_id, purchase_request_id) references public.purchase_requests(workshop_id, id) on delete cascade
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null unique references public.workshops(id) on delete cascade,
  provider text not null default 'STRIPE' check (provider = 'STRIPE'), stripe_customer_id text unique, stripe_subscription_id text unique,
  plan_code text not null default 'FREE' check (plan_code in ('FREE','WORKSHOP_PRO')),
  status text not null default 'FREE' check (status in ('FREE','INCOMPLETE','TRIALING','ACTIVE','PAST_DUE','GRACE','CANCELLED','SUSPENDED')),
  current_period_start timestamptz, current_period_end timestamptz, grace_ends_at timestamptz, cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.subscription_events (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops(id) on delete cascade,
  provider_event_id text not null unique, event_type text not null, provider_created_at timestamptz, payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(), processing_error text
);

create table public.workshop_entitlements (
  workshop_id uuid not null references public.workshops(id) on delete cascade, feature_code text not null,
  enabled boolean not null default false, numeric_limit integer check (numeric_limit is null or numeric_limit >= 0), source text not null check (source in ('FREE_DEFAULT','SUBSCRIPTION','ADMIN_OVERRIDE')),
  effective_from timestamptz not null default now(), effective_until timestamptz, updated_at timestamptz not null default now(),
  primary key (workshop_id, feature_code)
);

create table public.vehicle_lookup_usage (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops(id) on delete cascade,
  requested_by uuid not null references auth.users(id), billing_period_start date not null, lookup_kind text not null check (lookup_kind in ('REGISTRATION','VIN')),
  request_fingerprint text not null, provider text, outcome text not null check (outcome in ('SUCCESS','NOT_FOUND','ERROR','RATE_LIMITED','CACHED')),
  quota_charged boolean not null default true, created_at timestamptz not null default now()
);

create index workshop_members_user_idx on public.workshop_members(user_id, status);
create index customers_workshop_idx on public.customers(workshop_id, updated_at desc);
create index vehicles_workshop_customer_idx on public.vehicles(workshop_id, customer_id);
create index repair_jobs_workshop_status_idx on public.repair_jobs(workshop_id, status, updated_at desc);
create index job_items_job_idx on public.job_items(workshop_id, repair_job_id);
create index job_events_job_idx on public.job_events(workshop_id, repair_job_id, created_at);
create index invoices_workshop_status_idx on public.invoices(workshop_id, status, issued_at desc);
create index purchase_requests_workshop_status_idx on public.purchase_requests(workshop_id, request_status, updated_at desc);
create index vehicle_lookup_usage_period_idx on public.vehicle_lookup_usage(workshop_id, billing_period_start, quota_charged);

alter table public.workshops enable row level security;
alter table public.workshop_members enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.repair_jobs enable row level security;
alter table public.job_items enable row level security;
alter table public.job_events enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.purchase_approvals enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_events enable row level security;
alter table public.workshop_entitlements enable row level security;
alter table public.vehicle_lookup_usage enable row level security;

revoke all on table public.workshops, public.workshop_members, public.customers, public.vehicles, public.repair_jobs, public.job_items, public.job_events, public.invoices, public.invoice_items, public.purchase_requests, public.purchase_approvals, public.subscriptions, public.subscription_events, public.workshop_entitlements, public.vehicle_lookup_usage from anon;
revoke all on table public.workshops, public.workshop_members, public.customers, public.vehicles, public.repair_jobs, public.job_items, public.job_events, public.invoices, public.invoice_items, public.purchase_requests, public.purchase_approvals, public.subscriptions, public.subscription_events, public.workshop_entitlements, public.vehicle_lookup_usage from authenticated;
grant select, update on public.workshops to authenticated;
grant select on public.workshop_members, public.subscriptions, public.workshop_entitlements, public.vehicle_lookup_usage to authenticated;
grant select, insert, update, delete on public.customers, public.vehicles, public.repair_jobs, public.job_items, public.invoices, public.invoice_items, public.purchase_requests to authenticated;
grant select, insert on public.job_events, public.purchase_approvals to authenticated;

create policy workshops_member_select on public.workshops for select to authenticated using (public.is_workshop_member(id));
create policy workshops_owner_update on public.workshops for update to authenticated using (public.is_workshop_owner(id)) with check (public.is_workshop_owner(id) and owner_id = (select auth.uid()));
create policy members_member_select on public.workshop_members for select to authenticated using (public.is_workshop_member(workshop_id));

create policy customers_member_select on public.customers for select to authenticated using (public.is_workshop_member(workshop_id));
create policy customers_member_insert on public.customers for insert to authenticated with check (public.is_workshop_member(workshop_id) and created_by = (select auth.uid()));
create policy customers_member_update on public.customers for update to authenticated using (public.is_workshop_member(workshop_id)) with check (public.is_workshop_member(workshop_id));
create policy customers_member_delete on public.customers for delete to authenticated using (public.is_workshop_member(workshop_id));
create policy vehicles_member_select on public.vehicles for select to authenticated using (public.is_workshop_member(workshop_id));
create policy vehicles_member_insert on public.vehicles for insert to authenticated with check (public.is_workshop_member(workshop_id) and created_by = (select auth.uid()));
create policy vehicles_member_update on public.vehicles for update to authenticated using (public.is_workshop_member(workshop_id)) with check (public.is_workshop_member(workshop_id));
create policy vehicles_member_delete on public.vehicles for delete to authenticated using (public.is_workshop_member(workshop_id));
create policy jobs_member_select on public.repair_jobs for select to authenticated using (public.is_workshop_member(workshop_id));
create policy jobs_member_insert on public.repair_jobs for insert to authenticated with check (public.is_workshop_member(workshop_id) and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
create policy jobs_member_update on public.repair_jobs for update to authenticated using (public.is_workshop_member(workshop_id)) with check (public.is_workshop_member(workshop_id) and updated_by = (select auth.uid()));
create policy jobs_member_delete on public.repair_jobs for delete to authenticated using (public.is_workshop_member(workshop_id));
create policy job_items_member_select on public.job_items for select to authenticated using (public.is_workshop_member(workshop_id));
create policy job_items_member_insert on public.job_items for insert to authenticated with check (public.is_workshop_member(workshop_id) and created_by = (select auth.uid()));
create policy job_items_member_update on public.job_items for update to authenticated using (public.is_workshop_member(workshop_id)) with check (public.is_workshop_member(workshop_id));
create policy job_items_member_delete on public.job_items for delete to authenticated using (public.is_workshop_member(workshop_id));
create policy job_events_member_select on public.job_events for select to authenticated using (public.is_workshop_member(workshop_id));
create policy job_events_member_insert on public.job_events for insert to authenticated with check (public.is_workshop_member(workshop_id) and actor_id = (select auth.uid()));
create policy invoices_member_select on public.invoices for select to authenticated using (public.is_workshop_member(workshop_id));
create policy invoices_member_insert on public.invoices for insert to authenticated with check (public.is_workshop_member(workshop_id) and created_by = (select auth.uid()));
create policy invoices_member_update on public.invoices for update to authenticated using (public.is_workshop_member(workshop_id)) with check (public.is_workshop_member(workshop_id));
create policy invoices_member_delete on public.invoices for delete to authenticated using (public.is_workshop_member(workshop_id));
create policy invoice_items_member_select on public.invoice_items for select to authenticated using (public.is_workshop_member(workshop_id));
create policy invoice_items_member_insert on public.invoice_items for insert to authenticated with check (public.is_workshop_member(workshop_id));
create policy invoice_items_member_update on public.invoice_items for update to authenticated using (public.is_workshop_member(workshop_id)) with check (public.is_workshop_member(workshop_id));
create policy invoice_items_member_delete on public.invoice_items for delete to authenticated using (public.is_workshop_member(workshop_id));
create policy purchase_requests_member_select on public.purchase_requests for select to authenticated using (public.is_workshop_member(workshop_id));
create policy purchase_requests_member_insert on public.purchase_requests for insert to authenticated with check (public.is_workshop_member(workshop_id) and requested_by = (select auth.uid()));
create policy purchase_requests_member_update on public.purchase_requests for update to authenticated using (public.is_workshop_member(workshop_id)) with check (public.is_workshop_member(workshop_id));
create policy purchase_requests_member_delete on public.purchase_requests for delete to authenticated using (public.is_workshop_member(workshop_id));
create policy purchase_approvals_member_select on public.purchase_approvals for select to authenticated using (public.is_workshop_member(workshop_id));
create policy purchase_approvals_owner_insert on public.purchase_approvals for insert to authenticated with check (public.is_workshop_owner(workshop_id) and decided_by = (select auth.uid()));
create policy subscriptions_member_select on public.subscriptions for select to authenticated using (public.is_workshop_member(workshop_id));
create policy entitlements_member_select on public.workshop_entitlements for select to authenticated using (public.is_workshop_member(workshop_id));
create policy lookup_usage_member_select on public.vehicle_lookup_usage for select to authenticated using (public.is_workshop_member(workshop_id));

comment on table public.workshop_state is 'Legacy compatibility state. Do not add new production-critical Workshop Pro records here.';

commit;
