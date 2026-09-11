begin;

-- Account routing is controlled by public.profiles.role. Preserve the tier
-- selected during signup, but never allow a public signup to create ADMIN.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
begin
  requested_role := upper(coalesce(new.raw_user_meta_data ->> 'tier', 'DIY'));

  if requested_role not in ('DIY', 'MECHANIC', 'APPRENTICE', 'SELLER') then
    requested_role := 'DIY';
  end if;

  insert into public.profiles (id, email, display_name, role, linked_account)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', 'Unnamed user'),
    requested_role,
    case
      when requested_role = 'APPRENTICE' then new.raw_user_meta_data ->> 'linkedAccount'
      else null
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Repair profiles created by the faulty DIY-only trigger when the original
-- authenticated signup metadata contains a valid, non-admin requested tier.
update public.profiles as profile
set
  role = upper(auth_user.raw_user_meta_data ->> 'tier'),
  linked_account = case
    when upper(auth_user.raw_user_meta_data ->> 'tier') = 'APPRENTICE'
      then auth_user.raw_user_meta_data ->> 'linkedAccount'
    else null
  end,
  updated_at = now()
from auth.users as auth_user
where profile.id = auth_user.id
  and profile.role = 'DIY'
  and upper(coalesce(auth_user.raw_user_meta_data ->> 'tier', ''))
    in ('MECHANIC', 'APPRENTICE', 'SELLER');

-- Users may edit ordinary profile information, but role assignment remains an
-- administrator-controlled operation. This prevents DIY users becoming a
-- seller, mechanic or admin through a direct client request.
revoke update on table public.profiles from authenticated;
grant update (display_name, linked_account) on table public.profiles to authenticated;

commit;
