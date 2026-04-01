# Project Tracker

## Snapshot

- Start date: 2026-04-01
- Last updated: 2026-04-02
- Current phase: `implementation`
- Overall completion: `80%`
- Current focus: fulfillment expansion through real checkout eligibility rules plus internal `/ops/fulfillment`, connected to routing, COD decisions, and notification planning
- Forecast status: `date not committed yet`
- Working estimate: `12-16 weeks for an MVP after stack, catalog model, and integration scope are frozen`

## Progress Model

Progress is tracked against SkyWave phases, not by ad-hoc task count.

| Phase | Weight | Status | Progress | Exit gate |
| --- | ---: | --- | ---: | --- |
| Discovery | 15% | In Progress | 78% | Brief, sitemap, user flows, MVP boundary, backlog, open decisions |
| Design and Architecture | 20% | In Progress | 70% | Design system direction, page architecture, stack and data decisions |
| Implementation | 35% | In Progress | 94% | Public storefront and required internal surfaces implemented |
| Validation | 10% | In Progress | 88% | Lint, typecheck, tests, UX QA, SEO/schema QA, accessibility QA |
| Release | 10% | In Progress | 63% | Deployment target, configs, monitoring, legal/trust gates, rollback path |
| Growth and Automation | 10% | In Progress | 50% | CRM flows, SEO growth loops, analytics maturity, post-launch automations |

## Current Discovery Checklist

