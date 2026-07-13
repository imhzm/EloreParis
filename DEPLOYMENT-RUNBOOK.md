# Deployment Runbook

## Current Release Position

- Phase: `release`
- Hosting direction: `Render-first persistent runtime for the current Next.js storefront`
- Current status: `deploy-ready inside the repo, with a preview-safe Vercel path for staging and a Render-first path for persistent live runtime, but still blocked on the first live service, production domain/env values, and approved business inputs`

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
- `/ops/release` now also exposes a runtime preflight section for the public URL, persistent-path alignment, signing-secret quality, and protected ops bootstrap identities.
- The latest executable smoke-evidence report is exposed through [`/api/ops/release/evidence`](D:/REDA/ksa%20cozmateks/src/app/api/ops/release/evidence/route.ts) and uploaded from CI as an artifact.
- A combined release package is now exposed through [`/api/ops/release/package`](D:/REDA/ksa%20cozmateks/src/app/api/ops/release/package/route.ts) and uploaded from both CI and the live Render workflow as JSON plus Markdown artifacts.
- An executive release packet is now exposed through [`/api/ops/release/packet`](D:/REDA/ksa%20cozmateks/src/app/api/ops/release/packet/route.ts) and uploaded from both CI and the live Render workflow as JSON plus Markdown artifacts.
- Published release packages are now preserved through [`/api/ops/release/history`](D:/REDA/ksa%20cozmateks/src/app/api/ops/release/history/route.ts) and uploaded from both CI and the live Render workflow as release-history JSON plus Markdown artifacts.
- Runtime drift versus the latest published package is now exposed through [`/api/ops/release/compare`](D:/REDA/ksa%20cozmateks/src/app/api/ops/release/compare/route.ts) and uploaded from both CI and the live Render workflow as release-diff JSON plus Markdown artifacts.
- Protected blocker handoffs are now preserved through [`/api/ops/release/handoffs`](D:/REDA/ksa%20cozmateks/src/app/api/ops/release/handoffs/route.ts), and CI plus live Render verification now upload release-handoff JSON plus Markdown artifacts.
- Protected release decisions are now preserved through [`/api/ops/release/decisions`](D:/REDA/ksa%20cozmateks/src/app/api/ops/release/decisions/route.ts), false approvals are rejected while blockers remain, and CI plus live Render verification now upload release-decision JSON plus Markdown artifacts.
- Release decisions are now also bound to the latest executive packet review token, freshness window, and explicit blocked-item acknowledgements, so stale or incomplete hold or approve submissions are rejected before they reach the durable governance trail.
- Protected release decisions now also require a current blocker handoff for the latest executive packet before any hold or approve verdict can be recorded in the durable governance trail.
- `/ops/release` now exposes a manager-only decision composer that reuses those same packet, freshness, and blocker-acknowledgement guards instead of leaving protected verdict recording to API-only callers.
- `/ops/release` now also exposes a manager-only blocker-handoff composer that reuses the same packet and active-owner coverage guards instead of leaving blocker ownership transfer to API-only callers.
- `/api/ops/release/packet` and `/ops/release` now also expose whether the latest recorded release decision is still current, missing, expired, or stale against the current executive packet.
- `/api/ops/release/packet` and `/ops/release` now also expose whether the latest recorded blocker handoff is still current, missing, expired, partial, or stale against the current executive packet.
- `/api/ops/release/packet` and `/ops/release` now also expose a structured delta between the current runtime and the package reviewed by the latest recorded decision, so reviewers can see exactly what changed since the last verdict.
- `/api/ops/release`, `/api/ops/release/package`, `/api/ops/release/packet`, and `/ops/release` now also route each blocked gate to an explicit owner lane, owner route, and next action so the remaining launch work is assignable inside the runtime itself.
- A manual Render deployment workflow now exists at [`deploy-render.yml`](D:/REDA/ksa%20cozmateks/.github/workflows/deploy-render.yml); it can trigger the deploy hook, wait for the live service to become healthy, and publish post-deploy evidence back into the deployed runtime.
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
  Set this to the final production domain once the live hostname is known. Leaving it empty falls back to `RENDER_EXTERNAL_URL`, which is acceptable for rehearsal but still shows as a warning in runtime preflight.
- `AUTHORITY_DB_PATH`
  Keep this on persistent storage. The current blueprint defaults it to `/var/data/authority.sqlite`.
- `RELEASE_EVIDENCE_PATH`
  Keeps the latest smoke evidence on persistent storage. The current blueprint defaults it to `/var/data/release-evidence.json`.
