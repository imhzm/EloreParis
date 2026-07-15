# Elore Paris — Full Site Upgrade Ledger

Last updated: 2026-07-15 01:15 (Africa/Cairo, UTC+03:00)

## Current status

- Project type: public Saudi cosmetics commerce site with an internal operations surface.
- Current phase: brand implementation, motion-preserving public-surface rebuild, and release-gate architecture.
- Public content status: sample-based for brand voice and homepage copy; product, legal, support, and policy facts remain blocked.
- Protection status: implementation-ready; critical commerce gates remain closed while hardening continues.
- Release status: blocked. Do not enable public checkout, search indexing, or production integrations yet.
- Local preview: `http://127.0.0.1:3056`.
- LAN mobile preview: `http://192.168.1.5:3056` (same Wi-Fi; address may change after DHCP renewal).
- Intended production domain: `https://elore-paris.com`.
- Intended GitHub repository: `ireda8041-lab/www.elore-paris.com`.

## 2026-07-15 Drive source-of-truth intake

The user-supplied Google Drive handoff is now the authoritative brand and implementation source for the rebuild.

- [x] Adopted the display name `ÉLORÉ PARIS`, technical name `elore-paris`, and approved tagline `Beauty, considered.` / `جمال باختيار مدروس.`
- [x] Adopted the approved ivory, burgundy, rosewood, champagne, blush, ink, and cocoa token system.
- [x] Adopted `Noto Naskh Arabic`, `IBM Plex Sans Arabic`, `Cormorant Garamond`, and `Manrope` through `next/font`.
- [x] Ingested only the clean production logo/favicon set and the approved concept imagery required for prototyping.
- [x] Rebuilt the homepage into the ten handoff scenes while preserving scroll-linked motion, native scrolling, mobile static motion layers, and reduced-motion fallbacks.
- [x] Removed external-brand product names and fake product imagery from the homepage.
- [x] Removed public-facing `Cozmateks` naming from source surfaces; the old environment identifier remains only as a backward-compatible runtime key until deployment migration.
- [x] Quarantined the two hardcoded design-fixture PDPs from the public catalog; their routes, prices, offers, inventory, and search records are no longer published.
- [ ] Add `/ar` and `/en` route architecture, independent content, canonical/hreflang, and a persistent language switcher.
- [ ] Import an approved catalog only through a staged, validated, auditable schema after the Drive workbook contains real approved rows.

Drive authority also confirms that SKU data, product photography, prices, inventory, shipping, returns, payment providers, legal entity details, VAT/CR/licenses, product claims, reviews, and social proof are still `BLOCKED`. The public commerce and indexing flags must remain false.

## 2026-07-15 catalog and commerce safety gate

- [x] Added independent `PUBLIC_RELEASE_APPROVED`, `PUBLIC_CATALOG_APPROVED`, and `PUBLIC_COMMERCE_ENABLED` controls.
- [x] Production order creation now requires all three controls and production-stage detection; missing or inconsistent approval returns `503 commerce_disabled`.
- [x] Search indexing now requires both release approval and catalog approval.
- [x] Health reports raw catalog/commerce flags plus the derived commerce-availability state.
- [x] Release readiness includes blocked catalog and commerce ownership gates.
- [x] Removed BIODERMA/EUCERIN names, unsupported authenticity claims, and fake product packaging from the public shop experience.
- [x] Replaced shop/category visuals with the approved ÉLORÉ concept asset set and preserved native cinematic scrolling.
- [x] Added a production-fence test to CI for release/catalog/commerce/indexing failures.
- [x] Verified lint, TypeScript, production build, smoke, production-fence, and browser regression across mobile/tablet/desktop.

## 2026-07-15 localization vertical slice

