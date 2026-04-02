# Delivery Backlog

## Status Legend

- `not-started`
- `in-progress`
- `blocked`
- `done`
- `phase-2`

## Epic Map

| ID | Epic | Roadmap sections | Status | Target phase | Done when |
| --- | --- | --- | --- | --- | --- |
| SW-01 | Strategy, positioning, creative direction, and Saudi voice rules | `1-4` | `in-progress` | Discovery | Positioning, creative direction, tone rules, and content constraints are frozen enough to design against |
| SW-02 | Saudi legal, trust, and compliance surfaces | `5` | `in-progress` | Discovery / Design | Required legal pages, footer trust data, privacy requirements, compliance assumptions, and support surfaces are documented and routed into product requirements |
| SW-03 | Commerce model, taxonomy, sitemap, and home IA | `6-8` | `in-progress` | Discovery | The public IA and home structure are accepted as the working MVP map |
| SW-04 | Category, product, and conversion experience | `9-11`, `27-29` | `in-progress` | Design / Implementation | PLP/PDP patterns, CRO blocks, and advanced merchandising rules are defined and implemented for MVP |
| SW-05 | Admin, catalog, data model, supplier ops, and order operations | `12-13` | `in-progress` | Design / Implementation | The admin scope, product data model, supplier sync assumptions, and order operations flow are explicitly designed, surfaced, and testable through protected internal routes, role-aware identity login, centralized SQLite-backed in-app authorities, trusted-origin mutation enforcement, login throttling, and protected order, notification, plus audit APIs |
| SW-06 | Content system, editorial style, and commercial copy framework | `14`, `18`, `28-29` | `in-progress` | Discovery / Design | Editorial templates, page copy rules, article model, and content ownership plus sample requirements are frozen through explicit governance, while public content status remains honest until real samples and business inputs arrive |
| SW-07 | Keyword strategy, page mapping, and ecommerce SEO direction | `15-21` | `in-progress` | Discovery | Keyword clusters, page-to-intent map, technical SEO direction, and ecommerce SEO priorities are locked for MVP |
| SW-08 | Structured data, internal linking, search, and discoverability systems | `22-26` | `in-progress` | Design / Implementation | Schema inventory, internal linking model, search requirements, and snippet-control strategy are specified and implemented |
| SW-09 | Post-purchase flows, CRM segmentation, analytics, and KPI model | `30-31` | `in-progress` | Growth and Automation | Core lifecycle flows, notification-state rehearsal, analytics plan, and measurement model are implemented and validated |
| SW-10 | Launch gate, QA, and executive readiness | `32-33` | `in-progress` | Validation / Release | Launch checklist, QA evidence, release readiness, and unresolved risks are explicitly tracked |

## MVP Cut

### In Scope for MVP

- premium storefront foundation
- main category architecture
- concern / ingredient / routine-led discovery surfaces
- strong product pages
- journal/blog foundation
- legal and trust surfaces
- SEO-ready architecture
- schema-aware templates
- analytics plan
- admin/ops architecture definition

### Explicitly Deferred Beyond the First Safe Phase

- virtual try-on
- AI-assisted routine suggestions
- membership tiers
- any feature that depends on unresolved catalog, supplier, or data contracts

## Current Phase Deliverables

### Discovery

- normalize the roadmap into execution epics
- lock the public IA
- define the MVP boundary
- expose assumptions and missing inputs
- keep SEO, schema, trust, and content quality visible from day one

### Design and Architecture

- visual direction system
- route architecture
- component/page blueprint
- commerce stack decision
- content and data model
- analytics and schema implementation plan

## Active Risks