- [x] Reviewed repository instructions and roadmap source
- [x] Classified the project under SkyWave
- [x] Selected the active skill bundle for the current phase
- [x] Created the normalized brief
- [x] Created a structured delivery backlog
- [x] Created a baseline progress tracker
- [x] Chosen and scaffolded the web stack
- [x] Bound local development to port `3056`
- [x] Implemented the first homepage foundation slice
- [x] Passed lint and production build for the current slice
- [x] Built a shared storefront shell with header, footer, and trust links
- [x] Added public page shells for category, journal, article, and trust surfaces
- [x] Added public page shells for concern, routine, and product surfaces
- [x] Added concern-led and routine-led hub pages as real crawlable routes
- [x] Added `robots.txt` and `sitemap.xml` generation
- [x] Expanded sitemap coverage for concern, routine, and product routes
- [x] Verified live route responses on port `3056`
- [x] Added vendor-neutral page and CTA analytics instrumentation
- [x] Documented the event map for public discovery and conversion flows
- [x] Verified instrumentation markers in rendered HTML on live routes
- [x] Converted trust and legal content from a hub-only page to real policy routes
- [x] Replaced footer hash links with crawlable trust policy URLs
- [x] Expanded sitemap coverage for trust policy routes
- [x] Added a real makeup collection route and linked it from primary navigation and homepage discovery entries
- [x] Expanded the route graph with makeup-specific product, concern, routine, and article content
- [x] Implemented the internal `/search` route promised by homepage schema
- [x] Added privacy-safe analytics for search submit and search result clicks
- [x] Verified live search responses and rendered search result markers on port `3056`
- [x] Added real collection filter interactions on skincare and makeup surfaces
- [x] Added zero-result handling and clear-filter recovery on collection pages
- [x] Added `filter_apply` analytics coverage for collection filtering
- [x] Added canonical/noindex handling for filtered collection states
- [x] Added filtered `ItemList` schema output for visible collection results
- [x] Added a real cart state layer with product-variant add-to-cart flows
- [x] Added `/cart` and `/checkout` review routes as noindex transactional surfaces
- [x] Added cart and checkout intent analytics for product, cart, and review steps
- [x] Verified live cart and checkout responses plus noindex metadata on port `3056`
- [x] Replaced the review-only checkout step with a real checkout handoff form
- [x] Added local order persistence, confirmation, and track-order surfaces
- [x] Added `checkout_complete` and `track_order_lookup` analytics coverage
- [x] Added footer support links for order tracking, cart, and internal search
- [x] Verified live noindex responses for checkout, checkout success, and track-order routes on port `3056`
- [x] Added real crawlable `/faq` and `/contact` support routes
- [x] Added FAQPage and ContactPage structured data for the new support surfaces
- [x] Connected FAQ and contact support links into the trust hub, footer support cluster, and sitemap
- [x] Verified live support route responses and sitemap coverage for `/faq` and `/contact` on port `3056`
- [x] Added real crawlable `/about` and `/terms` support/legal routes
- [x] Added AboutPage and terms WebPage structured data plus footer and sitemap coverage for the new surfaces
- [x] Verified live support/legal route responses and sitemap coverage for `/about` and `/terms` on port `3056`
- [x] Added real crawlable `/ingredients` and `/ingredients/[slug]` discovery routes
- [x] Added ingredient result groups to internal search and sitemap coverage
- [x] Linked ingredient discovery into home, concern, product, journal, and hub routes
- [x] Verified live ingredient, search, and sitemap responses on port `3056`
- [x] Added an internal `/ops/orders` route for local order-operations review
- [x] Added local order status progression helpers and a minimal operating queue surface
- [x] Added analytics coverage for internal order status updates
- [x] Verified live internal ops and supporting transactional routes on port `3056`
- [x] Initialized Git in the project root and connected a GitHub remote
- [x] Added GitHub Actions CI and verified a successful run on push
- [x] Added branded `not-found` and `global-error` fallback surfaces
- [x] Added `manifest.webmanifest` and release-facing browser metadata
- [x] Added a live `/api/health` endpoint for deployment checks and monitoring
- [x] Added safe default security headers at the framework level
- [x] Added generated Open Graph and Twitter share metadata for release-facing previews
- [x] Added page-specific social preview surfaces for product and article detail pages
- [x] Added automated smoke regression checks for key public, SEO, and transactional routes
- [x] Verified smoke regression checks locally and on GitHub Actions
- [x] Added deploy-safe public URL resolution for hosted environments
- [x] Added a secrets-gated Vercel deployment workflow for future continuous deployment
- [x] Added a deployment runbook covering secrets, rollout, rollback, and watchpoints
- [x] Added a real `/shop` atlas route for the broader catalog roadmap
- [x] Expanded the route graph with editorial collection pages for `haircare`, `bodycare`, `tools`, and `beauty-sets`
- [x] Expanded internal search coverage to return the new collection surfaces
- [x] Expanded sitemap and smoke regression coverage for the new shop routes
- [x] Verified live `/shop`, `/shop/haircare`, search, and sitemap responses on port `3056`
- [x] Added a real internal `/ops` dashboard route for KPI, fulfillment, and supplier-risk rehearsal
- [x] Added a real internal `/ops/catalog` route for catalog, supplier, stock, and margin review
- [x] Added a local catalog/admin data layer for supplier ownership, sync logs, low-stock checks, and exception queues
- [x] Expanded analytics page typing and smoke regression coverage for the new internal ops routes
- [x] Verified live `/ops` and `/ops/catalog` responses and noindex behavior on port `3056`
- [x] Added shared operational supplier and variant rules for COD eligibility, shipping class, and low-stock review
- [x] Applied route-aware checkout rules for shipping, payment, and manual review before order creation
- [x] Added a real internal `/ops/fulfillment` route for routing, split-shipment, and notification rehearsal
- [x] Expanded order confirmation and track-order surfaces to expose fulfillment and notification state instead of bare status only
- [x] Expanded analytics and smoke regression coverage for fulfillment and checkout-option behavior
- [ ] Freeze MVP scope vs later phases
- [ ] Freeze hosting direction
- [ ] Freeze commerce architecture and admin boundary
- [ ] Freeze content ownership and sample requirements

## Current Status by Quality Layer