- [x] Added real `/ar` and `/en` homepage routes with a deterministic `308` redirect from `/` to `/ar`.
- [x] Migrated from the deprecated root `middleware.ts` convention to `src/proxy.ts` while preserving protected operations routing.
- [x] Added locale-correct `lang`, `dir`, canonical, hreflang, Open Graph locale, and WebSite JSON-LD for both homepages.
- [x] Localized all ten homepage scenes, the desktop header/footer, mobile drawer, cart/search labels, and a persistent AR/EN switch.
- [x] Preserved the exact ten-scene motion tree, scroll progress hook, desktop 3D transforms, mobile static layers, and reduced-motion path.
- [x] Kept non-home links unprefixed until each full route group is migrated, preventing RSC prefetch 404s during the transition.
- [x] Added locale and motion assertions to browser regression; both `/ar` and `/en` pass on mobile, tablet, and desktop.
- [x] Migrated the full public storefront journey through localized home, discovery, journal, search, catalog, cart, checkout, confirmation, trust/support, and order-tracking routes with canonical redirects and page-preserving language switches.
- [x] Localized the customer account order surface at `/ar/account/orders` and `/en/account/orders`, including canonical metadata, query-preserving legacy redirect, localized account-to-tracking links, and language-preserving signed auth handoff returns.
- [ ] Configure and approve the external identity provider before cross-device customer accounts can be enabled in production.

## Non-negotiable release blockers

- [x] Upgrade vulnerable production dependencies and obtain a clean production audit.
- [ ] Replace guessable order tracking with cryptographic references, safe verification, throttling, and limited response DTOs.
- [ ] Add strict runtime validation, body limits, idempotency, and abuse protection to order creation.
- [ ] Remove production secret fallbacks and make missing secrets fail fast.
- [ ] Map the implemented timestamped HMAC/replay contract to the selected providers' official signature formats and pass their sandbox certification.
- [ ] Complete the Saudi commerce identity: legal entity, CR, VAT number, support channels, shipping, returns, refunds, complaints, privacy, and terms.
- [ ] Confirm the VAT pricing model and invoice requirements with the business/legal owner.
- [ ] Replace placeholder product facts and images with approved catalog data and required cosmetic safety information.
- [x] Replaced simulated newsletter and back-in-stock responses with durable, consent-versioned SQLite subscriptions, suppression, fulfillment state, protected Ops visibility, and strict request gates. External email/CRM delivery remains provider-gated and must not be inferred from collection success.
- [x] Added an independent lifecycle delivery outbox with consent-revision dedupe, lease recovery, bounded retry/dead-letter states, withdrawal cancellation, secure delivery-envelope resolution, and masked Ops evidence. External provider adapters and credentials remain intentionally unconfigured.
- [ ] Configure production operations access, backups, monitoring, rollback, and an independent signing-secret set.
- [ ] Pass lint, typecheck, unit/integration tests, build, smoke, route matrix, keyboard, mobile, reduced-motion, and production health checks.

## Saudi market requirements

The implementation must be prepared for, and the business owner must approve, the following before launch:

- Prices and totals in SAR using halala-safe money representation.
- An explicit VAT inclusion model and tax snapshots at order/invoice time.
- CR, licenses, VAT number, business contact details, complaint handling, shipping, returns/refunds, privacy, and terms displayed consistently.
- Product label facts and claims aligned with the approved SFDA notification/label data, including INCI, warnings, origin, importer, size, storage, and shelf-life/PAO where applicable.
- PDPL-aware consent, retention, access/export/deletion workflows, processor inventory, and protected backups.
- Local payment and shipping integrations selected only after provider credentials and commercial decisions are supplied.

Primary references:

- ZATCA VAT: https://zatca.gov.sa/ar/RulesRegulations/VAT/Pages/About-Vat.aspx
- Saudi Ministry of Commerce e-commerce standards: https://mc.gov.sa/en/mediacenter/News/Pages/09-09-25-01.aspx
- Saudi Business Center e-commerce authentication: https://business.sa/eservices/details/4d6e9d30-e989-4940-08ce-08dbf015747a
- SFDA cosmetics overview: https://www.sfda.gov.sa/en/overview-cosmetics
- Saudi Payments / mada: https://sama.gov.sa/ar-sa/payment/Pages/mada.aspx

## Surface inventory

### Public commerce

- `/`, `/shop`, `/shop/[category]`, `/products/[slug]`
- `/cart`, `/checkout`, `/checkout/success`
- `/search`, `/track-order`, `/account/orders`

### Discovery and editorial

- `/concerns[/slug]`, `/ingredients[/slug]`, `/routines[/slug]`
- `/journal[/slug]`

### Trust and support

- `/about`, `/contact`, `/faq`, `/terms`, `/trust[/slug]`
- `not-found` and global/route error states

