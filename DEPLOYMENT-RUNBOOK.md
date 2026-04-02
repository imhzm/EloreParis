# Deployment Runbook

## Current Release Position

- Phase: `release`
- Hosting direction: `Vercel-first assumption for the current Next.js storefront`
- Current status: `deploy-ready from a CI perspective, but still blocked on durable transactional hosting and production credentials`

## Why Vercel Is The Current Assumption

- The app is a pure `Next.js App Router` storefront with no custom server requirement today.
- The machine already has the Vercel CLI installed.
- The current roadmap gap is release execution, not framework compatibility.

## What Is Already Ready

- `lint`, `build`, and smoke regression checks run locally.
- GitHub Actions CI runs `lint`, `build`, and smoke checks on every push.
- The repository now expects `Node.js 22+` because the shared application authority uses the built-in `node:sqlite` runtime.
- A secret-gated workflow now exists at [deploy-vercel.yml](D:/REDA/ksa%20cozmateks/.github/workflows/deploy-vercel.yml).
- Health checks are exposed through [`/api/health`](D:/REDA/ksa%20cozmateks/src/app/api/health/route.ts).
- Orders, notifications, and ops audit now share one SQLite-backed in-app authority with backward-compatible import from the older rehearsal JSON files.
- Protected ops mutations now require a trusted same-origin request instead of relying on signed cookies alone for write safety.
- Repeated failed ops login attempts now throttle durably inside the shared SQLite authority.
- Absolute URLs now resolve safely from production/preview environment variables instead of falling back blindly to localhost.

## Required GitHub Secrets

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Without these three secrets, the deploy workflow remains intentionally inactive.

## Recommended Environment Variables

- `NEXT_PUBLIC_SITE_URL`
  Use this when you want a fixed canonical production URL such as `https://cozmateks.com`.
- `AUTHORITY_DB_PATH`
  Primary path for the SQLite-backed in-app authority. This must live on persistent writable storage in any non-local environment, otherwise transactional state will be lost between restarts or serverless invocations.
- `OPS_AUTH_USERS_JSON`
  Preferred way to define internal ops identities and roles using username plus password hash. Example shape: `[{"id":"ops-manager","name":"Ops manager","role":"manager","username":"ops.manager","passwordHash":"scrypt$..."}]`.
  You can generate a hash locally through `npm run ops:hash-password -- "StrongPassword"`.
- `ORDER_AUTHORITY_SECRET`
  Required once transactional routes are deployed anywhere outside local development. Use a strong server-only value distinct from `OPS_ACCESS_CODE`.
- `ORDER_AUTHORITY_FILE`
  Legacy import source for old JSON-based order rehearsal data. Use only if you need one-time carryover into the SQLite authority.
- `NOTIFICATION_AUTHORITY_FILE`
  Legacy import source for old JSON-based notification rehearsal data. Use only if you need one-time carryover into the SQLite authority.
- `OPS_ACCESS_USERS_JSON`
  Legacy fallback for internal ops users that still authenticate through shared access codes. Prefer `OPS_AUTH_USERS_JSON` for any environment closer to production.
- `OPS_ACCESS_CODE`
  Legacy fallback for protecting `/ops/*` in production when you only need one manager-style internal code. Use a strong internal-only value and do not expose it client-side.
- `OPS_ACCESS_SIGNING_SECRET`
  Strong server-only secret for signing ops sessions. Required whenever you use multiple ops users or want the session secret to be distinct from access codes.
- `ENFORCE_OPS_ACCESS`
  Optional local/staging override. Set to `true` when you want to test the ops gate outside production.
- `OPS_AUDIT_FILE`
  Legacy import source for old JSON-based ops audit rehearsal data. Use only if you need one-time carryover into the SQLite authority.

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
7. Confirm the chosen ops identity can log in through username and password, reaches its allowed default route, and that a lower-privilege role cannot open unauthorized ops pages.
8. Confirm origin-less or cross-origin attempts to mutate `/api/ops/*` and `/api/ops-access/logout` are rejected with `403`.
9. Confirm repeated failed login attempts hit `429` throttling and recover only after the cooldown window.
10. Confirm `/ops/notifications` can read queued delivery items and update a notification state without losing the shared authority database between requests or process restarts.
11. Confirm `/ops/audit` can read recent login, order-state, notification-state, and throttling traces without losing the shared authority database between requests or process restarts.
12. Confirm checkout can create an order and tracking can read it back in the chosen environment without losing the authority database between requests or process restarts.
13. Confirm the homepage, product page, article page, `cart`, and `sitemap.xml` render correctly after deployment.

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
- origin-less or cross-origin ops mutations fail closed
- repeated failed ops logins move into throttled responses
- `/ops/notifications` still loads and preserves queue state after login
- `/ops/audit` still loads and shows recent traces after login
- product and journal share-preview tags
- `cart` and `checkout` still marked `noindex, nofollow`
- smoke-critical routes still load correctly
- GitHub Actions `CI` and `Deploy to Vercel` both green

## Current Blockers

- No Vercel credentials are configured on this machine or in GitHub secrets yet.
- No linked Vercel project exists inside this repository yet.
- The current transactional order authority is SQLite-backed inside the app, which is a major step up from JSON rehearsal, but it is still not durable enough for ephemeral/serverless hosting without a persistent backend replacement.
- The current notification authority is SQLite-backed inside the app, but it is still not provider-backed delivery ownership and it remains unsuitable for ephemeral/serverless hosting without persistent storage.
- The current ops audit authority is SQLite-backed inside the app, but it is still not a durable shared audit backend for long-lived production operations or serverless hosting.
- The current ops auth layer now supports username/password identities with signed sessions, but it is still not provider-backed authentication or full RBAC over a central user directory.
- Legal/business production data is still provisional, so a public launch claim would still be premature even after the first deploy.
