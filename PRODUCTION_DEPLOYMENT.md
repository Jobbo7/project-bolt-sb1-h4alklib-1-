# PartsForge production deployment and activation

## Current release status

This repository can be deployed as a Vite application with Vercel serverless API routes. Authentication, vehicle/VIN lookup, parts search, OCR, Stripe Checkout, Stripe PaymentIntents, and verified Stripe webhooks now have production-oriented code paths.

A deployment is not operational until the required provider accounts, environment variables, database migration, webhook, domain, and legal settings below are completed. Basiq, Xero/MYOB, ATO SBR, email delivery, Uber Direct and consolidated freight remain explicit configuration placeholders; the UI no longer reports them as connected when they are not.

Browser local storage still holds workshop operational state such as job cards, hoists, delivered inventory and invoices. That is suitable for a single browser but is not a shared multi-device production database. Before multiple mechanics use the same workshop, these records must be moved to authenticated Supabase tables with audit-safe server writes.

## Required accounts

1. Vercel project connected to the GitHub repository.
2. Supabase project in the required Australian data region.
3. Stripe business account with identity and bank verification completed.
4. PlateAPI production plan for Australian registration lookup.
5. CarRegistrationAPI account if VIN enrichment from registration is required.
6. OCR.Space production account.
7. OpenAI API project if the automotive diagnostic assistant is enabled.
8. Social sourcing provider only if marketplace aggregation is legally licensed.

Optional integrations require separate commercial onboarding: Basiq/open banking, Xero or MYOB OAuth, an ATO-approved SBR software provider, an email provider, Uber Direct, and any national or international freight provider.

## Vercel environment variables

Copy every required name from `.env.example` into Vercel Settings > Environment Variables. Add separate test and production values. Never prefix server secrets with `VITE_`; Vite-prefixed values are public in the browser bundle.

Required for the health check:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PLATE_API_KEY`
- `OCR_SPACE_API_KEY`

Also configure:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `PUBLIC_APP_URL`
- `CARREGISTRATION_USERNAME` when registry VIN enrichment is enabled
- `OPENAI_API_KEY` and `OPENAI_MODEL` when diagnostics are enabled
- `SOCIALCRAWL_API_KEY` only after licensing and privacy review

After deployment, open `https://YOUR_DOMAIN/api/health`. A 200 response with `status: ready` means the required environment names are present. It does not prove provider credentials or billing are valid.

## Supabase setup

1. Link the Supabase CLI to the production project.
2. Apply every SQL file in `supabase/migrations` in timestamp order.
3. Enable email confirmation in Supabase Auth.
4. Set the Site URL to the production domain.
5. Add production and preview callback URLs.
6. Configure custom SMTP before launch.
7. Confirm Row Level Security is enabled on every exposed table.
8. Never expose `SUPABASE_SECRET_KEY` in Vercel variables beginning with `VITE_`.
9. Confirm `anon` has no privileges on `public.profiles` and `authenticated` has only table-level `SELECT` plus column-level `UPDATE` for `display_name` and `linked_account`.

The supplied migrations create authenticated profiles and seller offers with ownership policies, force public signups to the DIY role, and revoke profile-table operations that could bypass or weaken Row Level Security. Operational workshop state still needs normalized tables and migration from browser storage before shared multi-device launch.

## Stripe setup

1. Finish Stripe business verification.
2. Use test keys first.
3. Create a webhook endpoint at `https://YOUR_DOMAIN/api/stripe-webhook`.
4. Subscribe at minimum to `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`, and `charge.refunded`.
5. Put the endpoint signing secret in `STRIPE_WEBHOOK_SECRET`.
6. Test using Stripe test mode and confirm forged webhook requests return HTTP 400.
7. Move to live keys only after order persistence and fulfilment are driven by verified webhook records.

The app no longer collects card numbers or CVC. Stripe Checkout collects payment information.

## Vehicle, VIN and OCR setup

- Plate lookup requires `PLATE_API_KEY`.
- Registration-to-VIN enrichment uses `CARREGISTRATION_USERNAME`.
- VIN decoding uses the public NHTSA vPIC endpoint. Australian coverage can be incomplete; do not treat a partial decode as verified fitment.
- Photo registration scanning requires `OCR_SPACE_API_KEY`.
- Test all Australian states with provider-approved test registrations.
- Add rate limits and provider usage alerts before public launch.

## Build and deployment

Run locally:

```text
npm ci
npm test
npm run typecheck
npm run lint
npm audit --offline
npm run build
npm run preview
```

Deploy by pushing the tested commit to the production branch connected to Vercel. Vercel should use:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm ci`

## Mandatory launch tests

- Create and confirm each account role.
- Confirm an apprentice is linked only to the intended workshop.
- Confirm unauthorized seller writes return 401/403.
- Perform rego, VIN and photo lookup success/failure/rate-limit tests.
- Search parts with and without fitment data.
- Buy through Stripe test Checkout; confirm no card data reaches application logs or storage.
- Verify webhook signature rejection and idempotent fulfilment.
- Confirm purchased stock appears only after verified payment and delivery.
- Allocate delivered stock to a job, remove it back to stock, save, resume and invoice.
- Verify saving and invoicing release the hoist.
- Verify technician audit details survive save/resume and appear on the final invoice.
- Test two browsers and two users concurrently after server persistence is implemented.
- Test backup restoration and audit-log retention.
- Complete mobile, tablet, accessibility and supported-browser testing.

## Legal and operational requirements

Before accepting real customers or payments, obtain professional advice for Australian Privacy Act obligations, data retention, consumer guarantees, payment/refund terms, marketplace seller terms, fitment disclaimers, workshop liability, open-banking consent, tax invoicing, incident response, and cyber insurance. Do not represent unverified fitment or AI diagnostic output as authoritative mechanical advice.

## Known launch blockers

These are not solvable by adding an API key alone:

- Job cards, hoists, delivered stock, invoices and technician history still use browser local storage rather than shared server persistence.
- Stripe webhooks are verified but do not yet write an order/payment record or trigger idempotent fulfilment.
- Checkout line prices originate from the browser. Production checkout must price server-side from immutable catalog/order records.
- Basiq, Xero/MYOB, ATO SBR, email and courier adapters require provider-specific OAuth, webhooks, contracts and data models.
- End-to-end tests and monitoring are not present.
- The unused legacy component tree contains demo/mock screens, although the deployed entry point is `src/App.jsx`.

Do not launch for real money or multiple mechanics until these blockers are closed.
