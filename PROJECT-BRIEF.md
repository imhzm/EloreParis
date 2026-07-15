# Project Brief

## Authoritative Brand Handoff Update - 2026-07-15

The shared Google Drive folder `Elore Paris - Motion Website` (handoff snapshot
dated 2026-07-14) now supersedes the provisional brand assumptions below.

- Display name: `ÉLORÉ PARIS`; Arabic name: `إيلوري باريس`.
- Primary market: Saudi Arabia; Arabic is an original RTL experience and English
  is a separately authored LTR experience.
- Positioning: premium beauty discovery and commerce with Parisian restraint and
  Saudi relevance.
- Recommended tagline: `Beauty, considered.` / `جمال باختيار مدروس.`
- Visual tokens: porcelain `#F3F0EA`, warm white `#FFFDFC`, burgundy `#491723`,
  rosewood `#85484F`, champagne `#C9A67F`, blush `#DCC4B9`, ink `#21151A`.
- Motion direction: Block Motion / `The Unfolding Ritual`; motion reveals product
  and texture without scroll hijacking. Parallax is capped at `24px`, linked scale
  at `1.035`, product rotation at `2-3deg`, and mobile uses static imagery.
- Content status: `sample-based` for brand, homepage, navigation, and microcopy.
- Product/commercial status: `BLOCKED` until real approved SKU, price, inventory,
  barcode, INCI, claims evidence, product imagery, shipping, returns, payment,
  entity, tax, and licensing data are supplied and approved.
- Concept assets may support the prototype but must not be represented as saleable
  products. `10-Legacy-Do-Not-Use` is excluded from implementation.
- Canonical MVP PDP route: `/{locale}/product/{slug}` with compatibility redirects
  for legacy route shapes.
- Production migration requires a backup of the existing domain deployment and a
  verified rollback path before any replacement.

Current phase: `implementation`, followed by unified validation and release gates.
The site must remain unreleased for commerce while any explicit handoff blocker is
open.

## SkyWave Snapshot

- Date: 2026-04-01
- Current phase: `discovery`
- Project classification: `public-facing ecommerce website with operational/admin surface`
- Active skills:
  - `skywave`: phase routing and quality control
  - `client-intake-to-scope`: normalize the roadmap into buildable scope
  - `saas-delivery`: keep the public storefront and ops/admin scope aligned without over-scoping
  - `ux-designer`: structure IA, user journeys, and core page purposes
  - `seo-plan`: protect SEO/AEO/GEO requirements from day one
- Expected output from this phase:
  - normalized project brief
  - working sitemap
  - primary user flows
  - section plan for key page types
  - execution tracker and backlog
- Content status: `provisional`
- Protection status: `audit-only`

## Understanding of the Project

The roadmap describes a Saudi premium beauty ecommerce experience, not a generic cosmetics shop. The site must combine:

- curated beauty positioning
- Arabic-first editorial and commercial UX
- strong ecommerce conversion paths
- concern-based and ingredient-based discovery
- SEO, AEO, GEO, and schema-aware architecture
- legal and operational readiness for Saudi ecommerce
- an internal/admin operating surface for catalog, suppliers, orders, SEO, and content

## Confirmed Requirements

- The public experience should feel premium, calm, editorial, and mobile-first.
- The store must stay focused on beauty categories, not merge identity with the separate fragrance business.
- The site architecture must support:
  - category browsing
  - concern pages
  - ingredient pages
  - routines
  - product pages
  - journal/blog content
  - legal and trust surfaces
- SEO is part of the product architecture, not a post-launch add-on.
- Saudi compliance and trust visibility are mandatory from the start.
- The roadmap expects future operational depth: suppliers, dropshipping, SEO center, audit log, offers, CRM-style segmentation.

## Working Assumptions

- No application code exists yet in this workspace.
- The tech stack is not frozen yet.
- Real brand voice samples are not provided yet, so public copy can be structured but not treated as final brand-polished copy.
- Arabic is the primary launch language; English readiness should remain possible but is not yet locked as MVP scope.
- The first safe delivery slice is discovery and scope control, not immediate UI implementation.

## Brief Summary

- Brand promise: curated premium beauty shopping for women in Saudi Arabia
- Primary conversion: completed purchase
- Secondary conversions:
  - add to cart
  - VIP/newsletter signup
  - wishlist usage
  - routine-builder engagement
  - WhatsApp/support contact