- The current codebase now covers the main public discovery surface, including concern-led, routine-led, and ingredient-led navigation, and it now includes internal `/ops`, `/ops/catalog`, and `/ops/orders` rehearsal surfaces, but implementation estimates are still low-confidence until commerce, admin, and hosting boundaries are frozen.
- The roadmap spans storefront, editorial, admin, SEO, analytics, operations, and launch readiness; without an MVP cut it will sprawl.
- Brand polish is still limited until real sample copy or brand assets are available, but ownership and sample requirements are no longer implicit.
- Stack, commerce engine, CMS, and supplier integration details are not frozen yet.
- The broader shop atlas is now live with editorial collection routes for haircare, bodycare, tools, and beauty sets, but those surfaces are still IA/SEO shells until real catalog ownership and merchandising rules are frozen.
- The new server-side collection filters and ingredient discovery surfaces are intentionally narrow and data-backed; any deeper merchandising model must be decided explicitly instead of being improvised inside the current product content.
- Cart, checkout handoff, checkout eligibility rules, confirmation, track-order, internal `/ops`, `/ops/catalog`, `/ops/fulfillment`, `/ops/orders`, `/ops/notifications`, and `/ops/audit` now exist as real rehearsal surfaces, and order, notification, plus audit state now flow through centralized SQLite-backed app authorities instead of browser-only or JSON-only storage, but payment, durable multi-host order routing, stock truth, supplier sync, and external delivery ownership are still unresolved.
- The new ops surfaces made gaps in auth, role separation, and persistent admin ownership more visible; a role-aware identity gate, trusted-origin mutation protection, durable login throttling, and local audit trail now exist for `/ops/*`, but provider-backed RBAC, durable shared audit storage, and backend ownership are still unresolved.
- The roadmap assumes Saudi legal/compliance readiness; this must be validated against the actual business setup before launch claims are made.
- Release hardening has started through CI, manifest, fallback surfaces, a live `/ops/release` plus `/api/ops/release` readiness layer, runtime preflight visibility for public URL and signing/runtime contracts, executable smoke-evidence artifacts, a combined `/api/ops/release/package` contract, an executive `/api/ops/release/packet` contract, a durable `/api/ops/release/history` trail for published release packages, a `/api/ops/release/compare` drift contract between current runtime and the latest published package, a `/api/ops/release/decisions` verdict trail that now rejects false approvals, stale packet reviews, expired review windows, and incomplete blocker acknowledgements while blockers remain, a manager-only decision composer inside `/ops/release` itself, live visibility for whether the latest recorded decision is still current or has gone stale, structured delta visibility for what changed since that decision was recorded, and a manual Render deploy workflow that can publish verified live evidence plus release packages plus release decisions back into the runtime after deploy, and the repository now freezes the primary host to a Render persistent runtime, but the first live service, domain binding, and monitoring are still external blockers.
- Release hardening now also includes framework-level security headers, a health endpoint, controlled share-preview assets at both site and key surface level, automated smoke regression gates, a standalone production runtime, and a Render blueprint aligned with the current SQLite-backed authorities; the manual Vercel workflow is now secondary only.
- FAQ, contact, about, and terms surfaces now exist, and content ownership is frozen through a dedicated ops surface plus `CONTENT-OWNERSHIP.md`, but approved business data, final support channels, and legal review are still missing from the complete Saudi-ready launch set described in the roadmap.

## Next Backlog Move

The broader public IA slice and internal ops rehearsal slice are now in progress for the current storefront scope. The next task is to convert `SW-05`, `SW-09`, and `SW-10` into the next implementation pack:

1. freeze which of the new editorial collections remain in MVP now that the shop atlas and broader category routes are live
2. replace the current SQLite-backed in-app authorities with real backend authority for cart persistence, catalog authority, stock truth, supplier sync, fulfillment routing, notification delivery, order state, payment orchestration, and order routing
3. replace the current protected app-authority rehearsal with real payment, shipping, notification delivery, stock ownership, fulfillment orchestration, and order instrumentation
4. upgrade the current env-backed identity gate into real RBAC, durable audit storage, and provider-backed internal auth after the backend ownership model is active
5. create the first Render service from `render.yaml`, attach the persistent disk, configure the deploy-hook plus live-base-url secrets for the new manual workflow, clear the runtime preflight checks inside `/ops/release`, confirm `/api/ops/release/evidence` reflects the live environment honestly, and wire monitoring around the new `/api/health` endpoint
6. replace provisional trust, support, and legal copy with real approved business data, final support channels, and sample-based brand language
7. complete legal review and operating approvals before any launch claims
