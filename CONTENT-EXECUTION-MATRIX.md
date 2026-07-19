# Content Execution Matrix

## Purpose

This file converts the current public route graph into a content execution system.

It answers:

- which routes are only structurally complete
- which routes already contain usable provisional content
- which routes still behave like placeholders
- what copy pack should be executed next

This file is the Pack 01 operating document referenced by [ROADMAP-EXECUTION-TRACKER.md](ROADMAP-EXECUTION-TRACKER.md).

## Snapshot

- Last updated: `2026-04-03`
- Phase: `Pack 01 - content system completion`
- Content status: `provisional`
- Brand sample status: `missing`
- Business input status: `missing`
- Working assumption: route structure is real, but public content is still behind the roadmap
- Active slice: `Pack 03 - Storefront conversion depth`

## Status Rules

- `approved`: ready for public launch without a content caveat
- `provisional`: usable and intentionally written, but still blocked on brand samples or business approval
- `placeholder`: structurally honest, but too thin or too transitional to count as finished content
- `missing`: required by the roadmap but not yet expressed as a complete content surface

## Surface Matrix

| Priority | Surface group | Current routes | Status | What exists now | Main blocker | Next content action |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Homepage | `/` | `provisional` | Copy Pack A is live with stronger hero framing, CTA hierarchy, discovery logic, and trust-linked narrative | Missing sample-based brand voice, proof, and final commercial narrative | Brand-polish the homepage once real samples and commercial proof inputs are available |
| 1 | Shop atlas | `/shop` | `provisional` | Copy Pack A reframed the route as a customer-facing commercial hub with clearer category intent | Category and merchandising depth still need collection-level expansion | Move into collection and PDP copy so the atlas has stronger downstream surfaces |
| 1 | Filtered commerce collections | `/shop/skincare`, `/shop/makeup` | `provisional` | Copy Pack B is executed with stronger category intros, filter guidance, zero-result recovery, decision language, product-card proof chips, route-limited support links, and a first merchandising-path layer that pushes users from shortlist to PDP/routine/article/concern more intentionally | Real catalog authority, proof hierarchy, and deeper merchandising are still limited | Continue Pack 03 with stronger bundles, cross-sell sequencing, and richer catalog-backed proof |
| 2 | Editorial collections | `/shop/haircare`, `/shop/bodycare`, `/shop/tools`, `/shop/beauty-sets` | `provisional` | Copy Pack E is executed with stronger decision lanes, live-path cards, trust bridges, and clearer collection-specific discovery logic | Real catalog authority, proof hierarchy, and product depth are still limited | Support these routes with Issue 29 content and deeper merchandising once catalog proof expands |
| 1 | Concern hub | `/concerns` | `provisional` | Copy Pack B is executed and the hub now reads as a problem-first decision surface | The problem system still needs broader concern coverage and stronger proof inputs | Expand concern clustering and add richer concern-to-solution guidance as the catalog grows |
| 1 | Concern detail | `/concerns/[slug]` | `provisional` | Copy Pack B is executed with clearer symptom framing, fit guidance, and next-step routing | Concern depth is still limited by the small product/article inventory | Add objection handling and richer concern-specific support as more PDP and journal inventory lands |
| 2 | Routine hub | `/routines` | `provisional` | Copy Pack E is executed with family grouping, quick-start entries, clearer decision rules, and stronger route-to-route navigation | Product depth and article inventory still limit how far each routine can extend commercially | Use Issue 29 and future PDP depth to strengthen proof and pairings without reverting to shell-like copy |
| 2 | Routine detail | `/routines/[slug]` | `provisional` | Copy Pack E is executed with clearer step reasoning, connected surfaces, honest empty states, and next-step sequencing | Some routine families still depend on thin product and editorial depth | Add richer proof, objections, and deeper pairings as catalog and Journal inventory grow |
| 2 | Ingredient hub | `/ingredients` | `provisional` | Copy Pack E is executed with role-led grouping, quick starts, and stronger ingredient-to-route logic across skincare, makeup, haircare, and bodycare | Ingredient authority is still provisional and not backed by a mature editorial issue cadence | Use Issue 29 and future ingredient explainers to deepen search and commerce bridges |
| 2 | Ingredient detail | `/ingredients/[slug]` | `provisional` | Copy Pack E is executed with fit notes, watchouts, connected surfaces, honest zero states, and clearer shopping bridges | Product/article depth and sample-based claims rules are still limited | Add richer myth-handling, editorial support, and more precise proof once the next issue and product inputs land |
| 1 | Product detail | `/products/[slug]` | `provisional` | Copy Pack B is executed and the PDP template now frames fit, usage, variants, pairings, FAQ, a decision-proof stack, and tighter objection-control plus support-route framing more commercially | Product voice, proof hierarchy, and final claims rules are still not frozen | Continue Pack 03 with purchase-panel/cart-adjacent objections, stronger bundles, and sample-based product language when brand and catalog inputs mature |
| 1 | Journal index | `/journal` | `provisional` | Copy Pack D plus Issues 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, and 29 are executed with issue-level navigation, a refreshed featured lead, clearer pillar grouping, and a twenty-nine-issue Journal system | Voice is still provisional and the publishing cadence is not yet operationalized | Keep the same system stable while Pack 03 deepens PDP and PLP conversion logic |
| 1 | Journal articles | `/journal/[slug]` | `provisional` | Copy Pack D plus Issues 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, and 29 now give the article template stronger issue context, related-route logic, and one hundred and twenty linked articles across twenty-nine issues | The article program is still sample-missing and not yet deep enough for a mature editorial cadence | Expand issue inventory only after Pack 03 closes and real editorial samples exist |
| 1 | Trust hub | `/trust` | `provisional` | Copy Pack A tightened the trust-center framing and made the hub read closer to a real buying-decision surface | Final company data and legal approvals are absent | Replace provisional trust inputs with approved operating data and tighten the trust-to-commerce bridge further |
| 1 | Trust policy details | `/trust/[slug]` | `provisional` | Policy templates are well structured and honest about publication limits | Real policy content and legal data are missing | Replace provisional policy language with approved business, shipping, returns, and privacy data |
| 2 | FAQ | `/faq` | `provisional` | Route is useful and structured | Needs tighter alignment with real support, delivery, and returns rules | Update answers after support and policy inputs are finalized |
| 1 | Contact | `/contact` | `provisional` | Good support logic and escalation framing exist | Final contact channels and response SLAs are not approved | Replace channel placeholders with real owner-backed support routes and SLA language |
| 1 | About | `/about` | `provisional` | Copy Pack A now explains the operating model, positioning, and trust logic more clearly | Final company narrative and founder story inputs are missing | Replace provisional narrative with approved brand story and operator-backed business context |
| 2 | Terms | `/terms` | `provisional` | Route exists and is indexable as a policy surface | Legal copy is not yet approved | Replace with final legal language after review |
| 3 | Transactional support copy | `/cart`, `/checkout`, `/checkout/success`, `/track-order` | `provisional` | Real transactional surfaces exist and work structurally | Microcopy is functional, not yet polished or provider-backed | Tighten checkout, order-status, and support language after backend/provider decisions |

