# PartsForge production readiness audit — 28 August 2026

## Verified in this package

- Vercel is configured for the Vite frontend and serverless `/api` routes, with baseline security headers and a restrictive Content Security Policy.
- Supabase authentication is used in the browser. Runtime roles are now read from the protected `profiles` table instead of user-editable authentication metadata.
- Public signup can no longer self-assign privileged roles at the database trigger. New users start as `DIY`; elevated roles require a controlled server/admin process.
- Seller offer writes require a valid Supabase session and a `SELLER` profile under Row Level Security.
- Stripe Checkout now requires an authenticated user, rebuilds prices and stock from `seller_offers`, creates a persistent pending order, and ignores browser-supplied prices.
- Signed Stripe webhook events are stored idempotently. A checkout is marked paid only after `checkout.session.completed` reports paid.
- AutoInfo `PartsListDx` has a server-only SOAP adapter and authenticated route at `/api/autoinfo-parts`. It is deliberately unavailable until real AutoInfo credentials are configured.
- Sensitive API routes have a best-effort per-instance rate limiter, request IDs, timeouts, and structured logs without credentials.
- The UI hard-coded admin credential and false “Stripe live/payment processed” messages were removed or corrected.
- Public signup creates DIY accounts only. Mechanic, apprentice, seller and admin roles require controlled assignment after verification; browser-supplied signup metadata is not trusted for authorization.

## Local validation — 2 September 2026

- `npm run build` passes (1,544 modules transformed; the generated application bundle is approximately 441 kB before gzip).
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm test` passes nine supplier, catalogue, configuration fail-closed and signup-role security tests.
- A merge simulation against the fetched `main` commit (`6237055`) reports no conflicts; `main` is the branch merge base.
- The vulnerable transitive `ws` package is pinned to patched version `8.21.3` through an npm override. npm resolves the override correctly and reports zero known vulnerabilities from the available audit data.
- Both Vercel Preview projects build successfully and the Seller Terminal renders without browser console errors. Neither project currently has environment variables configured, so authenticated and provider-backed runtime behaviour remains unverified.

## Required configuration before integration tests

- Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
- Stripe: test `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and exact `PUBLIC_APP_URL`.
- AutoInfo: `AUTOINFO_USER_ID`, `AUTOINFO_AUTH_CODE`, permitted catalogue brands/data, test approval, and production approval. `AUTOINFO_SITE_LIC_CODE` is reserved for operations that require it.
- Vehicle/OCR providers: `PLATE_API_KEY`, optional `CARREGISTRATION_USERNAME`, and `OCR_SPACE_API_KEY`.

No credentials were present in the audited package, so none of these integrations was represented as live or successfully exercised.

## Critical remaining gaps

1. The GitHub branch and both Vercel Preview projects are connected and build successfully. Preview environment variables are empty, so Supabase, Stripe test mode, vehicle/OCR providers and AutoInfo cannot yet be integration-tested.
2. Job cards, hoists, invoices, approvals, delivery state and technician history remain largely browser-local. They need tenant-scoped Supabase tables, server commands, RLS and audit history before multi-user use.
3. Paid orders do not yet reserve/decrement supplier stock transactionally or create fulfilment jobs. Add a Postgres transaction/RPC invoked idempotently by the webhook worker.
4. Refund and payment-failure reconciliation needs reliable mapping from Stripe objects to `orders`; store order IDs on every PaymentIntent/Charge and handle async methods.
5. Marketplace payments are not designed. Decide whether PartsForge or each supplier is merchant of record before implementing Stripe Connect, fees, payouts, disputes and refunds.
6. Supplier inventory/pricing needs provider adapters, freshness timestamps, branch-level availability, account-specific trade-price controls, stale-data behaviour, and supplier data contracts.
7. AutoInfo needs vehicle-resolution routes and licensed production credentials. `PartsListDx` is ready for a provider test but has not been credential-tested.
8. The in-memory rate limiter is only per serverless instance. Replace or augment it with shared Redis/KV enforcement and provider quotas before public traffic.
9. Monitoring needs a production service, alert routing, release/environment tags, uptime probes, performance thresholds and secret-safe retention rules.
10. Privacy/security work remains: Australian privacy notice, retention/deletion process, data inventory, incident response, backups/restore tests, MFA policy for privileged users, admin audit UI, dependency scanning and penetration testing.
11. Local build, typecheck, lint and the current nine-test suite pass. Coverage remains narrow: live authentication, database RLS, signed Stripe webhook events, provider responses and full browser journeys still need integration and end-to-end tests.
12. The dependency lock pins `ws` to patched version `8.21.3` and the local audit reports zero known vulnerabilities. CI or the Vercel Preview build should still verify a clean `npm ci` from the registry.
13. Browser compatibility metadata is outdated. Refresh it in a network-enabled maintenance pass and review the resulting lockfile diff before commit.

## Production activation sequence

1. Move these changes into the real Git repository and review the diff.
2. Apply all Supabase migrations in a non-production project and exercise RLS with DIY, mechanic, apprentice, seller and manually assigned admin accounts.
3. Configure AutoInfo test credentials and run the 2014 Toyota Hiace oil-filter fixture while recording the returned vehicle ID, SKUs, permission scope and response latency.
4. Configure Stripe test mode, create an offer/order, verify browser price tampering is rejected, replay the same webhook, and confirm one paid transition only.
5. Implement shared operational persistence, inventory reservation and fulfilment before connecting live Stripe keys.
6. Add shared rate limiting, monitoring, backups and incident/privacy controls.
7. Validate the Vercel preview, then complete a controlled production release checklist with rollback.
