# Roadmap Operating Playbook

## Purpose

This file is the execution playbook for turning [roadmap.md](roadmap.md) into a real delivery system.

Use it when the question is not only:

- "How much is done?"

But also:

- "What exactly will be built next?"
- "What counts as real progress?"
- "How should the component keep working without getting lost in shells, scattered ideas, or vanity percentages?"

This file sits above the slice trackers.

Use it together with:

- [ROADMAP-EXECUTION-TRACKER.md](ROADMAP-EXECUTION-TRACKER.md) for the honest macro percentage
- [CONTENT-EXECUTION-MATRIX.md](CONTENT-EXECUTION-MATRIX.md) for public-surface content status
- [JOURNAL-EDITORIAL-BACKLOG.md](JOURNAL-EDITORIAL-BACKLOG.md) for the Journal program
- [CONTENT-OWNERSHIP.md](CONTENT-OWNERSHIP.md) for ownership and launch gates
- [ROADMAP-DELIVERY-CONTROL-CENTER.md](ROADMAP-DELIVERY-CONTROL-CENTER.md) for day-to-day execution control, queue, and reporting discipline

## Current Truth Snapshot

- Last updated: `2026-04-05`
- Full-roadmap completion: `79.4%`
- Current phase: `implementation and validation`
- Launch status: `not launch-ready`
- Public content status: `provisional`
- Current operating pack: `Priority 2 / Pack 04`
- Current active slice: `Dashboard ownership حقيقي`, after validating the `Pack 05` provider integration slice

### What is true right now

- The repo is no longer an empty shell.
- The route graph is broad and usable.
- The content layer is partially real, not finished.
- The Journal is now materially stronger and spans twenty-nine issues.
- Eight validated Pack 03 slices are now live across filtered collection routes, PDP decision surfaces, the product purchase panel, the cart review surface, checkout continuation, post-checkout tracking continuity, editorial collection merchandising, atlas-level shop/concern hub routing, the new supplier-lane authority plus provider-bound bundle discipline inside the PDP purchase panel and `/checkout`, and the cart-level authority handoff closure on `/cart`.
- The first two validated `RW-09` transition slices are now live on `/ops/orders`, `/ops/fulfillment`, and `/ops`, where order cards, fulfillment routing, and dashboard summaries expose carrier, dispatch window, owner lane, supplier mode, payment authority, and blocker visibility from the same authority contract instead of status progression alone.
- The first validated `RW-08` catalog-truth slice is now live on `/ops/catalog`, where product records expose authority lanes, live-demand linkage, pending-unit pressure, supplier watch state, and sync visibility instead of acting as static admin records only.
- The second validated `RW-08` slice now exposes provider-handoff state, payment lane, shipping lane, next-owner routing, and blocker discipline across `/checkout` and `/ops/orders`, so the storefront and ops queue now describe the same rehearsal contract instead of diverging.
- The third validated `RW-08` slice is now live on `/ops/release` and `/api/ops/release/packet`, where ops auth, guest order access, payment routing, and shipping execution are surfaced as an explicit runtime integration contract instead of remaining implicit provider debt.
- The fourth validated `RW-08` slice now folds those same provider lanes into `releaseReadiness`, release-package blocker trails, and smoke-verified executive packet publication so provider ownership survives handoff and decision flows instead of disappearing at packet-review time.
- The fifth validated `RW-08` slice now persists provider-binding state per order, exposes protected ops provider actions plus signed payment/shipping callback routes, threads payment and tracking references into customer tracking surfaces, and makes smoke walk the real payment-link and shipping callback lifecycle before status transitions are allowed.
- The sixth validated `RW-08` slice now refreshes a durable same-device order-access session after trusted order lookups, lets `/track-order` resume through that session without re-entering phone-last-four on the same device, and makes smoke prove the session-backed customer access path before cross-device fallback is needed.
- The seventh validated `RW-08` slice now upgrades provider callbacks from simple state flips into settlement and carrier-booking contracts that persist settlement references, booking references, tracking numbers, and carrier event ids through the same order authority and customer-facing order surfaces.
- The eighth validated `RW-08` slice now upgrades customer access from one-order continuity only into a verified `/account/orders` hub that reads all same-customer orders from the current authority through a signed customer-access session on the device.
- The ninth validated `RW-08` slice now adds signed `/account/access` handoff links, lets `/api/orders/[orderNumber]` trust the same verified customer-access session across same-customer orders, and proves cross-device customer continuity through smoke instead of keeping customer access bound to the originating device.
- The tenth validated `RW-08` slice now routes that signed `/account/access` handoff through `/api/providers/auth`, mints provider-signed customer-account authority plus refreshed customer/order access cookies, and makes smoke prove that `/account/orders` and tracked-order API reads survive the provider-backed auth handoff across devices without reopening phone-last-four.
- The eleventh validated `RW-08` slice now turns payment-link creation, shipping booking, queued notification delivery, and `/api/providers/*` auth handoff into the same outbound provider contract, replaces the last local-only provider rehearsal on those lanes, and makes smoke run a mock provider server that proves payment, shipping, notification, and auth execution end-to-end.
- The second validated `Copy Pack C` slice is now live on `/terms` and `/trust/[slug]`, and route-level support/legal hardening is structurally complete across the four intended surfaces.
- Copy Pack E is now complete across editorial collections, routines, and ingredient surfaces.
- The dashboard and launch layers are still below roadmap expectations, even though the Pack 05 provider contract is now validated in-repo.

