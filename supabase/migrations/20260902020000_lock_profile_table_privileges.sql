begin;

-- Supabase projects may grant broad table privileges when tables are created.
-- RLS does not protect TRUNCATE, so revoke every inherited/default privilege
-- before granting only the operations the browser application requires.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, linked_account) on table public.profiles to authenticated;

commit;
