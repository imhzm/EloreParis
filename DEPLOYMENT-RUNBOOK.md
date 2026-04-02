# Deployment Runbook

## Current Release Position

- Phase: `release`
- Hosting direction: `Render-first persistent runtime for the current Next.js storefront`
- Current status: `deploy-ready inside the repo, but still blocked on the first live Render service, production domain/env values, and approved business inputs`

## Why Render Is Now The Primary Direction

- The app now runs on a `Next.js standalone` production artifact instead of assuming `next start`.
- Orders, notifications, audit traces, throttling state, and release evidence all write to local disk-backed SQLite or JSON paths, so the primary host must provide persistent writable storage.
- The repository now includes [`render.yaml`](D:/REDA/ksa%20cozmateks/render.yaml) with a persistent disk mounted at `/var/data`, which matches the current authority model without inventing an external backend that does not exist yet.
- The existing Vercel workflow is still kept as an optional manual path, but it is no longer the authoritative release target while transactional state remains single-host and disk-backed.

## What Is Already Ready

- `lint`, `typecheck`, `build`, and smoke regression checks run locally.
- GitHub Actions CI runs `lint`, `typecheck`, `build`, and smoke checks on every push.
- The repository expects `Node.js 22+` because the shared application authority uses `node:sqlite`.
- The production build now prepares a standalone runtime through [`prepare-standalone.mjs`](D:/REDA/ksa%20cozmateks/scripts/prepare-standalone.mjs).
- Production start now uses [`start-standalone.mjs`](D:/REDA/ksa%20cozmateks/scripts/start-standalone.mjs) instead of `next start`.
- Health checks are exposed through [`/api/health`](D:/REDA/ksa%20cozmateks/src/app/api/health/route.ts).
- Live launch blockers are exposed through [`/api/ops/release`](D:/REDA/ksa%20cozmateks/src/app/api/ops/release/route.ts) and [`/ops/release`](D:/REDA/ksa%20cozmateks/src/app/ops/release/page.tsx).
- The latest executable smoke-evidence report is exposed through [`/api/ops/release/evidence`](D:/REDA/ksa%20cozmateks/src/app/api/ops/release/evidence/route.ts) and uploaded from CI as an artifact.
- Orders, notifications, and ops audit now share one SQLite-backed in-app authority with backward-compatible import from the older rehearsal JSON files.
- Protected ops mutations require a trusted same-origin request instead of relying on signed cookies alone for write safety.
- Repeated failed ops login attempts throttle durably inside the shared SQLite authority.
- Absolute URLs resolve safely from hosted environment variables instead of falling back blindly to localhost.

## Primary Deployment Artifact

- Blueprint: [`render.yaml`](D:/REDA/ksa%20cozmateks/render.yaml)
- Runtime: `Next.js standalone server`
- Start path: [`npm run start`](D:/REDA/ksa%20cozmateks/package.json)
- Persistent mount: `/var/data`
- Default region in the current blueprint: `frankfurt`
  This is the current nearest-region assumption for the target market and can still be edited before the first Render sync if operations choose another region.

## Required Render Environment Values

- `NEXT_PUBLIC_SITE_URL`
  Set this to the final production domain once the live hostname is known.
- `AUTHORITY_DB_PATH`
  Keep this on persistent storage. The current blueprint defaults it to `/var/data/authority.sqlite`.
- `RELEASE_EVIDENCE_PATH`
  Keeps the latest smoke evidence on persistent storage. The current blueprint defaults it to `/var/data/release-evidence.json`.
- `OPS_AUTH_USERS_JSON`
  Preferred way to define internal ops identities and roles using username plus password hash. Example shape:
  `[{"id":"ops-manager","name":"Ops manager","role":"manager","username":"ops.manager","passwordHash":"scrypt$..."}]`
- `ORDER_AUTHORITY_SECRET`
  Strong server-only secret for recent-order signed access.
- `OPS_ACCESS_SIGNING_SECRET`
  Strong server-only secret for signing ops sessions.
- `ENFORCE_OPS_ACCESS`
  Keep this `true` in any non-local environment.

## Render-Provided Runtime Values

- `RENDER_EXTERNAL_URL`
  Render sets this automatically. The app already uses it when `NEXT_PUBLIC_SITE_URL` is not present.