### What is not true yet

- The project is not near launch closure.
- The content is not sample-based.
- The admin/dashboard is not yet a real operational backoffice.
- Live provider credentials/cutover plus business/legal inputs are still incomplete.

## Non-Negotiable Execution Rules

1. A route does not count as done because it exists.
2. A route counts only when it has:
   - clear intent
   - real content logic
   - internal-link purpose
   - next-step clarity
   - validation after implementation
3. No percentage is raised before validation.
4. Every slice must update its tracker in the same delivery pass.
5. Public content remains `provisional` until real brand/editorial samples exist.
6. Admin, commerce authority, and launch claims remain non-final until backed by real providers and approved business inputs.

## Delivery Model

The project will continue in packs, not in random page edits.

### Pack 01: Content System Completion

Roadmap coverage:

- sections `14`, `28`, `29`
- parts of `1-5`

Objective:

- make the public site read like a real commerce/content system, not a broad structure with thin copy

Sub-packs:

- `Copy Pack A` -> complete
- `Copy Pack B` -> complete
- `Copy Pack C` -> in progress, with `/faq`, `/contact`, `/terms`, and `/trust/[slug]` now validated at the route level while owner-backed legal/support data still blocks final launch versions
- `Copy Pack D` -> complete
- `Copy Pack E` -> complete
- Pack 01 customer-facing discovery routes are materially complete, while Copy Pack C now remains blocked only at the owner-input layer rather than the route-hardening layer.

#### Copy Pack E scope

- `/shop/haircare`
- `/shop/bodycare`
- `/shop/tools`
- `/shop/beauty-sets`
- `/routines`
- `/routines/[slug]`
- `/ingredients`
- `/ingredients/[slug]`

#### Copy Pack E expected output

- expansion routes stop reading as transitional placeholders
- routines and ingredient surfaces gain stronger intros, decision logic, and next-step clarity
- editorial collections become more commercially honest

#### Copy Pack E status

- completed on `2026-04-03`

#### Copy Pack E exit gate

- these route families can support internal linking, discovery, and conversion without relying on future pages to feel meaningful

#### Copy Pack E validation

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- runtime checks for every changed route
- `GET /api/health`

### Pack 02: Journal And Editorial Rollout

Roadmap coverage:

- section `18`
- parts of `15-26`

Objective:

- move from a single opening issue to a repeatable editorial engine

Next output:

- `Priority 2 / Pack 04: Dashboard ownership حقيقي`
- keep the now-validated Pack 05 provider contract as the backend reference while `/ops` absorbs real catalog, supplier, order, notification, release, and audit ownership
- keep `/terms` and `/trust/[slug]` provisional until owner-backed support/legal inputs arrive rather than inventing final legal/business data
- use the storefront authority contract now visible on PDP/cart/checkout plus `/ops/orders` + `/ops/fulfillment` + `/ops` + `/ops/catalog` + `/ops/release` as the reference layer while commerce authority and provider layers are being tightened

Exit gate:

- the Journal has issue cadence, not only strong starter inventory

### Pack 03: Storefront Conversion Depth

Roadmap coverage:

- sections `9-11`, `27`

Objective:

- deepen category, PDP, merchandising, UGC, bundles, and conversion support

Expected output:

- stronger cross-sell logic
- better proof hierarchy
- better shade/fit/bundle guidance
- more honest selling surfaces

Exit gate:

- commerce pages behave like decision systems, not static product showcases

### Pack 04: Admin And Dashboard Completion

Roadmap coverage:

- sections `12-13`

Objective:

- turn internal ops into a usable operating backoffice

Expected output:

- stronger catalog operations
- supplier and order workflows
- customer and content administration
- dashboard logic that supports real operators