### Operations

- `/ops-access`, `/ops`, `/ops/orders`, `/ops/catalog`, `/ops/fulfillment`, `/ops/release`
- Operations APIs, provider runtime configuration, audit records, and release controls

## Prioritized findings

### P0 — security and commercial safety

- Order references are guessable, tracking uses weak knowledge verification, and a successful lookup grants an overly broad long-lived customer session.
- Order-number conflicts overwrite existing records instead of failing safely.
- Public order creation lacks strict runtime schemas, request-size limits, idempotency, and abuse controls.
- Operations login throttling trusts forwarded IP data and can be bypassed by changing the guessed access code.
- OAuth now uses opaque one-time state, PKCE S256, nonce/claim checks, verified-contact bootstrap, and durable issuer/subject binding; the selected provider's signed-token/JWKS contract remains a release gate.
- Payment, shipping, and notification callbacks now use bounded exact-body parsing, timestamped HMAC in production, event conflict detection, and replay handling; provider-specific signature adapters remain blocked on provider selection.
- Production configuration can fall back to development/shared secrets.
- Current Next.js version has a high-severity production advisory with a compatible patch available.

### P1 — catalog truth, routes, and cinematic consistency

- Product imagery is not reliably bound to the product record.
- Some product/category cards route to generic or incorrect destinations.
- The optimized homepage motion model is not shared by the other cinematic surfaces.
- Several internal screens still use long fixed-to-absolute scenes that can jump or trap nested scrolling on mobile.
- Catalog management is read-only presentation rather than durable CRUD with draft/publish and audit history.

### P2 — accessibility and resilient UI

- Several components create nested `<main>` landmarks.
- Predictive search lacks full combobox keyboard behavior and stale-request protection.
- Newsletter and restock now expose localized loading, success, and error states; their APIs persist purpose-specific consent instead of reporting simulated delivery. Provider dispatch and signed unsubscribe-link delivery remain release work.
- Global smooth scrolling is not disabled for reduced-motion users.
- Some focus styles are removed without a sufficiently visible replacement.
- Localized cart, checkout, tracking, and account routes now have accessible reduced-motion loading states, while all localized routes share a safe retry boundary that never exposes error internals. The loading boundary intentionally stays below the locale root so dynamic `notFound()` routes retain semantic HTTP 404 responses.

### P3 — operations, privacy, performance, and quality

- SQLite access is synchronous and some queries filter full datasets in memory.
- Ordered in-process authority migrations, WAL/FULL durability policy, online SQLite backup verification, and an isolated restore rehearsal now exist. Production scheduled backup evidence and the managed-database transition gate remain required before launch.
- Analytics is not consent-aware and lacks server-side purchase deduplication.
- Search indexing can activate from environment inference instead of an explicit release approval flag.
- Homepage motion currently measures every scene per animation frame and eagerly loads images below the first scene.
- CSP is missing; introduce it in report-only mode before enforcement.
- Smoke coverage does not exercise the full public route matrix or critical negative security cases.

## Execution phases

### Phase A — release gate and security foundation

- Patch production dependencies.
- Harden order references, access checks, creation schemas, idempotency, throttling, and safe response shapes.
- Remove production secret fallbacks.
- Add negative security and transaction tests.
- Add an explicit `PUBLIC_RELEASE_APPROVED` gate for checkout and indexing.

Exit criteria: clean production audit, passing security tests, no public commerce activation from environment inference alone.

Progress on 2026-07-14:

- [x] Patched Next.js to 16.2.10 and forced the vulnerable transitive PostCSS version to 8.5.19.
- [x] Replaced four-character `Math.random()` order suffixes with 96-bit cryptographic references.
- [x] New order persistence now rejects order-number collisions instead of overwriting an existing order.
- [x] Knowledge-based tracking no longer mints a customer-wide access cookie or account handoff.
- [x] Added exact last-four validation, a bounded per-order attempt throttle, `429`, and `Retry-After` behavior.
- [x] Removed raw internal exception messages from the public order-creation 500 response.
- [x] Added strict order request parsing, a 32 KB body limit, bounded line-item counts and quantities, exact field/type validation, stable public error codes, and a production commerce activation gate.
- [x] Added durable order-attempt idempotency, session-scoped recovery after response loss, and concurrency-safe active quote reuse without storing checkout PII in browser recovery state.
- [x] Reduced public tracking to a customer-safe DTO that excludes notifications, PII, provider references, supplier data, and internal inventory state.
- [ ] Still required: persistent/distributed public rate limiting, OTP or equivalent verified tracking access, and production secret fail-fast.

