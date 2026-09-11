begin;

alter table public.profiles
  add column if not exists requested_account_type text,
  add column if not exists business_name text,
  add column if not exists abn text,
  add column if not exists phone text,
  add column if not exists account_status text not null default 'ACTIVE';

alter table public.profiles
  drop constraint if exists profiles_requested_account_type_check;

alter table public.profiles
  add constraint profiles_requested_account_type_check
  check (
    requested_account_type is null
    or requested_account_type in ('DIY','WORKSHOP','SELLER')
  );

alter table public.profiles
  drop constraint if exists profiles_account_status_check;

alter table public.profiles
  add constraint profiles_account_status_check
  check (
    account_status in ('ACTIVE','PENDING_APPROVAL','SUSPENDED')
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account_type text;
  v_business_name text;
  v_abn text;
  v_phone text;
  v_role text;
  v_status text;
  v_abn_valid boolean := false;
begin
  v_account_type :=
    upper(
      coalesce(
        new.raw_user_meta_data ->> 'requestedAccountType',
        'DIY'
      )
    );

  if v_account_type not in ('DIY','WORKSHOP','SELLER') then
    v_account_type := 'DIY';
  end if;

  v_business_name :=
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'businessName',
          ''
        )
      ),
      ''
    );

  v_abn :=
    regexp_replace(
      coalesce(
        new.raw_user_meta_data ->> 'abn',
        ''
      ),
      '[^0-9]',
      '',
      'g'
    );

  if length(v_abn) = 11 then
    v_abn_valid := (
      (
        (substring(v_abn from 1 for 1)::integer - 1) * 10 +
        substring(v_abn from 2 for 1)::integer * 1 +
        substring(v_abn from 3 for 1)::integer * 3 +
        substring(v_abn from 4 for 1)::integer * 5 +
        substring(v_abn from 5 for 1)::integer * 7 +
        substring(v_abn from 6 for 1)::integer * 9 +
        substring(v_abn from 7 for 1)::integer * 11 +
        substring(v_abn from 8 for 1)::integer * 13 +
        substring(v_abn from 9 for 1)::integer * 15 +
        substring(v_abn from 10 for 1)::integer * 17 +
        substring(v_abn from 11 for 1)::integer * 19
      ) % 89
    ) = 0;
  end if;

  v_phone :=
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'phone',
          ''
        )
      ),
      ''
    );

  if v_account_type in ('WORKSHOP','SELLER') then
  if
    v_business_name is null
    or not v_abn_valid
    or (
      v_account_type = 'SELLER'
      and v_phone is null
    )
  then
    v_account_type := 'DIY';
    v_business_name := null;
    v_abn := null;
    v_phone := null;
  end if;
else
  v_business_name := null;
  v_abn := null;
  v_phone := null;
end if;

if v_account_type = 'WORKSHOP' then
  v_role := 'MECHANIC';
  v_status := 'ACTIVE';
elsif v_account_type = 'SELLER' then
  v_role := 'DIY';
  v_status := 'PENDING_APPROVAL';
else
  v_role := 'DIY';
  v_status := 'ACTIVE';
end if;

insert into public.profiles (
  id,
  email,
  display_name,
  role,
  linked_account,
  requested_account_type,
  business_name,
  abn,
  phone,
  account_status
)
values (
  new.id,
  coalesce(new.email, ''),
  coalesce(
    new.raw_user_meta_data ->> 'name',
    'Unnamed user'
  ),
  v_role,
  null,
  v_account_type,
  v_business_name,
  nullif(v_abn, ''),
  v_phone,
  v_status
)
on conflict (id) do nothing;

return new;
end;
$$;
revoke update on table public.profiles from authenticated;

grant update (display_name)
on table public.profiles
to authenticated;
commit;