| Layer | Status | Notes |
| --- | --- | --- |
| UX / IA | In Progress | Home, `/shop`, skincare, makeup, haircare, bodycare, tools, beauty sets, search, ingredient hub/detail, concern hub/detail, routine hub/detail, product, cart, checkout handoff, checkout success, track-order, internal `/ops`, internal `/ops/catalog`, internal `/ops/fulfillment`, internal ops/orders, FAQ, contact, about, terms, journal, article, and trust surfaces now exist as real routes, and the main collection pages support real filter states with zero-result recovery |
| SEO / AEO / GEO | In Progress | Metadata, route structure, internal links, journal flow, robots, sitemap, and release-facing share metadata now cover the broader shop atlas plus collection, ingredient, concern, routine, product, trust, FAQ, contact, about, terms, and internal search discovery templates, with dedicated commerce/editorial social previews on PDPs and articles, deploy-safe absolute URL resolution for hosted environments, filtered collection states canonicalized back to the main category URL, and transactional `cart` / `checkout` routes marked `noindex,nofollow` |
| Schema strategy | In Progress | JSON-LD foundations exist on home, category, ingredient, concern, routine, product, journal, article, trust, FAQ, contact, about, and terms routes, and filtered collection plus ingredient discovery states now emit result-aware `ItemList` markup |
| Accessibility | In Progress | Semantic layout and skip-link exist; full QA is still pending, but smoke coverage now protects core route rendering from silent regressions |
| Security / Privacy | In Progress | Trust, privacy, shipping, returns, authenticity, FAQ, contact, about, and terms surfaces now exist as real public routes, track-order now uses order reference plus phone last-4 instead of exposing full customer details, and the app now emits safe default security headers; real business data, final support channels, and legal review are still pending |
| Performance / CWV | In Progress | Next.js foundation is in place; runtime and asset optimization still pending |
| Analytics / Conversion | In Progress | Page views, global navigation, core CTA instrumentation, internal search submit/result events including ingredient result groups, collection `filter_apply`, ingredient route links, `add_to_cart`, `cart_update`, `checkout_start`, `checkout_option_change`, `checkout_complete`, `track_order_lookup`, internal ops route page typing, and internal `ops_order_status_update` are now wired; real payment completion and lifecycle notifications are still pending |
| Content system | In Progress | Editorial, concern, routine, product, collection, trust, FAQ, contact, about, and terms shells exist, but voice remains provisional until real samples exist |
| Release / Ops | In Progress | Local runtime is stable on port `3056`, local order references now exist for confirmation and tracking, internal `/ops`, `/ops/catalog`, `/ops/fulfillment`, and `/ops/orders` surfaces now rehearse KPI review, catalog ownership, routing, supplier exceptions, notification planning, and order progression without claiming a real backoffice, the codebase is now on GitHub with CI verified on push, branded fallback plus manifest surfaces now exist, `/api/health` is available for deployment checks, dedicated share-preview assets now exist at both site and high-value surface level for release distribution, smoke checks now guard critical release surfaces in CI, and a secret-gated Vercel deployment workflow plus explicit runbook now exist; first live deployment, monitoring ownership, auth, and real order backend ownership are still pending |

## Milestone Log

### 2026-04-01