### Phase B — Saudi commerce foundation

- Add centralized market, money, VAT, and business-identity configuration.
- Store money in halalas and snapshot totals/tax inputs at order time.
- Add business/legal/policy placeholders that fail closed until approved data is supplied.
- Define the product safety publication schema and completeness gate.

Exit criteria: deterministic totals and an explicit list of remaining business/legal approvals.

### Phase C — public storefront and shared motion system

- Extract a shared, accessible cinematic scroll engine with sticky flow and reduced-motion fallback.
- Apply it progressively to shop, category, product, routines, editorial, and trust experiences.
- Repair destination integrity and bind every visual to catalog truth.
- Complete mobile, keyboard, empty, loading, error, and degraded states.

Exit criteria: route matrix passes on desktop/mobile; no nested landmarks or scroll traps; product links and assets are truthful.

Progress on 2026-07-14:

- [x] Removed the broken `/shop/fragrances` homepage destination and replaced it with the existing body-care collection.
- [x] Replaced generic homepage/shop product destinations with the closest truthful existing category routes until approved PDP records are supplied.
- [x] Restored the trust destination to desktop navigation.
- [x] Added a global reduced-motion fallback that disables smooth scrolling and collapses animation/transition timing.
- [x] Added a shared request-animation-frame scroll progress hook with resize, visual viewport, and live reduced-motion handling; migrated the shop and product cinematic stages.
- [x] Rebuilt homepage presentation as six connected full-screen scenes with CSS 3D depth, pointer parallax, scroll-linked rotation/scale, and responsive/reduced-motion behavior.
- [x] Removed nested main landmarks from the cinematic discovery, knowledge, support, and trust surfaces.
- [x] Completed keyboard and ARIA combobox behavior for search, including stale-request cancellation.
- [x] Passed browser regression QA on mobile, tablet, and desktop for homepage/shop/product motion, sticky offsets, search keyboard flow, reduced motion, and horizontal overflow.
- [x] Rebuilt the shop hub as five ÉLORÉ block-motion scenes using the approved burgundy, ivory, champagne, typography, radius, and motion constraints.
- [x] Published complete Arabic and English shop hubs at `/ar/shop` and `/en/shop`, with localized copy, metadata, canonical URLs, hreflang, social previews, JSON-LD, and page-preserving language switches.
- [x] Converted `/shop` to a query-preserving permanent redirect and kept unmigrated category descendants on their working legacy routes until each category receives a complete localization pass.
- [x] Replaced horizontally translated interactive cards with stable semantic grids; mobile and reduced-motion paths now use static block layouts, and keyboard focus is explicitly kept inside the viewport.
- [x] Replaced all six legacy collection surfaces with localized AR/EN category experiences at 12 canonical routes, each using four ÉLORÉ Block Motion scenes and truthful catalog-pending states.
- [x] Added query-preserving one-hop redirects from every legacy `/shop/{category}` URL to its Arabic canonical route and localized every category link from both shop hubs.
- [x] Removed concept product cards, prices, stock language, empty filters, and Product/Offer/ItemList claims from the new category experiences until approved SKU data exists.
- [x] Added reciprocal category hreflang, localized social metadata, CollectionPage/BreadcrumbList schema, and future-safe localized sitemap entries behind the closed indexing gate.
- [x] Fixed the shared storefront header at 320px and verified category keyboard focus, no horizontal overflow, mobile static layout, desktop sticky scenes, and reduced-motion fallback.
- [x] Rebuilt concerns, routines, and ingredients as 28 localized AR/EN routes: six hubs plus twenty-two detail pages using four- and five-scene Block Motion experiences.
- [x] Added query-preserving one-hop redirects for all fourteen legacy discovery URLs, reciprocal hreflang/canonicals, truthful WebPage/CollectionPage/BreadcrumbList schema, and localized sitemap entries.
- [x] Removed product, price, SKU, and treatment-claim dependencies from discovery content; added the independent `PUBLIC_DISCOVERY_CONTENT_APPROVED` indexing/release gate.
- [x] Corrected localized analytics page types, filtered English links to untranslated Arabic-only surfaces, and declared real social-image dimensions.
- [x] Moved crawler directives, `robots.txt`, and `sitemap.xml` to runtime-aware gates so release approval can safely open or close indexing without a stale build-time result.
- [x] Verified discovery at 320, 390, 768, and 1440 widths with static mobile layouts, sticky desktop scenes, keyboard CTA/FAQ behavior, reduced motion, no horizontal overflow, and no overlapping desktop columns.
- [x] Rebuilt Trust, About, Contact, FAQ, and Terms as 20 localized AR/EN pages with four-scene Block Motion, truthful provisional states, reciprocal hreflang, and conservative WebPage/AboutPage/ContactPage schema.
- [x] Added ten query-preserving one-hop redirects for legacy trust/support URLs, localized header/footer destinations, and removed legacy trust/support plus the unapproved journal from the public sitemap.
- [x] Added independent `PUBLIC_EDITORIAL_CONTENT_APPROVED` and `PUBLIC_LEGAL_CONTENT_APPROVED` indexing/release gates so catalog approval cannot expose synthetic journal or provisional policy copy.
- [x] Fixed the shared scroll hook to honor both legacy and current header-offset tokens; mobile and reduced-motion trust/support layouts use normal document flow.
- [x] Rebuilt Journal as 14 localized AR/EN routes: two five-scene Block Motion hubs plus twelve five-scene article experiences backed by six balanced editorial records.
- [x] Quarantined the synthetic 120-article corpus: six exact legacy URLs redirect once with query preservation, 114 retired URLs return semantic noindex 410 responses, and unknown localized slugs return 404.
- [x] Removed fixture product links, prices, offers, treatment claims, and unsupported FAQ/Article schema; editorial indexing remains gated until copy, authorship, and dates are approved.
- [x] Rebuilt search as two localized AR/EN routes with five Block Motion scenes, locale-aware ranking, truthful editorial/discovery sources, accessible predictive search, query-preserving legacy redirect, and no product-fixture leakage.
- [x] Closed the reflected search-query script-boundary vulnerability by keeping user input out of executable schema and adding explicit exploit regression coverage.
- [x] Removed KBA-to-account escalation: last-four tracking now returns a redacted public order view, never mints broad customer/order access, never exposes notifications or provider references, and cannot create an internal fallback account session.
- [x] Restricted payment redirect URLs to the configured provider host and made public commerce activation require a valid external customer-auth provider configuration.
- [x] Added canonical localized PDPs driven only by the validated public catalog read model; legacy product routes redirect without exposing quarantined fixtures.
- [ ] Still required: approved per-product photography and catalog rows, resilient API states across every route, and broader catalog/content approval.