- `OPS_AUTH_USERS_JSON`
  Preferred way to define internal ops identities and roles using username plus password hash. Example shape:
  `[{"id":"ops-manager","name":"Ops manager","role":"manager","username":"ops.manager","passwordHash":"scrypt$..."}]`
- `RENDER_EXTERNAL_URL`
  Provided automatically by Render. The runtime preflight uses it as a hosted fallback, but it does not replace binding the final public site URL.
- `ORDER_AUTHORITY_SECRET`
  Strong server-only secret for recent-order signed access.
- `OPS_ACCESS_SIGNING_SECRET`
  Strong server-only secret for signing ops sessions.
- `ENFORCE_OPS_ACCESS`
  Keep this `true` in any non-local environment.

## Render-Provided Runtime Values

- `RENDER_EXTERNAL_URL`
  Render sets this automatically. The app already uses it when `NEXT_PUBLIC_SITE_URL` is not present.

## GitHub Secrets For The Manual Render Workflow

The manual workflow at [`deploy-render.yml`](D:/REDA/ksa%20cozmateks/.github/workflows/deploy-render.yml) expects:

- `RENDER_DEPLOY_HOOK_URL`
  The deploy hook URL for the primary Render web service.
- `RENDER_SERVICE_BASE_URL`
  The live service base URL used for health, login, release, and evidence verification after deploy.
- `RENDER_OPS_MANAGER_USERNAME`
  A manager-level ops username that is allowed to access `/ops/release`.
- `RENDER_OPS_MANAGER_PASSWORD`
  The password for that manager identity.

Without those secrets, the workflow exits cleanly in skip mode.

## Optional Secondary Vercel Path

The workflow at [`deploy-vercel.yml`](D:/REDA/ksa%20cozmateks/.github/workflows/deploy-vercel.yml) is manual-only and should be treated as a secondary preview/staging path, not the primary release target.

It now defaults to `preview` deployments so staging URLs stay out of search through:

- `APP_ENV=preview` during the Vercel build/deploy path
- `X-Robots-Tag: noindex, nofollow, noarchive`
- preview `robots.txt` returning `Disallow: /`
- preview `sitemap.xml` returning an empty sitemap

If you still want to use it for previews or one-off verification, it requires:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Use the `deployment_target` workflow input only when you intentionally want:

- `preview` for staging/test links
- `production` for the rare case where Vercel is used as a one-off production experiment instead of the primary Render path

## First Deployment Steps

1. Link the repository into Render and create the web service from [`render.yaml`](D:/REDA/ksa%20cozmateks/render.yaml).
2. Confirm the persistent disk is attached at `/var/data`.
3. Set `NEXT_PUBLIC_SITE_URL`, `OPS_AUTH_USERS_JSON`, `ORDER_AUTHORITY_SECRET`, and `OPS_ACCESS_SIGNING_SECRET`.
4. Create the Render deploy hook, then store `RENDER_DEPLOY_HOOK_URL`, `RENDER_SERVICE_BASE_URL`, `RENDER_OPS_MANAGER_USERNAME`, and `RENDER_OPS_MANAGER_PASSWORD` in GitHub secrets.
5. Trigger the manual [`Deploy to Render`](D:/REDA/ksa%20cozmateks/.github/workflows/deploy-render.yml) workflow and wait for it to finish its live verification path.
6. Confirm `/ops/release` now reports the hosting-direction gate as ready and the canonical-runtime gate against the live domain instead of localhost.
7. Confirm the runtime preflight section inside `/ops/release` reports `public-site-url`, `signing-secrets`, and `ops-bootstrap-identities` as ready, and that `persistent-runtime-paths` is no longer blocked.
8. Confirm `/api/ops/release/evidence` now reflects the latest live post-deploy verification report for the deployed build instead of staying empty.
9. Confirm `/api/ops/release/package` now reflects the same live evidence plus the current blockers and next actions from the deployed runtime.
10. Confirm `/api/ops/release/packet` condenses the same live evidence, latest package, latest decision, drift status, and content-governance blockers into one honest runtime packet.
11. Confirm `/api/ops/release/history` includes the newly published live release package record and preserves earlier publication entries.
12. Confirm `/api/ops/release/compare` reports `unchanged` immediately after a healthy live publication or surfaces any drift honestly if the runtime changed again.
13. Confirm `/api/ops/release/decisions` records the expected hold or approval verdict for the latest published package and rejects any false approval while blockers remain.
14. Confirm `/api/ops/release/decisions` also rejects stale review tokens, expired review windows, and incomplete blocked-item acknowledgements that are not based on the latest `/api/ops/release/packet`.
15. Confirm `/ops/release` exposes the manager-only decision composer, shows the latest review token/window, and can record a protected hold decision without bypassing the server-side guards.
16. Confirm `/api/ops/release/packet` and `/ops/release` report the latest decision review as `current` immediately after publication and surface `missing` or stale states honestly before or after drift.
17. Confirm `/api/ops/release/packet` and `/ops/release` also report the structured delta against the latest recorded decision as `unchanged` immediately after publication and explain any later drift honestly.
18. Confirm `/api/ops/release`, `/api/ops/release/package`, and `/api/ops/release/packet` route the remaining blockers to the expected owner lanes and next-action paths instead of leaving them unassigned.
19. Confirm unauthenticated `/ops` redirects to `/ops-access`.
20. Confirm the chosen ops identity can log in through username and password, reaches its allowed default route, and that a lower-privilege role cannot open unauthorized ops pages.
21. Confirm origin-less or cross-origin attempts to mutate `/api/ops/*` and `/api/ops-access/logout` are rejected with `403`.
22. Confirm repeated failed login attempts hit `429` throttling and recover only after the cooldown window.
23. Confirm `/ops/notifications` can read queued delivery items and update a notification state without losing the shared authority database between requests or process restarts.
24. Confirm `/ops/audit` can read recent login, order-state, notification-state, throttling, release-evidence publish, release-package publish, and release-decision publish traces without losing the shared authority database between requests or process restarts.
25. Confirm checkout can create an order and tracking can read it back in the chosen environment without losing the authority database between requests or process restarts.
26. Confirm the homepage, product page, article page, `cart`, and `sitemap.xml` render correctly after deployment.
27. Confirm public launch approval still matches [`CONTENT-OWNERSHIP.md`](D:/REDA/ksa%20cozmateks/CONTENT-OWNERSHIP.md), including sample-pack and business-input gates.