## Route Groups That Still Behave Like Foundation Work

These routes exist and are useful, but should still be treated as incomplete in roadmap reporting:

- all trust, support, and legal pages that depend on approved business data
- all PDP copy until claims, tone, and proof rules are frozen
- the Journal until it has a repeatable issue cadence and sample-based editorial voice

## Copy Pack Sequence

### Copy Pack A

Scope:

- `/`
- `/shop`
- `/about`
- `/trust`

Goal:

- lock the public narrative layer
- make the site sound intentional, not only well structured

Status:

- `completed on 2026-04-02`

Exit gate:

- the homepage and supporting narrative routes can explain what ÉLORÉ PARIS is, who it is for, why it is different, and how trust is earned

### Copy Pack B

Scope:

- `/shop/skincare`
- `/shop/makeup`
- `/products/[slug]`
- `/concerns`
- `/concerns/[slug]`

Goal:

- turn discovery routes into conversion-ready commerce surfaces

Status:

- `completed on 2026-04-03`

Exit gate:

- each route explains fit, shopping logic, and next action in direct customer language

### Copy Pack C

Scope:

- `/faq`
- `/contact`
- `/terms`
- `/trust/[slug]`

Goal:

- replace provisional support/legal wording with operationally honest business wording

Exit gate:

- support and policy surfaces stop carrying publication caveats that exist only because business inputs are missing

### Copy Pack D

Scope:

- `/journal`
- `/journal/[slug]`
- journal cluster intros and linking rules

Goal:

- turn the Journal from a foundation surface into a real editorial engine

Status:

- `completed on 2026-04-03`

Exit gate:

- there is a visible article program, not only a route and a few examples

### Copy Pack E

Scope:

- `/shop/haircare`
- `/shop/bodycare`
- `/shop/tools`
- `/shop/beauty-sets`
- `/routines`
- `/routines/[slug]`
- `/ingredients`
- `/ingredients/[slug]`

Goal:

- close the gap between route coverage and content depth on the expansion surfaces

Status:

- `completed on 2026-04-03`

Exit gate:

- these routes stop reading as transitional expansion placeholders

## Missing From The Current Public Content System

The roadmap still implies content surfaces or content depth that are not yet fully expressed:

- a proper VIP or loyalty narrative, if still in scope
- a clear gift and occasion content system beyond the beauty-sets route
- a mature review and UGC content layer
- a structured article publishing plan by keyword cluster and buyer stage
- sample-based brand voice rules applied consistently across all public routes

## Definition Of Done For A Public Content Surface

A route does not count as content-complete unless it has all of the following:

1. clear audience and intent
2. non-generic page intro
3. meaningful section logic
4. real internal-link purpose
5. conversion or next-step clarity
6. no hidden dependence on missing business facts
7. language that can survive launch review

## Immediate Work Order

1. Copy Packs A, B, D, and E are complete.
2. Continue `Pack 03 / Storefront conversion depth` from the validated PLP/PDP proof slice into bundles and purchase-flow objections.
3. Keep Copy Pack C visible, but do not force final support/legal copy before business inputs exist.
4. Expand conversion depth only through route families that already have meaningful public copy, proof, and internal-link targets.

## Companion Files

- Operating playbook: [ROADMAP-OPERATING-PLAYBOOK.md](ROADMAP-OPERATING-PLAYBOOK.md)
- Master progress tracker: [ROADMAP-EXECUTION-TRACKER.md](ROADMAP-EXECUTION-TRACKER.md)
- Editorial backlog: [JOURNAL-EDITORIAL-BACKLOG.md](JOURNAL-EDITORIAL-BACKLOG.md)
- Content governance: [CONTENT-OWNERSHIP.md](CONTENT-OWNERSHIP.md)