### Phase D — commerce lifecycle and operations

- Complete cart, checkout, payment, shipping, notifications, customer order access, refunds, and returns.
- Build real catalog/variant/inventory CRUD with roles, validation, revision history, audit, and draft/publish.
- Add fulfillment and release controls with durable state and operational visibility.

Exit criteria: tested order lifecycle and role boundaries, provider sandbox evidence, backup/restore evidence.

Current blockers confirmed on 2026-07-15:

- The price/VAT quote authority, inventory reservation model, durable order idempotency, provider outbox, callback replay protection, and customer-facing availability binding now exist behind release gates and pass their authority checks.
- Approved real catalog rows, product photography, provider credentials/sandbox evidence, legal approval, and operational ownership are still missing; therefore these authorities cannot be enabled for public commerce yet.
- Cart and checkout remain release-gated; prototype products and prices must not be reused as public commerce data.

### Phase E — compliance, content, SEO, analytics, and performance

- Ingest the supplied brand/business file through a typed configuration/content boundary.
- Finalize Arabic brand voice only after approved samples are available.
- Finalize metadata, schema, sitemap dates, consent-aware analytics, and conversion events.
- Measure CWV and optimize image/motion/runtime cost.

Exit criteria: approved content/legal checklist, explicit indexing approval, accessibility and performance budgets met.