- Discovery started.
- `roadmap.md` was reviewed and normalized into a project brief.
- Delivery epics were mapped to roadmap sections.
- Baseline completion was set to `5%`.
- Finish date was intentionally left uncommitted until stack and architecture decisions are frozen.
- A `Next.js` foundation was scaffolded directly in the project root.
- The default placeholder page was replaced with a premium Arabic-first homepage foundation.
- Local development was bound to port `3056`.
- `npm run lint` and `npm run build` both passed.
- A shared storefront shell was introduced for the public surface.
- New public routes were implemented for `shop/skincare`, `journal`, `journal/[slug]`, and `trust`.
- `robots.txt` and `sitemap.xml` are now generated by the app.
- Live HTTP verification passed for the homepage, category, journal, article, trust, robots, and sitemap routes.
- Concern, routine, and product routes were added as SSG templates.
- `npm run lint` and `npm run build` passed again after expanding the route graph and sitemap coverage.
- A vendor-neutral analytics layer was added for `page_view`, `navigation_click`, and `cta_click`.
- Key discovery and conversion links now emit stable machine-friendly analytics labels.
- Runtime HTML was verified to include analytics markers on the homepage and product page.
- Trust policy routes were added for verification, privacy, shipping, returns, and authenticity.
- Footer trust navigation now points to crawlable policy pages instead of in-page anchors.
- Trust policy pages now contribute to internal linking, analytics coverage, and sitemap completeness.
- A real `/shop/makeup` route was added to the public storefront and linked from the main navigation and homepage discovery entries.
- Makeup-specific product, concern, routine, and article content were added to expand the internal linking graph and route inventory.
- `npm run lint` and `npm run build` passed again after expanding the collection graph.
- Real `/concerns` and `/routines` hub routes were added to close the main discovery loop between collections, problems, routines, and products.
- Product, concern, and routine detail pages now return users to the correct collection or hub instead of defaulting back to skincare.
- `npm run lint` and `npm run build` passed again after adding the new hub surfaces and sitemap entries.
- A real `/search` route was added to fulfill the homepage SearchAction target instead of leaving a dead schema path.
- Internal search now supports Arabic and English commercial terms across collections, products, concerns, routines, and journal content.
- Search submit and search-result click analytics were added without storing raw queries.
- Journal article collection links now respect the article collection instead of always returning to skincare.
- Real filter interactions were added to `/shop/skincare` and `/shop/makeup` using query-param state instead of decorative chips.
- Collection pages now show zero-result recovery, clear-filter actions, and filtered companion links to related concern, routine, and article surfaces.
- `filter_apply` analytics was added and validated alongside the new collection filtering layer.
- Filtered collection states now canonicalize back to the base category route, emit `noindex,follow`, and expose filtered `ItemList` schema for visible results.
- `npm run lint` and `npm run build` passed again after wiring filter state into the collection pages.
- A local cart state layer was added to support product-variant add-to-cart actions without introducing a premature backend dependency.
- Product pages now include a purchase panel and a mobile sticky add-to-cart CTA tied to the cart state.
- Real `/cart` and `/checkout` review routes were added as transactional noindex surfaces.
- `add_to_cart`, `cart_update`, and `checkout_start` analytics were added across product, cart, and checkout review steps.
- `npm run lint` and `npm run build` passed again after shipping the cart and checkout slice.
- The review-only checkout step was replaced with a checkout handoff form that collects delivery and payment preferences.
- Local order persistence was added so checkout now creates a saved order reference instead of ending at a static review surface.
- New transactional routes were added for `/checkout/success` and `/track-order`, both marked `noindex,nofollow`.
- `checkout_complete` and `track_order_lookup` analytics were added to cover the new order-creation and post-checkout tracking flow.
- Footer support links now expose track-order, cart, and internal search as operational support surfaces.
- `npm run lint` and `npm run build` passed again after shipping the order handoff and tracking slice.
- Real `/faq` and `/contact` routes were added to close part of the mandatory Saudi-ready support surface from the roadmap.
- The trust hub now links into FAQ and contact support pages instead of limiting trust navigation to policy-only routes.
- FAQPage and ContactPage structured data were added, and `/faq` plus `/contact` now appear inside the live sitemap.
- `npm run lint` and `npm run build` passed again after shipping the FAQ and contact slice.
- Real `/about` and `/terms` routes were added to complete the current support/legal surface planned for the public storefront.
- AboutPage and terms structured data were added, and `/about` plus `/terms` now appear inside the live sitemap.
- Footer trust and support navigation now expose the wider support/legal surface through real crawlable pages.
- `npm run lint` and `npm run build` passed again after shipping the about and terms slice.
- Real `/ingredients` and `/ingredients/[slug]` routes were added to close the ingredient-led discovery gap in the public storefront.
- Internal search now returns ingredient result groups, and ingredient routes now appear in the live sitemap.
- Ingredient links now connect home, concern, product, journal, and discovery hubs instead of leaving the ingredient layer isolated.
- `npm run lint` and `npm run build` passed again after shipping the ingredient discovery slice.
- A real internal `/ops/orders` route was added to review and advance locally stored order states without pretending a backend admin already exists.
- Local order helpers now expose the next valid status and update order state safely inside the current browser storage model.
- `ops_order_status_update` analytics was added so internal ops rehearsal has measurable state transitions before real backend ownership is selected.
- `npm run lint` and `npm run build` passed again after shipping the internal order-operations slice.
- Git was initialized in the project root and the codebase was pushed to a new private GitHub repository under `ireda8041-lab/ksa-cozmateks`.
- A GitHub Actions CI workflow now runs `npm ci`, `npm run lint`, and `npm run build` on every push and pull request to `main`.
- The first two CI runs completed successfully after the initial push and workflow upgrade.
- Branded `not-found` and `global-error` surfaces were added so public fallback states no longer rely on default framework responses.
- A generated `manifest.webmanifest` plus browser-facing metadata were added to strengthen install/readiness signals before deployment.
- A live `/api/health` route was added for deployment checks, uptime probes, and future monitoring hooks.
- Safe default security headers are now emitted on app responses through Next.js config instead of leaving the public surface without framework-level hardening.
- A generated Open Graph preview image plus root Twitter/Open Graph metadata were added so the storefront has a controlled share surface instead of generic unfurled links.
- Product and journal detail pages now point to dedicated commerce and editorial share-preview assets instead of inheriting one generic site-wide share card.
- A production smoke runner now boots the built app, checks health, verifies critical routes, confirms transactional noindex behavior, and validates page-level share-preview assets.
- GitHub Actions now execute the smoke runner after the production build so runtime regressions are caught before future release claims.
- Site URL resolution now respects hosted environment variables so metadata, sitemap, and robots no longer depend on a localhost fallback in real deployments.
- A secret-gated Vercel deployment workflow and an explicit deployment runbook now exist, so the repository is prepared for continuous deployment once credentials are supplied.
- A real `/shop` atlas route now exposes the broader catalog direction from the roadmap instead of limiting the public IA to skincare and makeup only.
- Editorial collection routes now exist for `haircare`, `bodycare`, `tools`, and `beauty-sets`, and those routes are wired into search, sitemap, and smoke regression coverage.

