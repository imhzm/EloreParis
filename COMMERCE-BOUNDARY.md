# Commerce Boundary

## Current Phase

- phase: `implementation`
- status: `frozen enough to keep building against`
- intent: stop scope drift between storefront, editorial expansion, and internal operations

## MVP Freeze

### Transactional MVP Now

- `skincare`
- `makeup`
- discovery surfaces that feed those two transactional collections:
  - `concerns`
  - `ingredients`
  - `routines`
  - `journal`
- transactional customer routes:
  - `/cart`
  - `/checkout`
  - `/checkout/success`
  - `/track-order`

### Editorial / IA Surfaces Kept Live But Not Yet True Catalog Authority

- `/shop/haircare`
- `/shop/bodycare`
- `/shop/tools`
- `/shop/beauty-sets`

These routes remain valid public surfaces for IA, SEO, and future merchandising, but they are not treated as full operational catalog scope until real product ownership, stock truth, and supplier flow are approved.

## Ownership Map

### Storefront Owns Now

- route architecture
- public content and schema
- discovery-to-product internal linking
- local cart intent
- checkout handoff UX
- order creation through SQLite-backed in-app authority APIs
- tracking UX over the same authority
- analytics markers and smoke validation

### Internal Ops Rehearsal Owns Now

- `/ops`
- `/ops/orders`
- `/ops/catalog`
- `/ops/fulfillment`
- `/ops/notifications`
- `/ops/audit`
- protected ops order APIs
- protected ops notification APIs
- protected ops session and audit APIs
- local KPI rehearsal
- local supplier and stock rehearsal
- centralized SQLite-backed order queue review and status rehearsal
- local fulfillment routing logic
- centralized SQLite-backed notification queue rehearsal
- SQLite-backed session and order audit trace

### Must Move To Real Backend Ownership Before Launch

- durable canonical order record
- stock truth
- supplier sync
- payment orchestration
- shipping orchestration
- durable notification queue and delivery notifications
- identity-backed ops access
- durable audit trail for sensitive actions

## Access Boundary

- `/ops/*` is internal only
- `/ops-access` is the only public entry point into the ops gate
- production and enforced environments require either `OPS_ACCESS_USERS_JSON` or the legacy `OPS_ACCESS_CODE`
- role-aware signed sessions currently gate dashboard, orders, fulfillment, catalog, and audit access
- development may remain open unless `ENFORCE_OPS_ACCESS=true`

This is not final authentication. It is a safe boundary that stops the internal rehearsal layer from remaining publicly exposed while the real backoffice is still unresolved.

## Release Implication

Launch cannot be considered complete while these remain local, single-host, or provisional:

- SQLite-backed order persistence without durable shared backend ownership
- SQLite-backed notification persistence without provider-backed delivery ownership
- SQLite-backed ops audit persistence without durable shared audit backend
- payment provider handoff
- shipment dispatch ownership
- notification delivery ownership
- final legal/business data
- real ops identities, roles, and permissions