### Phase F — release

- Preserve the existing working tree and create a reviewable release commit.
- Add the target GitHub repository as a separate production remote and push only after all gates pass.
- Prepare Hostinger for Node 24 LTS, process supervision, nginx, TLS, environment secrets, persistent data, backups, health checks, logs, and rollback.
- Install a dedicated persistent deployment SSH key without storing private material in Git.
- Deploy, migrate, smoke-test, switch traffic only after health proof, then verify domain, TLS, checkout gate, ops access, robots, sitemap, and monitoring.

Exit criteria: production health proof, rollback tested, secrets absent from Git/logs, domain and observability verified.

## Brand data intake contract

The future source file should provide, at minimum:

- Arabic/English brand name, legal entity, CR, VAT, licenses, address, support email/phone/WhatsApp, and operating hours.
- Approved logo variants, colors, typography guidance, photography direction, and 2–3 real tone-of-voice samples.
- Shipping zones/SLA/fees, free-shipping threshold, return/refund/cancellation/complaint policies.
- Product SKU, slug, barcode, brand, category, size, price, sale rules, stock, images, INCI, warnings, origin, importer, storage, PAO/expiry, claims, and SFDA-related reference where applicable.
- Payment, shipping, CRM, analytics, consent, email/SMS/WhatsApp, and OAuth provider decisions.

Until this data is approved, content remains provisional and public release remains blocked.

## Validation record

