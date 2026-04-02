# Deployment Runbook

## Current Release Position

- Phase: `release`
- Hosting direction: `Vercel-first assumption for the current Next.js storefront`
- Current status: `deploy-ready but not deployed from this repository yet`

## Why Vercel Is The Current Assumption

- The app is a pure `Next.js App Router` storefront with no custom server requirement today.
- The machine already has the Vercel CLI installed.
- The current roadmap gap is release execution, not framework compatibility.

## What Is Already Ready

- `lint`, `build`, and smoke regression checks run locally.
- GitHub Actions CI runs `lint`, `build`, and smoke checks on every push.
- A secret-gated workflow now exists at [deploy-vercel.yml](D:/REDA/ksa%20cozmateks/.github/workflows/deploy-vercel.yml).
- Health checks are exposed through [`/api/health`](D:/REDA/ksa%20cozmateks/src/app/api/health/route.ts).
- Absolute URLs now resolve safely from production/preview environment variables instead of falling back blindly to localhost.

## Required GitHub Secrets

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Without these three secrets, the deploy workflow remains intentionally inactive.

## Recommended Environment Variables

- `NEXT_PUBLIC_SITE_URL`
  Use this when you want a fixed canonical production URL such as `https://cozmateks.com`.
- `ORDER_AUTHORITY_SECRET`
  Required once transactional routes are deployed anywhere outside local development. Use a strong server-only value distinct from `OPS_ACCESS_CODE`.
- `ORDER_AUTHORITY_FILE`
  Optional override for the current file-backed order authority path. Keep it on persistent storage if you use it outside local or CI rehearsal environments.
- `NOTIFICATION_AUTHORITY_FILE`
  Optional override for the current file-backed notification authority path. Keep it on persistent storage if you use it outside local or CI rehearsal environments.
- `OPS_ACCESS_USERS_JSON`
  Preferred way to define internal ops users and roles. Example shape: `[{"id":"ops-manager","name":"Ops manager","role":"manager","accessCode":"..."}]`.
- `OPS_ACCESS_CODE`
  Legacy fallback for protecting `/ops/*` in production when you only need one manager-style internal code. Use a strong internal-only value and do not expose it client-side.
- `OPS_ACCESS_SIGNING_SECRET`
  Strong server-only secret for signing ops sessions. Required whenever you use multiple ops users or want the session secret to be distinct from access codes.
- `ENFORCE_OPS_ACCESS`
  Optional local/staging override. Set to `true` when you want to test the ops gate outside production.
- `OPS_AUDIT_FILE`
  Optional override for the current file-backed ops audit log path. Keep it on persistent storage if you use it outside local or CI rehearsal environments.

If `NEXT_PUBLIC_SITE_URL` is absent, the app now falls back in this order:

1. `RENDER_EXTERNAL_URL`
2. `VERCEL_PROJECT_PRODUCTION_URL` when `VERCEL_ENV=production`
3. `VERCEL_BRANCH_URL`
4. `VERCEL_URL`
5. local `http://localhost:3056`

## First Deployment Steps

1. Create or link the Vercel project.
2. Add the three GitHub secrets listed above.
3. Set `NEXT_PUBLIC_SITE_URL` in Vercel if the project already has a stable production domain.
4. Push to `main` or trigger the workflow manually.
5. Confirm the deployment URL returns `200` on `/api/health`.
6. Confirm unauthenticated `/ops` redirects to `/ops-access`.
7. Confirm the chosen ops role reaches its allowed default route and that a lower-privilege role cannot open unauthorized ops pages.
8. Confirm `/ops/notifications` can read queued delivery items and update a notification state without losing the notification file between requests.
9. Confirm `/ops/audit` can read recent login, order-state, and notification-state traces without losing the audit file between requests.
10. Confirm checkout can create an order and tracking can read it back in the chosen environment without losing the authority files between requests.
11. Confirm the homepage, product page, article page, `cart`, and `sitemap.xml` render correctly after deployment.

## Rollback Path

- Fast rollback: redeploy the previous successful Vercel deployment from the dashboard.
- Git rollback: revert the offending commit on `main`, then allow the deploy workflow to publish the reverted build.
- Forward-fix is preferred only when the issue is isolated and clearly understood.

## Post-Deploy Watchpoints

- `/api/health` returns `status=ok`
- homepage response and metadata
- unauthenticated `/ops` redirects to `/ops-access`
- authenticated `/ops` dashboard still loads correctly
- authorized roles only see the ops routes they are allowed to use
- `/ops/notifications` still loads and preserves queue state after login
- `/ops/audit` still loads and shows recent traces after login
- product and journal share-preview tags
- `cart` and `checkout` still marked `noindex, nofollow`
- smoke-critical routes still load correctly
- GitHub Actions `CI` and `Deploy to Vercel` both green

## Current Blockers

- No Vercel credentials are configured on this machine or in GitHub secrets yet.
- No linked Vercel project exists inside this repository yet.
- The current transactional order authority is file-backed and not durable enough for a real production launch on ephemeral/serverless hosting without a persistent backend replacement.
- The current notification authority is file-backed and not durable enough for a real production launch on ephemeral/serverless hosting without a persistent backend replacement.
- The current ops audit authority is file-backed and not durable enough for long-lived production auditing on ephemeral/serverless hosting without a persistent backend replacement.
- Legal/business production data is still provisional, so a public launch claim would still be premature even after the first deploy.
