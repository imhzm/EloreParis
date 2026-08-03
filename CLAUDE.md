# Elore Paris

Luxury perfume brand surface and commerce site, plus an editorial journal. Arabic/English, RTL-capable.

Type: `EC` + `CS` · Lane: next-web · Package: `elore-paris`

SkyWave applies here automatically (`C:\Users\h REDA\.claude\CLAUDE.md`). This file adds only what is specific to this repo.

## Plan Of Record

- `roadmap.md` and `FULL_SITE_UPGRADE.md` — scope
- `ROADMAP-EXECUTION-TRACKER.md`, `ROADMAP-DELIVERY-CONTROL-CENTER.md`, `ROADMAP-OPERATING-PLAYBOOK.md` — execution state
- `DELIVERY-BACKLOG.md`, `PROJECT-TRACKER.md` — what is next
- `PROJECT-BRIEF.md` — intent and audience

Continue this sequence. Update the tracker in the same task that changes code. Do not start a parallel plan.

## Stack

Next.js App Router · TypeScript · `sharp` · `@aws-sdk/client-sesv2` for lifecycle email. Dev port **3056**.

## Commands

```
dev        npm run dev            # port 3056
lint       npm run lint
build      npm run build          # next build && node scripts/prepare-standalone.mjs
start      npm run start          # node scripts/start-standalone.mjs
all checks npm run test:all       # scripts/run-all-checks.mjs
```

The build and start path is deliberate. **Never substitute `next start`** — the standalone preparation step is required for the Hostinger release contract.

## Required Gates

These scripts define correctness in this repo. Run the ones your change can affect; run `test:all` before any release claim.

`test:smoke` · `test:production-fence` · `test:release-controls` · `test:content-governance` ·
`test:catalog-authority` · `test:promotion-authority` · `test:site-content-authority` ·
`test:jsonld-security` · `test:hostinger-release` · `test:outbox-worker` ·
`test:provider-auth-security` · `test:provider-callback-security` · `test:ops-lifecycle-source` ·
`test:lifecycle-authority` · `test:lifecycle-delivery` · `test:lifecycle-ses`

Browser regressions are Python: `test:home-3d`, `test:category-cinematic`, `test:full-browser`, `test:live-commerce`.

Never weaken, skip, or reimplement a gate to make a change pass. If a gate is wrong, fix the gate deliberately and say so.

## Domain Rules

- `COMMERCE-BOUNDARY.md` defines what may touch commerce state. Respect it.
- `CONTENT-OWNERSHIP.md` and `CONTENT-EXECUTION-MATRIX.md` govern who owns which copy surface — content changes must stay inside the declared ownership.
- `ANALYTICS-EVENT-MAP.md` is the contract for events. Adding or renaming an event means updating that map in the same change.
- Catalog, promotion, and site content have authority checks because their sources are governed. Do not hardcode values that belong to an authority source.
- Lifecycle email goes through the outbox and the SES adapter — see `LIFECYCLE-EMAIL-PROVIDER-RUNBOOK.md`. Never send directly from a request handler.
- JSON-LD is security-checked. Never interpolate unescaped data into structured data.
- Journal/editorial work follows `JOURNAL-EDITORIAL-BACKLOG.md`; public copy needs real brand samples before it is final.

## Deploy And Rollback

`DEPLOYMENT-RUNBOOK.md` is authoritative. Hostinger VPS, release directory plus symlink swap, then `pm2 reload`. Never edit a live release directory in place. Rollback is a symlink swap back to the previous release.

## Do Not

- replace the standalone build/start scripts with stock Next commands
- bypass a `test:*` gate
- change an analytics event without updating the event map
- ship public copy as final without brand samples
- commit anything from `.artifacts*`, `tmp/`, or `test-results/`