| Date | Check | Result | Notes |
| --- | --- | --- | --- |
| 2026-07-14 | `npm run lint` | Pass | Read-only engineering audit. |
| 2026-07-14 | `npm audit --omit=dev` | Fail | 1 high and 1 moderate; Next.js patch available. |
| 2026-07-14 | `npm audit` after dependency gate | Pass | Next.js 16.2.10; PostCSS 8.5.19 override; zero known vulnerabilities. |
| 2026-07-14 | `npm run lint` | Pass | Full repository lint after dependency upgrade. |
| 2026-07-14 | `npx tsc --noEmit` | Pass | TypeScript validation after dependency upgrade. |
| 2026-07-14 | `npm run build` | Pass | 178 static pages generated; standalone runtime prepared. |
| 2026-07-14 | `npm run test:smoke` | Pass | Storefront and protected operations surfaces healthy on the rebuilt local runtime. |
| 2026-07-14 | Tracking security smoke cases | Pass | Invalid verifier, attempt throttling, Retry-After, and no customer-cookie/account-handoff escalation. |
| 2026-07-14 | Rebuilt route integrity check | Pass | No `/shop/fragrances` link; body care, hair care, and trust destinations present in rendered HTML. |
| 2026-07-14 | Local homepage motion QA | Pass with notes | Prior measured desktop/mobile scroll frame sampling; broader route matrix still pending. |
| 2026-07-14 | Live health/domain read-only check | Pass with blockers | Domain/TLS/health respond; ops setup is missing and release data is incomplete. |
| 2026-07-14 | Final combined `npm run lint` and `npx tsc --noEmit` | Pass | Current cinematic, accessibility, order validation, and release-preparation changes compile cleanly. |
| 2026-07-14 | Final combined `npm audit` | Pass | Zero known vulnerabilities across 393 dependencies. |
| 2026-07-14 | Final `npm run build` | Pass | Next.js 16.2.10 generated 178 pages and prepared the standalone runtime. |
| 2026-07-14 | Final local smoke suite | Pass | Storefront and protected operations dashboard healthy after rebuilding and restarting port 3056. |
| 2026-07-14 | Browser regression matrix | Pass | Mobile, tablet, and desktop homepage/shop/product screenshots; no console, page, request, or bad-response diagnostics. |
| 2026-07-15 | Google Drive brand and handoff audit | Pass with blockers | Brand, copy, visual identity, strategy, motion, catalog, compliance, and developer handoff inspected; commerce data remains blocked. |
| 2026-07-15 | ÉLORÉ identity and homepage rebuild lint/typecheck | Pass | Official tokens, fonts, logos, public naming, ten-scene homepage, and motion limits compile cleanly. |
| 2026-07-15 | ÉLORÉ production build | Pass | Next.js generated 178 routes and prepared the standalone runtime after the identity rebuild. |
| 2026-07-15 | ÉLORÉ browser regression matrix | Pass | Mobile/tablet/desktop screenshots, no overflow, search keyboard flow, sticky shop/PDP motion, and reduced-motion checks passed. |
| 2026-07-15 | Localized block-motion shop build | Pass | `/ar/shop` and `/en/shop` render five scenes; `/shop` redirects once while preserving query parameters; 178 routes built. |
| 2026-07-15 | Localized shop accessibility QA | Pass | All 18 scene links remain fully visible while tabbing at 390×844; reduced motion uses relative, non-sticky block frames. |
| 2026-07-15 | Final shop lint, smoke, production fence, and browser matrix | Pass | ESLint, storefront/ops smoke, catalog/commerce/indexing fences, and mobile/tablet/desktop browser regression all passed. |
| 2026-07-15 | Localized category production build | Pass | 190 routes generated, including 12 AR/EN collection routes and a dynamic validated category route. |
| 2026-07-15 | Category route and SEO smoke | Pass | Twelve localized routes return 200; six legacy routes redirect once with query preservation; unknown localized slug returns 404. |
| 2026-07-15 | Category accessibility and narrow-screen QA | Pass | 320×568, 390×844, and 1440×960 have no horizontal overflow; all six scene links remain visible while tabbing. |
| 2026-07-15 | Category browser regression matrix | Pass | Mobile/tablet/desktop AR/EN Block Motion, reduced motion, network diagnostics, and commerce-copy fences passed. |
| 2026-07-15 | Localized discovery production build | Pass | Next.js generated 210 static pages plus runtime-gated robots/sitemap routes with AR/EN concerns, routines, and ingredients hubs/details. |
| 2026-07-15 | Discovery route, redirect, and release-fence smoke | Pass | 28 localized routes return 200; 14 legacy paths preserve queries in one 308; invalid slugs return 404; discovery approval gates indexing. |
| 2026-07-15 | Discovery browser regression matrix | Pass | 320/390/768/1440 AR/EN Block Motion, sticky/static frames, keyboard CTA/FAQ, two reduced-motion viewports, column collision checks, and zero diagnostics. |
| 2026-07-15 | Final discovery lint, typecheck, build, smoke, fence, and home regression | Pass | All current validation gates passed after narrow-screen and desktop-column visual fixes. |
| 2026-07-15 | Runtime indexing gate regression | Pass | Disabled states return Disallow/noindex/empty sitemap; the fully approved state returns Allow, no X-Robots-Tag fence, and localized discovery sitemap entries only. |
| 2026-07-15 | Localized trust/support production build | Pass | Next.js generated 220 pages including 20 AR/EN trust/support routes and prepared the standalone runtime. |
| 2026-07-15 | Trust/support route and release-fence smoke | Pass | 20 localized routes return 200; 10 legacy paths preserve queries in one 308; editorial and legal approval gates now participate in indexing. |
| 2026-07-15 | Trust/support browser regression matrix | Pass | 320/390/768/1440 AR/EN scenes, sticky/static layouts, localized direction, overflow, redirects, 404s, unapproved-contact checks, reduced motion, and zero diagnostics passed. |
| 2026-07-15 | Homepage 3D regression after shared-hook fix | Pass | Ten scenes, six cinematic viewports, 78px sticky offset, mobile static fallback, reduced-motion fallback, and zero diagnostics passed. |
| 2026-07-15 | Localized Journal production build | Pass | Next.js generated 232 pages with 14 AR/EN Journal routes and prepared the standalone runtime. |
| 2026-07-15 | Journal route, retirement, and release-fence smoke | Pass | Active routes, six redirects, 114 noindex 410 retirements, localized 404s, sitemap gating, and schema/content fences passed. |
| 2026-07-15 | Full Block Motion browser regression | Pass | 320/390/768/1440 layouts, sticky desktop scenes, mobile document flow, keyboard journeys, reduced motion, overflow, and runtime diagnostics passed across 145 artifacts. |
| 2026-07-15 | Localized search and exploit regression | Pass | AR/EN five-scene search, locale-aware ranking, predictive keyboard flow, no fixture leakage, safe XSS payload handling, redirects, 404s, and noindex metadata passed. |
| 2026-07-15 | Customer order-access containment | Pass | KBA tracking returns a redacted public view without cookies, handoff, notifications, PII, payment refs, or provider internals; external auth is required for commerce activation. |
| 2026-07-15 | Final search/security lint and typecheck | Pass | `npm run lint` and `npx tsc --noEmit` passed after the narrow-screen and diagnostic fixes. |
| 2026-07-15 | Final search/security production build | Pass | Next.js 16.2.10 generated 232 pages and prepared the standalone runtime. |
| 2026-07-15 | Final smoke, release fence, and homepage 3D regression | Pass | Storefront/ops smoke, production release/auth fences, ten homepage scenes, six cinematic viewports, mobile static fallback, and reduced motion passed. |
| 2026-07-15 | Final four-viewport browser regression | Pass | Compact/mobile/tablet/desktop AR/EN surfaces, search scenes, sticky/static motion, overflow, redirects, keyboard flows, reduced motion, and runtime diagnostics passed. |
| 2026-07-15 | Localized order-tracking slice | Pass | `/ar/track-order` and `/en/track-order` render localized metadata, direction, safe status copy, policies, and analytics; the legacy URL preserves repeated query values in one 308. |
| 2026-07-15 | Tracking mobile/desktop browser QA | Pass | AR/EN at 390x844 and 1440x960 passed language, direction, localized links, overflow, screenshot, console, and page-error checks. |
| 2026-07-15 | Post-tracking production validation | Pass | TypeScript, ESLint, 232-page production build, storefront/ops smoke, catalog/order authority, production fences, and homepage 3D regression all passed. |
| 2026-07-15 | Customer account RSC data-containment fix | Pass | Customer-access and customer-account queries now redact PII, pricing/catalog IDs, supplier internals, and provider references before rendering; only an authenticated account may retain an active payment URL. |
| 2026-07-15 | Localized customer account slice | Pass | `/ar/account/orders` and `/en/account/orders` render localized empty/order states, canonical metadata, local tracking/shop links, and language-preserving account handoffs; the legacy route preserves repeated query values. |
| 2026-07-15 | Account security and browser QA | Pass | Signed-cookie integration assertions, production build (233 pages), smoke, production fences, and mobile/desktop AR/EN visual checks passed without overflow, runtime errors, or internal-value leakage. |
| 2026-07-15 | Localized resilience boundaries | Pass | Accessible AR/EN loading and retry states passed source checks for live semantics, focus recovery, reduced motion, no nested main, and no error detail disclosure. Moving loading below the locale root preserved dynamic 404 status codes. |
| 2026-07-15 | Authority backup and restore tooling | Pass | WAL/FULL runtime policy, online SQLite snapshot, SHA-256 manifest, integrity/FK verification, overwrite refusal, corrupted-backup rejection, atomic restore, and pre-restore preservation passed in an isolated OS temp workspace. |
| 2026-07-15 | Local live-database restore rehearsal | Pass | The running WAL database produced a 356352-byte snapshot with zero busy/checkpoint failures, matching SHA-256 manifest, five recorded migrations, successful verification, and an equal-size isolated restored database without replacing the source. |
| 2026-07-15 | Provider callback security contract | Pass | Payment, shipping, and notification callbacks use exact-body HMAC-SHA256, bounded timestamp skew, fail-closed configuration, bounded JSON parsing, and event replay/conflict checks; dedicated security test, typecheck, and lint passed. |
| 2026-07-15 | Customer OAuth identity hardening | Pass with provider gate | Opaque one-time state, PKCE S256, nonce/issuer/audience/expiry/subject checks, explicit verified-contact bootstrap, durable issuer-subject binding, and bound account sessions passed the standalone integration test. Official provider discovery/JWKS and sandbox certification remain pending provider selection. |
| 2026-07-15 | Post-security production build | Pass | Next.js 16.2.10 generated 233 pages and prepared the standalone runtime after the callback and OAuth changes. |

## Change discipline

- The working tree already contains substantial in-progress changes. Do not reset, discard, or overwrite unrelated work.
- No production deployment, GitHub push, DNS mutation, or indexing activation before the release gates above pass.
- Never store passwords, access tokens, provider secrets, or private SSH keys in the repository, issue ledger, terminal transcript, or application logs.