### 2026-04-02

- A real internal `/ops` route now exposes KPIs, top collections, low-stock risks, supplier sync status, and operational watchpoints over the current local order model.
- A real internal `/ops/catalog` route now exposes catalog ownership, supplier relationships, stock thresholds, COD eligibility, shipping classes, and estimated margin at the variant level.
- A local catalog/admin rehearsal layer now models supplier records, low-stock detection, supplier exception queues, and sync log recency without pretending a backend admin already exists.
- Smoke regression coverage now checks `/ops` and `/ops/catalog`, and analytics page typing now distinguishes those internal surfaces from storefront pages.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npm run test:smoke` all passed again after shipping the ops dashboard and ops catalog slice.
- Checkout now applies city-aware shipping and payment eligibility rules before creating an order reference instead of treating every option as always available.
- A real internal `/ops/fulfillment` route now exposes carrier recommendation, split-shipment logic, COD eligibility, and notification planning for locally saved orders.
- Order confirmation and track-order surfaces now explain fulfillment state and notification readiness instead of showing the order status alone.
- Shared supplier and variant operations data now feed both catalog rehearsal and fulfillment rules, reducing duplication between checkout and internal ops.

## Immediate Next Actions

1. Freeze which of the new editorial collections remain in MVP versus phase 2 catalog expansion.
2. Freeze the commerce/admin boundary now that `/ops`, `/ops/catalog`, `/ops/fulfillment`, and `/ops/orders` are all live rehearsal surfaces.
3. Replace the local order-handoff plus local fulfillment rehearsal flow with real payment, shipping, notification, stock, and order-routing ownership.
4. Supply Vercel credentials and execute the first real deployment from this repository.

## Tracking Rules

- `roadmap.md` remains the source strategy document.
- `PROJECT-BRIEF.md` is the current working interpretation.
- `DELIVERY-BACKLOG.md` is the execution map.
- Progress changes only when a phase deliverable is actually completed, not when it is merely discussed.
- No phase is marked complete without explicit exit gates.
