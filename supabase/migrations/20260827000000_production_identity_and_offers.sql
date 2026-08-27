create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null check (role in ('DIY', 'MECHANIC', 'APPRENTICE', 'SELLER')),
  linked_account text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select, update on public.profiles to authenticated;

create policy "profile_read_own" on public.profiles
for select to authenticated using (id = (select auth.uid()));

create policy "profile_update_own" on public.profiles
for update to authenticated using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, role, linked_account)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', 'Unnamed user'),
    coalesce(new.raw_user_meta_data ->> 'tier', 'DIY'),
    new.raw_user_meta_data ->> 'linkedAccount'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.seller_offers (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  part text not null,
  brand text,
  part_number text,
  oem_number text,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  location text,
  wholesaler_business_name text,
  distance numeric(10,2),
  vin text,
  make text,
  model text,
  series text,
  variant text,
  year_from integer,
  year_to integer,
  engine text,
  engine_code text,
  transmission text,
  drivetrain text,
  body text,
  fitment_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seller_offers_part_idx on public.seller_offers using gin (to_tsvector('english', part));
create index if not exists seller_offers_vehicle_idx on public.seller_offers (make, model, year_from, year_to);
alter table public.seller_offers enable row level security;
revoke all on public.seller_offers from anon;
grant select on public.seller_offers to anon, authenticated;
grant insert, update, delete on public.seller_offers to authenticated;

create policy "offers_public_read" on public.seller_offers
for select to anon, authenticated using (true);

create policy "seller_insert_own_offer" on public.seller_offers
for insert to authenticated with check (
  owner_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'SELLER')
);

create policy "seller_manage_own_offer" on public.seller_offers
for update to authenticated using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "seller_delete_own_offer" on public.seller_offers
for delete to authenticated using (owner_id = (select auth.uid()));
