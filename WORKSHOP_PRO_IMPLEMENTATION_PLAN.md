# PartsForge Workshop Pro implementation plan

Target product: one paid plan at A$49/month, plus a deliberately limited Free level. Parts search and supplier procurement are excluded from the Workshop Pro v1 launch path.

## Current architecture conflicts

- Production-critical workshop data currently converges into one `workshop_state.state` JSON document per authenticated user. That is not a shared workshop tenant model and concurrent saves are last-write-wins.
- `profiles.role` is an account-level role. It cannot express membership in more than one workshop or workshop-specific permissions.
- Employee linking and purchase approvals are browser workflows. Approval and payment state are not authoritatively separated.
- Job cards, customers, vehicles and invoices are React state first; several helper functions explicitly return browser-only or provider-not-configured results.
- Marketplace Stripe Checkout is a secure one-time order flow, but it has no subscription or Workshop Pro entitlement model.
- `/api/vehicle-lookup` is public, has no workshop quota ledger and has no durable shared rate limiter.
- Parts search is coupled to the current workshop screen. It must be isolated as a future marketplace module, not presented as a Workshop Pro entitlement.

## Phase 1 — tenancy and normalized database (this change)

### Migration

Add `20260921000000_workshop_pro_tenancy.sql` containing:

- `workshops`, `workshop_members`
- `customers`, `vehicles`
- `repair_jobs`, `job_items`, `job_events`
- `invoices`, `invoice_items`
- `purchase_requests`, `purchase_approvals`
- `subscriptions`, `subscription_events`
- `workshop_entitlements`, `vehicle_lookup_usage`
- workshop membership helper functions, owner bootstrap RPC, indexes, grants and workshop-scoped RLS

`workshop_state` remains untouched during migration. It is a compatibility fallback until normalized reads and writes pass Preview tests.

### Existing files to modify in later phases

- `src/App.jsx`: replace operational JSON-state reads/writes incrementally; remove marketplace controls from the Workshop Pro path; add subscription/usage surfaces.
- `src/workshop-state.js`: retain only during migration, then restrict to non-critical preferences or remove after data migration.
- `src/mockBackend.js`: replace browser-only job persistence and simulated invoice/email/accounting helpers.
- `src/components/CollisionRepairConsole.tsx`: write assessments into normalized jobs/events rather than a separate owner-only record.
- `api/vehicle-lookup.js`: require session, resolve workshop, enforce entitlement/quota, cache and record usage.
- `api/stripe-webhook.js`: add subscription events while preserving marketplace order reconciliation.
- `api/_lib/auth.js`: add workshop membership and entitlement helpers.
- `src/auth-session.js` and signup UI in `src/App.jsx`: select/bootstrap a workshop after authentication.

### New files/endpoints required later

- `api/_lib/workshop-access.js`
- `api/workshops.js`, `api/workshop-members.js`, `api/workshop-invitations.js`
- `api/customers.js`, `api/vehicles.js`, `api/repair-jobs.js`, `api/invoices.js`
- `api/invoices/[id]/pdf` equivalent Vercel route
- `api/purchase-requests.js`, `api/purchase-approvals.js`
- `api/create-subscription-checkout.js`
- `api/create-billing-portal-session.js`
- `api/subscription-status.js`
- scheduled subscription reconciliation endpoint

## Phase 2 — core workshop workflow

Reuse the existing job-card arithmetic, hoist UI, vehicle intake and invoice presentation. Replace state mutations with row-level repository/API operations. Use optimistic version columns and narrow row updates to avoid whole-document overwrites.

Tests: create customer/vehicle/job; two users edit different job records; complete job; history survives logout/new device; invoice totals are reproduced server-side; marketplace data is not required.

## Phase 3 — staff and approvals

Implement expiring invitations, 2–3 staff limit, accepted memberships and server-side OWNER/MANAGER/TECHNICIAN permissions. Purchase requests and approvals use distinct request and payment states. Remove the browser path that archives an approved request as paid.

Tests: invitation lifecycle, staff limit, role escalation denial, technician purchase request, owner decision, unpaid approval remains unpaid, cross-workshop denial.

## Phase 4 — vehicle lookup security

Authenticate every lookup, resolve active workshop, enforce Free/Pro quota, record provider/cached/error outcomes, add a shared limiter, and cache only where the provider agreement permits. Initial limits: Free 3 introductory lookups; Pro 25 per billing month.

Tests: anonymous denial, Free and Pro limits, cached-repeat accounting rule, two-workshop isolation, reset at billing boundary, provider 429 behavior.

Dependencies: PlateAPI Growth-or-better customer-facing licence, shared Redis/KV limiter, confirmed caching terms.

## Phase 5 — real invoices

Generate immutable invoice snapshots from database records. Produce PDFs server-side containing business, customer, vehicle, job, line, GST, total, date and status data. Store invoice records and either store the generated PDF or deterministically regenerate the same version.

Tests: invoice numbering, cents-based totals, GST, immutable completed invoice, PDF content, owner/staff access, cross-workshop denial, archive persistence.

Dependencies: PDF library/runtime, object storage, transactional email provider if email is enabled.

## Phase 6 — Stripe Workshop Pro

Reuse Stripe Checkout/webhook verification and event idempotency. Add `mode: subscription`, Stripe customer/subscription mapping, Customer Portal, lifecycle events, grace period and reconciliation. Stripe remains payment authority; PartsForge stores status projections and entitlements only.

Tests: Checkout mapping, replay, renewal, failure, grace, cancellation, reactivation, out-of-order events, portal ownership, reconciliation.

Dependencies: Stripe Product/Price, webhook event configuration, Preview and Production secrets kept separate.

## Phase 7 — server entitlements

All Pro API operations call a common server entitlement check. Frontend visibility is convenience only. Free limits are enforced by database/API rules.

Tests: direct API bypass attempts, suspended subscription, Free job/staff/archive limits, owner versus staff access.

## Phase 8 — production hardening

Use Supabase Pro backups, Vercel Pro, transactional email, monitoring, alerting and documented restore/rollback. Run RLS, concurrency, subscription lifecycle and full browser E2E tests in Preview before Production changes.

## Rollback strategy

- Each phase uses additive migrations first. Existing `workshop_state`, marketplace tables and marketplace endpoints remain intact.
- Frontend cutovers use explicit read/write adapters and can be reverted to the previous commit while normalized tables remain dormant.
- Do not drop legacy columns/tables until normalized production data has been reconciled, backed up and exercised through a rollback drill.
- Stripe subscription activation is introduced behind a server-side feature flag and Preview-only Price ID before Production.
- Database migrations must have a tested compensating migration; never roll back by deleting customer records.

## Preview exit criteria for Phase 1

- Migration applies cleanly to an empty database and an upgraded Preview database.
- Workshop creation creates exactly one OWNER membership.
- User A cannot select, insert, update or delete User B's tenant records.
- Anonymous access is denied.
- Existing `workshop_state`, marketplace checkout and Preview login tests still pass.
- No Production migration or deployment occurs.
