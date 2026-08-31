create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id),
  status text not null check (status in ('PAYMENT_PENDING','PAID','PAYMENT_FAILED','REFUNDED','CANCELLED')),
  currency text not null check (currency ~ '^[a-z]{3}$'),
  amount_total bigint not null check (amount_total >= 0),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
create policy "orders_read_own" on public.orders for select to authenticated using (buyer_id = (select auth.uid()));

create table if not exists public.payment_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);
alter table public.payment_events enable row level security;
revoke all on public.payment_events from anon, authenticated;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('DIY','MECHANIC','APPRENTICE','SELLER','ADMIN'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name, role, linked_account)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'name', 'Unnamed user'), 'DIY', null)
  on conflict (id) do nothing;
  return new;
end;
$$;