Exit gate:

- core admin workflows are usable beyond rehearsal mode

### Pack 05: Backend Authority And Provider Integration

Roadmap coverage:

- sections `12-13`, `30`, `31`

Objective:

- replace local/rehearsal authority with real provider-backed ownership

Expected output:

- payment provider
- shipping provider
- notifications provider
- auth/provider-backed permissions
- more durable commerce data ownership

Exit gate:

- commerce operations are no longer built on SQLite-only rehearsal assumptions

### Pack 06: Launch And Compliance Closure

Roadmap coverage:

- sections `5`, `32-33`

Objective:

- clear legal, business, deploy, and monitoring blockers before any honest launch claim

Expected output:

- live hosting
- domain
- monitoring
- legal/support approval
- real operating data in trust/policy surfaces

Exit gate:

- launch claim becomes truthful

### Pack 07: Growth And Automation

Roadmap coverage:

- sections `30-31`

Objective:

- activate lifecycle, segmentation, measurement loops, and automation after the operating model is real

Expected output:

- CRM/lifecycle flows
- growth segmentation
- post-purchase automation
- KPI loops tied to actual operations

Exit gate:

- growth systems are active on top of a stable operating product

## Definition Of Done By Surface Type

### Public route

A public route is not done until it has:

1. a clear page role
2. real intro and section logic
3. real internal-link purpose
4. honest CTA or next-step path
5. matching metadata/schema where relevant
6. validation after implementation

### Journal article

A Journal article is not done until it has:

1. answer-first opening
2. real buyer/search intent
3. concern/routine/product/ingredient bridge
4. FAQ
5. next-step block
6. placement inside a live editorial pillar

### Dashboard/admin surface

An internal surface is not done until it has:

1. operator use-case clarity
2. auth boundary
3. empty/loading/error states
4. truthful data flow
5. operational value beyond UI existence

## Required Tracker Updates After Every Real Slice

After each meaningful delivery slice, update:

1. [ROADMAP-EXECUTION-TRACKER.md](ROADMAP-EXECUTION-TRACKER.md)
2. the pack-specific working file:
   - [CONTENT-EXECUTION-MATRIX.md](CONTENT-EXECUTION-MATRIX.md)
   - [JOURNAL-EDITORIAL-BACKLOG.md](JOURNAL-EDITORIAL-BACKLOG.md)
   - or another slice tracker that actually changed
3. [PROJECT-TRACKER.md](PROJECT-TRACKER.md) only when the engineering/release slice itself changes

## Percentage Update Rules

Percentages must move only when a slice changes reality, not when a page count increases.

### Allowed reasons to increase percentage

- route family changed from `placeholder` to `provisional`
- inventory depth changed materially
- an execution pack or sub-pack was validated and closed
- a real blocker was removed

### Not allowed as reasons to increase percentage

- adding shell pages
- changing visual polish alone
- writing plans without implementation
- moving wording in docs without changing delivery state

## Operating Commands

These are the default validation commands for implementation slices in this repo:

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

Runtime verification should include:

```powershell
Invoke-WebRequest http://127.0.0.1:3056/api/health
Invoke-WebRequest http://127.0.0.1:3056/<changed-route>
```

Release-specific slices may add:

- smoke checks
- Render live simulation
- release package / packet verification

## Current Working Queue

### Now

1. Continue `RW-08 / RW-09 transition`
2. Keep `Copy Pack C` in maintenance mode with owner-blocked legal/business data visible, instead of reopening finished route hardening
3. Use the now-validated provider-backed payment/shipping/notification/auth contract across `/checkout`, `/account/access`, `/account/orders`, `/ops/orders`, `/ops/notifications`, `/ops/release`, and the smoke flow as the backend reference while Pack 04 pulls dashboard ownership forward

### Immediately after

1. revisit Issue 30 only after dashboard ownership stops being the current blocker
2. replace provisional wording on `/terms` and `/trust/[slug]` only when owner-backed support/legal inputs arrive
3. then move deeper into launch/deployment validation
4. then revisit admin/dashboard depth where operational ownership is still thin

## Slice Reporting Template

Every future slice should report:

1. what roadmap pack it belongs to
2. what changed in real delivery state
3. what percentages changed and why
4. what remains blocked
5. what the next slice is

## Final Operating Statement

The project should now be managed as:

- a real multi-pack delivery program
- not a page-building exercise
- not a design-only exercise
- not a release-only exercise

The next correct move is not more shell expansion.
It is disciplined continuation of `RW-08 / RW-09` after the validated provider-backed customer auth handoff, then deeper admin/provider closure in order.
