/*
# Remove unrestricted INSERT RLS policies on parts and sellers

## Background
Security review flagged that `public.parts` and `public.sellers` each had an
INSERT policy (`anon_insert_parts`, `anon_insert_sellers`) whose `WITH CHECK`
clause was `true`, allowing unrestricted inserts from anon/authenticated roles.
This effectively bypasses row-level security for writes.

## Decision
This app has no sign-in screen and the frontend only ever READS from these
tables (search/listing display). There are no client-side inserts into either
table. Therefore the INSERT policies are unnecessary, and the safest fix is to
remove them entirely rather than replace them with a weaker predicate.

## Changes
1. Drop policy `anon_insert_parts` on `public.parts`.
2. Drop policy `anon_insert_sellers` on `public.sellers`.

## Security
- RLS remains ENABLED on both tables.
- SELECT policies (anon, authenticated) remain in place so the app can read.
- UPDATE / DELETE policies (if any) are untouched.
- After this migration, no role (anon or authenticated) can INSERT into either
  table through the PostgREST API. Any future write path must be added as an
  explicit, scoped policy — never `WITH CHECK (true)`.

## Notes
- No data is modified or deleted; only policy definitions are dropped.
- Idempotent: uses `DROP POLICY IF EXISTS`.
*/

DROP POLICY IF EXISTS "anon_insert_parts" ON public.parts;
DROP POLICY IF EXISTS "anon_insert_sellers" ON public.sellers;
