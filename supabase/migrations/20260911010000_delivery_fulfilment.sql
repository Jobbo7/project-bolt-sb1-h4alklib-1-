begin;

alter table public.seller_offers
  add column if not exists delivery_available boolean not null default true,
  add column if not exists pickup_available boolean not null default false,
  add column if not exists delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0);

alter table public.orders
  add column if not exists delivery_method text not null default 'DELIVERY'
    check (delivery_method in ('DELIVERY', 'PICKUP')),
  add column if not exists delivery_amount bigint not null default 0 check (delivery_amount >= 0);

create table if not exists public.order_fulfilments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  method text not null check (method in ('DELIVERY', 'PICKUP')),
  status text not null default 'AWAITING_SUPPLIER'
    check (status in ('AWAITING_SUPPLIER','ACCEPTED','READY_FOR_COLLECTION','COLLECTED','IN_TRANSIT','DELIVERED','CANCELLED','DELIVERY_FAILED')),
  delivery_address jsonb,
  tracking_reference text,
  handoff_token_hash text,
  accepted_at timestamptz,
  collected_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, seller_id)
);

create table if not exists public.fulfilment_events (
  id uuid primary key default gen_random_uuid(),
  fulfilment_id uuid not null references public.order_fulfilments(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  event_type text not null check (event_type in ('ACCEPTED','READY_FOR_COLLECTION','IN_TRANSIT','DELIVERED','DELIVERY_FAILED','CANCELLED')),
  created_at timestamptz not null default now()
);

alter table public.order_fulfilments enable row level security;
revoke all on public.order_fulfilments from anon, authenticated;
grant select on public.order_fulfilments to authenticated;
alter table public.fulfilment_events enable row level security;
revoke all on public.fulfilment_events from anon, authenticated;
grant select on public.fulfilment_events to authenticated;

create policy "fulfilments_participant_read"
on public.order_fulfilments for select to authenticated
using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()));

create policy "fulfilment_events_participant_read"
on public.fulfilment_events for select to authenticated
using (exists (
  select 1 from public.order_fulfilments f
  where f.id = fulfilment_id
    and (f.buyer_id = (select auth.uid()) or f.seller_id = (select auth.uid()))
));

commit;
