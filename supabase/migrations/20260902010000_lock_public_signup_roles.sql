begin;

-- Never trust public auth metadata for authorization. Every public signup
-- starts as DIY; elevated roles are assigned through a controlled service-role
-- or administrator process after the account has been verified.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, role, linked_account)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', 'Unnamed user'),
    'DIY',
    null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

revoke update on table public.profiles from authenticated;
grant update (display_name, linked_account) on table public.profiles to authenticated;

commit;
