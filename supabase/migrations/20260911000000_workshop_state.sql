begin;

create table if not exists public.workshop_state (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.workshop_state enable row level security;

revoke all on table public.workshop_state from anon, authenticated;
grant select, insert, update on table public.workshop_state to authenticated;

drop policy if exists "workshop_state_read_own" on public.workshop_state;
drop policy if exists "workshop_state_insert_own" on public.workshop_state;
drop policy if exists "workshop_state_update_own" on public.workshop_state;

create policy "workshop_state_read_own"
on public.workshop_state for select to authenticated
using (
  owner_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('MECHANIC', 'APPRENTICE')
  )
);

create policy "workshop_state_insert_own"
on public.workshop_state for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('MECHANIC', 'APPRENTICE')
  )
);

create policy "workshop_state_update_own"
on public.workshop_state for update to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('MECHANIC', 'APPRENTICE')
  )
);

commit;