## Optional Secondary Vercel Path

The workflow at [`deploy-vercel.yml`](D:/REDA/ksa%20cozmateks/.github/workflows/deploy-vercel.yml) is now manual-only and should be treated as a secondary experiment path, not the primary release target.

If you still want to use it for previews or one-off verification, it requires:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## First Deployment Steps

1. Link the repository into Render and create the web service from [`render.yaml`](D:/REDA/ksa%20cozmateks/render.yaml).
2. Confirm the persistent disk is attached at `/var/data`.
3. Set `NEXT_PUBLIC_SITE_URL`, `OPS_AUTH_USERS_JSON`, `ORDER_AUTHORITY_SECRET`, and `OPS_ACCESS_SIGNING_SECRET`.
4. Trigger the first build and wait for the service health check to pass on `/api/health`.
5. Confirm `/ops/release` now reports the hosting-direction gate as ready and the canonical-runtime gate against the live domain instead of localhost.
6. Confirm `/api/ops/release/evidence` reflects the latest smoke report for the deployed build.
7. Confirm unauthenticated `/ops` redirects to `/ops-access`.
8. Confirm the chosen ops identity can log in through username and password, reaches its allowed default route, and that a lower-privilege role cannot open unauthorized ops pages.
9. Confirm origin-less or cross-origin attempts to mutate `/api/ops/*` and `/api/ops-access/logout` are rejected with `403`.
10. Confirm repeated failed login attempts hit `429` throttling and recover only after the cooldown window.
11. Confirm `/ops/notifications` can read queued delivery items and update a notification state without losing the shared authority database between requests or process restarts.
12. Confirm `/ops/audit` can read recent login, order-state, notification-state, and throttling traces without losing the shared authority database between requests or process restarts.
13. Confirm checkout can create an order and tracking can read it back in the chosen environment without losing the authority database between requests or process restarts.
14. Confirm the homepage, product page, article page, `cart`, and `sitemap.xml` render correctly after deployment.
15. Confirm public launch approval still matches [`CONTENT-OWNERSHIP.md`](D:/REDA/ksa%20cozmateks/CONTENT-OWNERSHIP.md), including sample-pack and business-input gates.

## Rollback Path

- Fast rollback: redeploy the previous successful Render deploy from the dashboard.
- Git rollback: revert the offending commit on `main`, then let Render auto-deploy the reverted build.
- Forward-fix is preferred only when the issue is isolated and clearly understood.
- The Vercel workflow should not be treated as the fast rollback target for the primary live environment.

## Post-Deploy Watchpoints

- `/api/health` returns `status=ok`
- `/ops/release` still exposes runtime blockers honestly after deployment
- `/api/ops/release/evidence` reflects the most recent successful smoke run
- homepage response and metadata
- unauthenticated `/ops` redirects to `/ops-access`
- authenticated `/ops` dashboard still loads correctly
- authorized roles only see the ops routes they are allowed to use
- origin-less or cross-origin ops mutations fail closed
- repeated failed ops logins move into throttled responses
- `/ops/notifications` still loads and preserves queue state after login
- `/ops/audit` still loads and shows recent traces after login
- no public route is declared "final copy" while still blocked in [`CONTENT-OWNERSHIP.md`](D:/REDA/ksa%20cozmateks/CONTENT-OWNERSHIP.md)
- product and journal share-preview tags
- `cart` and `checkout` still marked `noindex, nofollow`
- smoke-critical routes still load correctly
- GitHub Actions `CI` remains green

## Current Blockers

- No Render service has been created from [`render.yaml`](D:/REDA/ksa%20cozmateks/render.yaml) yet.
- No live production domain is wired into `NEXT_PUBLIC_SITE_URL` yet.
- The current transactional order authority is SQLite-backed inside the app, which now matches the frozen single-host deployment direction, but it is still not a shared durable backend for scale or failover.
- The current notification authority is SQLite-backed inside the app, and it is still not provider-backed delivery ownership.
- The current ops audit authority is SQLite-backed inside the app, and it is still not a central durable audit backend for long-lived production operations.
- The current ops auth layer supports username/password identities with signed sessions, but it is still not provider-backed authentication or full RBAC over a central user directory.
- Legal/business production data is still provisional, so a public launch claim would still be premature even after the first live deploy.
