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
| SW-05 | Admin, catalog, data model, supplier ops, and order operations | `12-13` | `in-progress` | Design / Implementation | The admin scope, product data model, supplier sync assumptions, and order operations flow are explicitly designed and scoped |
| SW-06 | Content system, editorial style, and commercial copy framework | `14`, `18`, `28-29` | `in-progress` | Discovery / Design | Editorial templates, page copy rules, article model, and content ownership are defined; content status remains honest |
| SW-07 | Keyword strategy, page mapping, and ecommerce SEO direction | `15-21` | `in-progress` | Discovery | Keyword clusters, page-to-intent map, technical SEO direction, and ecommerce SEO priorities are locked for MVP |
| SW-08 | Structured data, internal linking, search, and discoverability systems | `22-26` | `in-progress` | Design / Implementation | Schema inventory, internal linking model, search requirements, and snippet-control strategy are specified and implemented |
| SW-09 | Post-purchase flows, CRM segmentation, analytics, and KPI model | `30-31` | `in-progress` | Growth and Automation | Core lifecycle flows, analytics plan, and measurement model are implemented and validated |
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

- The current codebase now covers the main public discovery surface, including concern-led, routine-led, and ingredient-led navigation, and it now includes a local internal order-ops surface, but implementation estimates are still low-confidence until commerce, admin, and hosting boundaries are frozen.
- The roadmap spans storefront, editorial, admin, SEO, analytics, operations, and launch readiness; without an MVP cut it will sprawl.
- Brand polish is limited until real sample copy or brand assets are available.
- Stack, commerce engine, CMS, and supplier integration details are not frozen yet.
- The new server-side collection filters and ingredient discovery surfaces are intentionally narrow and data-backed; any deeper merchandising model must be decided explicitly instead of being improvised inside the current product content.
- Cart, checkout handoff, confirmation, track-order, and internal order-ops now exist as real UI surfaces, but they still rely on local storage until payment, order routing, stock, and notification ownership are fixed.
- The roadmap assumes Saudi legal/compliance readiness; this must be validated against the actual business setup before launch claims are made.
- Release hardening has started through CI, manifest, and fallback surfaces, but deployment target and monitoring are still undefined.
- Release hardening now also includes framework-level security headers, a health endpoint, and controlled share-preview metadata, but deployment target and monitoring are still undefined.
- FAQ, contact, about, and terms surfaces now exist, but approved business data, final support channels, and legal review are still missing from the complete Saudi-ready launch set described in the roadmap.

## Next Backlog Move

The release-hardening slice is now in progress for the current storefront scope. The next task is to convert `SW-05`, `SW-09`, and `SW-10` into the next implementation pack:

1. freeze the remaining discovery surface for MVP now that concern-led, routine-led, and ingredient-led hubs are live
2. commerce/admin boundary recommendation, including who owns cart persistence, order state, payment orchestration, and order routing
3. replace the local checkout handoff plus local ops rehearsal with real payment, shipping, notifications, and order instrumentation
4. choose the deployment target and wire continuous deployment plus monitoring around the new `/api/health` endpoint
5. replace provisional trust, support, and legal copy with real approved business data and final support channels
6. complete legal review and operating approvals before any launch claims