## Rollback Path

- Fast rollback: redeploy the previous successful Render deploy from the dashboard.
- Git rollback: revert the offending commit on `main`, then let Render auto-deploy the reverted build.
- Forward-fix is preferred only when the issue is isolated and clearly understood.
- The Vercel workflow should not be treated as the fast rollback target for the primary live environment.

## Post-Deploy Watchpoints

- `/api/health` returns `status=ok`
- `/ops/release` still exposes runtime blockers honestly after deployment
- `/ops/release` runtime preflight still reflects the real public URL, persistent paths, signing-secret quality, and bootstrap identities after deployment
- `/api/ops/release/evidence` reflects the most recent successful live post-deploy verification run
- `/api/ops/release/package` reflects the latest live evidence plus the current blocker set from the deployed runtime
- `/api/ops/release/packet` reflects the same current blocker set, latest package, latest decision, drift status, and governance blockers in one executive runtime payload
- `/api/ops/release/history` preserves the publication trail for the latest live package and any prior verification snapshots
- `/api/ops/release/compare` shows whether the deployed runtime still matches the latest published package or has drifted since publication
- `/api/ops/release/decisions` preserves the latest hold-versus-approve verdict trail for the published package and refuses false approvals while blockers remain
- `/api/ops/release/decisions` also refuses stale review tokens, expired review windows, and incomplete blocked-item acknowledgements that are not based on the latest executive packet
- `/ops/release` still exposes the manager-only decision composer with the latest review token, review window, and blocker acknowledgement checklist
- `/api/ops/release/packet` and `/ops/release` still expose whether the latest recorded decision is current, missing, expired, or stale against the latest executive packet
- `/api/ops/release/packet` and `/ops/release` still expose the structured delta against the package reviewed by the latest recorded decision
- `/api/ops/release`, `/api/ops/release/package`, and `/api/ops/release/packet` still expose owner-routed blockers, owner routes, and next-action guidance honestly after deploy
- homepage response and metadata
- unauthenticated `/ops` redirects to `/ops-access`
- authenticated `/ops` dashboard still loads correctly
- authorized roles only see the ops routes they are allowed to use
- origin-less or cross-origin ops mutations fail closed
- repeated failed ops logins move into throttled responses
- `/ops/notifications` still loads and preserves queue state after login
- `/ops/audit` still loads and shows recent traces after login, including release-evidence and release-package publication
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
- The current ops audit and release-decision authorities are SQLite-backed inside the app, and they are still not a central durable governance backend for long-lived production operations.
- The current ops auth layer supports username/password identities with signed sessions, but it is still not provider-backed authentication or full RBAC over a central user directory.
- Legal/business production data is still provisional, so a public launch claim would still be premature even after the first live deploy.
