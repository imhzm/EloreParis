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
- tracking UX
- analytics markers and smoke validation

### Internal Ops Rehearsal Owns Now

- `/ops`
- `/ops/orders`
- `/ops/catalog`
- `/ops/fulfillment`
- local KPI rehearsal
- local supplier and stock rehearsal
- local fulfillment routing logic
- local notification planning

### Must Move To Real Backend Ownership Before Launch

- canonical order record
- stock truth
- supplier sync
- payment orchestration
- shipping orchestration
- delivery notifications
- role-based ops access
- audit trail for sensitive actions

## Access Boundary

- `/ops/*` is internal only
- `/ops-access` is the only public entry point into the ops gate
- production and enforced environments require `OPS_ACCESS_CODE`
- development may remain open unless `ENFORCE_OPS_ACCESS=true`

This is not final authentication. It is a safe boundary that stops the internal rehearsal layer from remaining publicly exposed while the real backoffice is still unresolved.

## Release Implication

Launch cannot be considered complete while these remain local or provisional:

- order persistence
- payment provider handoff
- shipment dispatch ownership
- notification delivery ownership
- final legal/business data
- real ops roles and permissions