- Primary audiences:
  - skincare-led shoppers
  - makeup-led shoppers
  - gift buyers
  - routine/concern-driven shoppers
- Business model:
  - catalog ecommerce
  - education-led commerce
  - future loyalty/automation flows

## Initial Sitemap

### Public Storefront

- Home
- Shop
- Skincare
- Makeup
- Haircare
- Bodycare
- Tools
- Brands
- Bestsellers
- New Arrivals
- Offers
- Routines
- Shop by Concern
- Shop by Ingredient
- Beauty Sets / Gifts
- Search Results
- Product Page
- Cart
- Checkout
- Account
- Wishlist

### Content and Trust

- Beauty Journal
- Journal Article
- About
- FAQ
- Contact
- Order Tracking
- Authenticity and Quality
- Company / Verification Info
- Privacy Policy
- Terms and Conditions
- Shipping Policy
- Returns / Refund Policy

### Internal Surface

- Admin Dashboard
- Catalog Management
- Variant Management
- Supplier and Sync Center
- Orders
- Offers and Campaigns
- Customers
- Content Management
- SEO Center
- Permissions and Audit Log

## Core User Flows

### 1. Discovery-to-Purchase Flow

1. User lands on Home, category hub, concern page, ingredient page, or article.
2. User picks a category, concern, or routine entry point.
3. User narrows choices through filters, editorial guidance, or quick decision blocks.
4. User opens a product page with shade/fit/routine guidance.
5. User adds to cart, checks delivery/payment trust signals, and completes checkout.

### 2. Concern-Led SEO Flow

1. User lands on a concern page from search.
2. Page answers the concern early, explains ingredient logic, and suggests a routine.
3. User moves from concern page to matching products.
4. User completes purchase or saves items to wishlist.

### 3. Content-to-Commerce Flow

1. User lands on a journal article from search.
2. Article gives an answer-first explanation, comparison blocks, and linked products/routines.
3. User moves to routine or product surfaces.
4. User enters cart/checkout or signs up for follow-up.

### 4. Gift Buyer Flow

1. User enters via Beauty Sets / Gifts or seasonal landing.
2. User sees gift-oriented curation, trust, packaging, and delivery guidance.
3. User selects a bundle, optional add-ons, and checkout.

### 5. Operator Flow

1. Admin enters dashboard.
2. Admin manages catalog, variants, stock/supplier sync, orders, offers, and SEO fields.
3. Admin checks logs, alerts, and campaign performance.

## Section Plan

### Home

- Trust bar
- premium hero
- quick category entry
- bestsellers
- concern-led discovery
- ingredient stories
- makeup editorial block
- routine builder CTA
- new arrivals
- beauty sets / gifts
- reviews / UGC
- journal highlights
- VIP / email capture
- rich footer with trust and policy links

### Category / Collection Pages

- clear H1 and intro
- lightweight educational banner
- filter and sort layer
- product grid
- quick add and trust badges
- related concerns / ingredients / routines
- bottom-of-page SEO content block
- FAQ

### Product Pages

- media gallery and swatches
- pricing, stock, shipping, and CTA
- fit guidance: skin type / concern / finish / texture / timing
- benefits without medical claims
- usage and routine position
- ingredients, warnings, size, origin
- cross-sell blocks
- reviews and Q&A

### Journal Article Pages

- answer-first intro
- table of contents
- structured educational sections
- comparison or routine blocks
- linked product recommendations
- FAQ when justified
- author and freshness signals
- CTA to products or routines

### Trust / Legal Shell

- commercial registration and tax visibility
- policy access from footer
- authenticity and quality page
- contact and support pathways
- clear delivery / COD / return messaging

## Discovery Exit Criteria

Discovery is complete only when these items are frozen enough to begin design/architecture:

- project classification is explicit
- MVP boundary is defined
- roadmap is mapped into epics
- sitemap is accepted as the working structure
- primary user flows are accepted
- open decisions are visible
- SEO, schema, analytics, accessibility, and trust layers are called out as mandatory

## Open Decisions Before Design Starts

- ecommerce platform and stack choice
- CMS/content authoring approach
- source of catalog and supplier data
- checkout, shipping, and payment integrations for Saudi Arabia
- whether MVP includes bilingual public pages
- exact scope of auth/account area in v1
- whether admin ships inside the same codebase or as a separate surface
