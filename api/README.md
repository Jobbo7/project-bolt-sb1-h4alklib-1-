# PartsForge Garage

PartsForge is a Vite/React workshop application for vehicle identification, parts sourcing, purchase allocation, hoist-based job cards, invoices and technician audit records.

## Start locally

1. Copy `.env.example` to `.env.local` and add test credentials.
2. Run `npm ci`.
3. Run `npm run dev`.
4. Open the local address printed by Vite.

## Verify

Run `npm run typecheck`, `npm run lint` and `npm run build` before deployment.

## Production

Read `PRODUCTION_DEPLOYMENT.md` before connecting real accounts, accepting payments or allowing multiple mechanics to use the workshop. It contains the exact environment variables, provider setup, test checklist and known launch blockers.
