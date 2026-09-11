begin;

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select, update on public.profiles to authenticated;
drop policy if exists "profile_read_own" on public.profiles;
drop policy if exists "profile_update_own" on public.profiles;
create policy "profile_read_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profile_update_own" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

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
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.seller_offers add column if not exists updated_at timestamptz not null default now();
alter table public.seller_offers enable row level security;
revoke all on public.seller_offers from anon, authenticated;
grant select, insert, update, delete on public.seller_offers to authenticated;
drop policy if exists "Allow anonymous insert tracking rows" on public.seller_offers;
drop policy if exists "Allow public read access to parts index" on public.seller_offers;
drop policy if exists "offers_public_read" on public.seller_offers;
drop policy if exists "seller_insert_own_offer" on public.seller_offers;
drop policy if exists "seller_manage_own_offer" on public.seller_offers;
drop policy if exists "seller_delete_own_offer" on public.seller_offers;
create policy "offers_authenticated_read" on public.seller_offers for select to authenticated using (true);
create policy "seller_insert_own_offer" on public.seller_offers for insert to authenticated with check (
  owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'SELLER')
);
create policy "seller_manage_own_offer" on public.seller_offers for update to authenticated using (
  owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'SELLER')
) with check (
  owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'SELLER')
);
create policy "seller_delete_own_offer" on public.seller_offers for delete to authenticated using (
  owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'SELLER')
);
create index if not exists seller_offers_part_idx on public.seller_offers using gin (to_tsvector('english', part));
create index if not exists seller_offers_vehicle_idx on public.seller_offers (make, model, year_from, year_to);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), buyer_id uuid not null references auth.users(id),
  status text not null check (status in ('PAYMENT_PENDING','PAID','PAYMENT_FAILED','REFUNDED','CANCELLED')),
  currency text not null check (currency ~ '^[a-z]{3}$'), amount_total bigint not null check (amount_total >= 0),
  items jsonb not null check (jsonb_typeof(items) = 'array'), stripe_checkout_session_id text unique,
  stripe_payment_intent_id text, paid_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
drop policy if exists "orders_read_own" on public.orders;
create policy "orders_read_own" on public.orders for select to authenticated using (buyer_id = (select auth.uid()));

create table if not exists public.payment_events (
  stripe_event_id text primary key, event_type text not null, processed_at timestamptz not null default now()
);
alter table public.payment_events enable row level security;
revoke all on public.payment_events from anon, authenticated;

commit;
