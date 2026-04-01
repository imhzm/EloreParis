# Project Tracker

## Snapshot

- Start date: 2026-04-01
- Last updated: 2026-04-01
- Current phase: `release`
- Overall completion: `67%`
- Current focus: release-hardening completion through security headers, a live health endpoint, and verified release-facing browser behavior for the storefront running on port `3056`
- Forecast status: `date not committed yet`
- Working estimate: `12-16 weeks for an MVP after stack, catalog model, and integration scope are frozen`

## Progress Model

Progress is tracked against SkyWave phases, not by ad-hoc task count.

| Phase | Weight | Status | Progress | Exit gate |
| --- | ---: | --- | ---: | --- |
| Discovery | 15% | In Progress | 69% | Brief, sitemap, user flows, MVP boundary, backlog, open decisions |
| Design and Architecture | 20% | In Progress | 57% | Design system direction, page architecture, stack and data decisions |
| Implementation | 35% | In Progress | 85% | Public storefront and required internal surfaces implemented |
| Validation | 10% | In Progress | 70% | Lint, typecheck, tests, UX QA, SEO/schema QA, accessibility QA |
| Release | 10% | In Progress | 40% | Deployment target, configs, monitoring, legal/trust gates, rollback path |
| Growth and Automation | 10% | In Progress | 45% | CRM flows, SEO growth loops, analytics maturity, post-launch automations |

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
- [ ] Freeze MVP scope vs later phases
- [ ] Freeze hosting direction
- [ ] Freeze commerce architecture and admin boundary
- [ ] Freeze content ownership and sample requirements

## Current Status by Quality Layer

| Layer | Status | Notes |
| --- | --- | --- |
| UX / IA | In Progress | Home, skincare, makeup, search, ingredient hub/detail, concern hub/detail, routine hub/detail, product, cart, checkout handoff, checkout success, track-order, internal ops/orders, FAQ, contact, about, terms, journal, article, and trust surfaces now exist as real routes, and collection pages support real filter states with zero-result recovery |
| SEO / AEO / GEO | In Progress | Metadata, route structure, internal links, journal flow, robots, and sitemap now cover collection, ingredient, concern, routine, product, trust, FAQ, contact, about, terms, and internal search discovery templates, with filtered collection states canonicalized back to the main category URL and transactional `cart` / `checkout` routes marked `noindex,nofollow` |
| Schema strategy | In Progress | JSON-LD foundations exist on home, category, ingredient, concern, routine, product, journal, article, trust, FAQ, contact, about, and terms routes, and filtered collection plus ingredient discovery states now emit result-aware `ItemList` markup |
| Accessibility | In Progress | Semantic layout and skip-link exist; full QA is still pending |
| Security / Privacy | In Progress | Trust, privacy, shipping, returns, authenticity, FAQ, contact, about, and terms surfaces now exist as real public routes, track-order now uses order reference plus phone last-4 instead of exposing full customer details, and the app now emits safe default security headers; real business data, final support channels, and legal review are still pending |
| Performance / CWV | In Progress | Next.js foundation is in place; runtime and asset optimization still pending |
| Analytics / Conversion | In Progress | Page views, global navigation, core CTA instrumentation, internal search submit/result events including ingredient result groups, collection `filter_apply`, ingredient route links, `add_to_cart`, `cart_update`, `checkout_start`, `checkout_complete`, `track_order_lookup`, and internal `ops_order_status_update` are now wired; real payment completion and lifecycle notifications are still pending |
| Content system | In Progress | Editorial, concern, routine, product, collection, trust, FAQ, contact, about, and terms shells exist, but voice remains provisional until real samples exist |
| Release / Ops | In Progress | Local runtime is stable on port `3056`, local order references now exist for confirmation and tracking, an internal `/ops/orders` surface can advance local order states for rehearsal, the codebase is now on GitHub with CI verified on push, branded fallback plus manifest surfaces now exist, and `/api/health` is now available for deployment checks; hosting, production CD, monitoring ownership, and real order backend ownership are not selected yet |

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

## Immediate Next Actions

1. Freeze the MVP cut so the roadmap does not expand into one oversized first build.
2. Freeze the commerce/admin boundary and hosting direction before deeper platform work.
3. Replace the local order-handoff plus local ops rehearsal flow with real payment, shipping, notification, and order-routing ownership.
4. Add hosting selection, deployment CD, and production monitoring so release work moves beyond CI-only readiness.

## Tracking Rules

- `roadmap.md` remains the source strategy document.
- `PROJECT-BRIEF.md` is the current working interpretation.
- `DELIVERY-BACKLOG.md` is the execution map.
- Progress changes only when a phase deliverable is actually completed, not when it is merely discussed.
- No phase is marked complete without explicit exit gates.
