# Analytics Event Map

## Purpose

This project now tracks the minimum event set needed to answer early-stage storefront questions without creating noisy telemetry.

## Business Questions

1. Which public surfaces generate the strongest movement into collection, ingredient, concern, routine, product, and article routes?
2. Which discovery paths lead users from editorial or educational content into ingredient and commercial pages?
3. Which global navigation zones are used most often during early browsing?
4. Which collection filter states narrow browsing most effectively before the user moves into product, routine, or concern detail?
5. Which product selections and cart changes actually move users from product detail into checkout review?
6. Which shipping and payment choices stay eligible at checkout after city and cart rules are applied?
7. Which checkout handoff choices convert cart intent into an authority-backed order reference, and how often do users return to track that order?
8. How often does the internal operations layer advance centralized rehearsal order states before a real backoffice is selected?
9. Which in-app authority orders require manual review, split-shipment coordination, or COD fallback inside the rehearsal layer?
10. Are protected internal ops surfaces still reachable and reviewable after the access gate is enabled?
11. Can internal operators still move between dashboard, orders, fulfillment, catalog, and audit surfaces without losing route-level visibility after role gating is enabled?
12. Which queued operational notifications are being marked sent or returned to queue inside the rehearsal layer before a real delivery provider exists?
13. Which protected release decisions are being recorded manually from the `/ops/release` surface, and under what packet, blocker, and ownership state?

## Event Set

### `page_view`

- Fires on route change through the global analytics provider.
- Answers route-level traffic questions for the public storefront.

Tracked properties:

- `page_path`
- `page_type`
- `has_query`

### `navigation_click`

- Fires on header, brand, and footer policy navigation.
- Answers how users move through global navigation and trust surfaces.

Tracked properties:

- `label`
- `surface`
- `source_path`
- `source_page_type`
- `destination_path`
- `destination_type`

### `cta_click`

- Fires on commercial and editorial CTA links across home, collection, ingredient, product, concern, routine, journal, and trust surfaces.
- Answers which conversion-oriented surfaces generate discovery and deeper browsing.

Tracked properties:

- `label`
- `surface`
- `source_path`
- `source_page_type`
- `destination_path`
- `destination_type`

### `search_submit`

- Fires on the internal search form submit.
- Answers how often users actively use search and whether the query shape is Arabic, English, or empty.

Tracked properties:

- `surface`
- `source_path`
- `source_page_type`
- `query_length`
- `query_token_count`
- `has_arabic`
- `has_latin`
- `is_empty`

### `search_result_click`

- Fires when a user opens a result from the internal search page.
- Answers which result type and rank most often move users into deeper discovery or purchase paths.

Tracked properties:

- `label`
- `surface`
- `source_path`
- `source_page_type`
- `destination_path`
- `destination_type`
- `result_kind`
- `result_rank`

### `filter_apply`

- Fires when a user applies, swaps, or clears a data-backed filter on a collection page.
- Answers which decision paths are actually used on collection surfaces before deeper browsing, and which states end in zero-result recovery.

Tracked properties:

- `label`
- `surface`
- `source_path`
- `source_page_type`
- `destination_path`
- `destination_type`
- `filter_key`
- `filter_value`
- `filter_state`
- `result_count`

### `add_to_cart`

- Fires when a user adds a selected product variant to the local cart from a product page.
- Answers which PDP selections create real purchase intent before cart review.

Tracked properties:

- `source_path`
- `source_page_type`
- `product_slug`
- `sku`
- `quantity`
- `unit_price`
- `cart_count`

### `cart_update`

- Fires when a user changes quantity, removes a line, or clears the current cart review.
- Answers how users edit intent after landing in the cart and which lines are dropped before checkout.

Tracked properties:

- `source_path`
- `source_page_type`
- `product_slug`
- `sku`
- `quantity`
- `cart_count`

### `checkout_start`

- Fires when a user moves from the cart into the checkout review step.
- Answers whether the cart is strong enough to move users into the pre-payment flow.

Tracked properties:

- `label`
- `surface`
- `source_path`
- `source_page_type`
- `destination_path`
- `destination_type`
- `cart_count`
- `subtotal`

### `checkout_option_change`

- Fires when a user changes shipping or payment selection inside the checkout handoff form.
- Answers which checkout choices remain preferred after city and cart rules are applied.

Tracked properties:

- `source_path`
- `source_page_type`
- `option_group`
- `option_value`
- `delivery_zone`
- `express_eligible`
- `cod_eligible`

### `checkout_complete`

- Fires when a user submits the checkout handoff form and an in-app order reference is created.
- Answers whether the current pre-integration checkout is converting cart intent into a centralized saved order state.

Tracked properties:

- `source_path`
- `source_page_type`
- `order_reference`
- `cart_count`
- `subtotal`
- `shipping_method`
- `payment_method`
- `total_estimate`
- `delivery_zone`
- `cod_eligible`
- `express_eligible`

### `track_order_lookup`

- Fires when a user searches for an existing order from the tracking page.
- Answers whether post-checkout users return for order-state visibility and whether lookups succeed.

Tracked properties:

- `source_path`
- `source_page_type`
- `has_reference`
- `has_phone_last4`
- `lookup_found`
- `order_status`

### `ops_order_status_update`

- Fires when the internal `/ops/orders` surface advances a centrally stored rehearsal order from one status to the next valid state.
- Answers whether the current rehearsal layer is sufficient to test order-state transitions before a real admin/backend exists.

Tracked properties:

- `source_path`
- `source_page_type`
- `order_reference`
- `previous_status`
- `next_status`
- `payment_method`

### `ops_notification_status_update`

- Fires when the internal `/ops/notifications` surface changes a centrally stored rehearsal notification from `queued` to `sent` or back again.
- Answers whether the current rehearsal layer is sufficient to test delivery-state handling before a real provider and post-purchase CRM stack exist.

Tracked properties:

- `source_path`
- `source_page_type`
- `order_reference`
- `template_key`
- `previous_status`
- `next_status`
- `channel`

### `ops_release_decision_submit`

- Fires when the internal `/ops/release` surface records a protected hold or approve decision against the latest executive packet.
- Answers whether release governance is still being exercised manually from the protected runtime, and what blocker, drift, and acknowledgement state existed when the verdict was recorded.

Tracked properties:

- `source_path`
- `source_page_type`
- `verdict`
- `compare_status`
- `overall_status`
- `blocked_count`
- `warning_count`
- `ready_count`
- `acknowledged_blocked_item_count`
- `target_base_url`

## Current Instrumented Surfaces

- Header brand and primary navigation
- Footer policy links
- Homepage hero CTAs
- Homepage featured product cards
- Homepage journal cards
- Homepage trust/schema cards
- Collection links to concern, routine, product, and article surfaces
- Collection filter chips and zero-result recovery links on skincare and makeup pages
- Product purchase panels and sticky add-to-cart CTA on product detail pages
- Cart quantity controls, line removal, cart clear action, and checkout CTA
- Checkout handoff form submission with shipping and payment selection
- Checkout shipping and payment option changes after eligibility rules are applied
- Order confirmation route CTAs back into tracking and shopping
- Track-order lookup form and tracking result surface
- Internal `/ops/orders` queue actions and tracking shortcuts
- Internal `/ops/fulfillment` routing queue, notification review, and order-tracking shortcuts
- Internal `/ops/notifications` queue actions, fulfillment shortcuts, and public tracking shortcuts
- Internal `/ops-access` gate plus logout action through the protected ops navigation
- Internal `/ops`, `/ops/orders`, `/ops/fulfillment`, `/ops/notifications`, `/ops/catalog`, `/ops/release`, and `/ops/audit` navigation links under the role-aware session model
- Internal `/ops/release` links into health, evidence, release package, release packet, release history, release compare, release decisions, content governance, and audit review surfaces
- Internal `/ops/release` manager-only decision composer for protected hold and approval verdicts plus blocker-ownership review
- Internal `/ops/audit` links into orders, fulfillment, notifications, and release review surfaces
- FAQ route links into tracking, trust policies, and contact
- Contact route links into FAQ, tracking, and trust support paths
- About route links into trust, terms, contact, and shopping discovery
- Terms route links into privacy, shipping, returns, and contact reference paths
- Product hero, pairings, and editorial support links
- Concern hero, sidebar, related products, and related articles
- Routine hero, steps, related products, related articles, and sidebar pairings
- Journal index article cards
- Journal article sidebar commerce links
- Internal search form submissions
- Internal search result clicks across collection, product, ingredient, concern, routine, and article result groups
- Homepage ingredient story links and ingredient hub CTA
- Ingredient hub cards and ingredient detail route links
- Concern key-ingredient chips that now open ingredient pages
- Product ingredient-story links that now connect PDPs to ingredient routes
- Journal article sidebar links into ingredient discovery when a product match exists
- Trust notice return-to-shopping CTA
- Trust hub links to individual policy pages
- Trust policy sidebar links back to the hub, related policies, journal, and collection

## Deliberately Deferred

- `wishlist_add`
- external delivery-provider events
- post-purchase CRM and lifecycle events

These remain deferred until payment, order routing, notifications, CRM surfaces, and a real authenticated backoffice exist instead of placeholders.

## Data Safety Rules

- No personal data or free-form customer content is tracked.
- No raw search terms or private identifiers are sent.
- Event labels are developer-defined machine-friendly strings, not UI copy.
- The data layer remains vendor-neutral and currently supports `window.dataLayer` and `gtag` when present.
