# ÉLORÉ full-site audit — 2026-07-18

## Scope and authority

This audit compares the current repository against:

- `ELORE_Claude_Implementation_Pack/CLAUDE.md`
- `ELORE_Claude_Implementation_Pack/design-tokens.json`
- `ELORE_Claude_Implementation_Pack/reference/elore-home-concept.png`
- the current route, content, catalog, release, and ownership authority files

The reference is treated as art direction, not a background image. The current build remains a gated preview until real catalog, legal, provider, and operating data are approved.

## Verification snapshot

| Gate | Result | Evidence |
|---|---|---|
| ESLint | PASS | `npm run lint` |
| TypeScript | PASS | `npx tsc --noEmit` |
| Production build | PASS | `npm run build`; 99 static pages generated |
| Reference Home browser regression | PASS | Compact seven-section Home, dedicated desktop/mobile art direction, no sticky scenes, overflow, or browser failures |
| Collection regression | PASS | 14 localized collection routes; truthful gated/available state, three discovery routes, no sticky scenes, overflow, or browser failures |
| Full public-surface browser matrix | PASS | 40 representative AR/EN routes at desktop plus the same 40 at mobile; 80/80 passed with clean console, page, request, and response diagnostics |
| Shared mobile shell | PASS | Consent panel measured 161px at 390 x 844; menu focus restoration and menu/search/cart dialogs verified |
| Reduced motion | PASS | Home regression verified non-sticky reduced-motion composition |
| Analytics consent fence | PASS | Browser check: empty `dataLayer` before consent; one Home `page_view` immediately after an explicit grant event |

All 21 repository `test:*` scripts passed on 2026-07-18. The earlier request
referred to 19 scripts; the current package also includes
`test:category-cinematic` and `test:promotion-authority`, so the live inventory
is 21:

| Test | Result |
|---|---|
| `test:home-3d` | PASS |
| `test:category-cinematic` | PASS |
| `test:smoke` | PASS |
| `test:production-fence` | PASS |
| `test:release-controls` | PASS |
| `test:content-governance` | PASS |
| `test:catalog-authority` | PASS |
| `test:promotion-authority` | PASS |
| `test:provider-auth-security` | PASS |
| `test:ops-lifecycle-source` | PASS |
| `test:provider-callback-security` | PASS |
| `test:lifecycle-authority` | PASS |
| `test:lifecycle-delivery` | PASS |
| `test:lifecycle-ses` | PASS |
| `test:lifecycle-sns` | PASS |
| `test:lifecycle-email-templates` | PASS |
| `test:authority-backup` | PASS |
| `test:boundaries` | PASS |
| `test:font-stack` | PASS |
| `test:scroll-reveal` | PASS |
| `test:social-card` | PASS |

Non-failing note: Node reports the built-in SQLite API as experimental. The previous `metadataBase` warnings were removed by replacing the root-level Open Graph file convention with the stable `/api/social-card` route; release must still provide the canonical public origin.

Live re-run at 12:30–12:49 Africa/Cairo found and resolved two validation gaps:

- a duplicated, truncated RTL search gradient that Turbopack accepted but an
  isolated CSS parser rejected as an unclosed bracket;
- the lifecycle-email palette check only accepted direct hex declarations and
  incorrectly rejected canonical design-token aliases.

After both fixes, `npm run lint`, `npx tsc --noEmit`, all 21 test scripts, and
`npm run build` passed; the production build generated 99 pages and prepared
the standalone runtime.

### Home visual/browser matrix

The reference-led Home was re-tested against the standalone production build at
1440×1000 and 390×844. Arabic and English keep the correct direction, the
desktop composition mirrors deliberately for LTR, and the mobile viewport loads
its dedicated portrait art direction. The browser run reported no console
errors, page errors, failed responses, horizontal overflow, sticky scroll traps,
or reduced-motion violations. Evidence is stored in `.artifacts/home-reference`.

The recomposed Home now measures 6,071px at the desktop test viewport instead
of the previous 13.7k-pixel narrative. Its Hero is 900px high, the Bento grid
overlaps it by 72px, and all seven commercial/editorial sections preserve the
approved order. Two original, unbranded concept images replace the unsupported
CSS bottle: a wide desktop AVIF and a dedicated mobile AVIF. They are safe for
the gated preview, but final launch still requires the approved logo and real
product packshots supplied by the owner.

## Findings and remediation plan

### P0 — launch and truthfulness

- [x] Replace unsupported service-strip promises. The previous global strip promised fast delivery, complimentary samples, luxury packaging, responsible sourcing, and easy returns while the authority files explicitly mark those decisions as provisional. It now communicates approval status without inventing benefits.
- [ ] Approve and import real catalog data. `site-content.ts` intentionally carries no launch catalog; product names, prices, stock, claims, labels, and final packaging cannot be fabricated.
- [ ] Approve Saudi operating truth: legal entity, CR/VAT data where applicable, support channels, shipping coverage/fees/SLA, returns/refunds, privacy, complaints, and final terms.
- [ ] Select and certify payment, shipping, notification, consent, and analytics providers before public commerce is enabled.

### P1 — reference fidelity and shared system

- [x] Freeze the implementation pack as the canonical color-token authority and migrate the old primary palette across all CSS route families.
- [ ] Continue consolidating remaining semantic/status color literals and scene primitives into shared tokens and variants. Route families still contain bespoke CSS for genuine state colors and secondary surfaces.
- [x] Recompose the Home hierarchy around the approved editorial narrative: compact hero, immediate Bento discovery, catalog truth gate, ritual builder, gifting, brand story, journal, newsletter, verified trust strip, and footer.
- [x] Replace the former long sticky Home narrative with a compact seven-section flow and one restrained Hero-arrival motion that respects reduced-motion preferences.
- [x] Add the reference-aligned `01/04` visual scene cue without implying additional product slides or sticky interaction.
- [x] Remove the unsupported CSS-branded bottle and replace it with original unbranded concept photography for desktop and mobile.
- [ ] Replace the gated concept photography with approved real product packshots before public launch.
- [x] Add a visible, localized account entry to the shared header, linked to the existing protected order-account flow and verified down to 320px without overflow.
- [x] Complete the shared header interaction architecture: a shop-only desktop mega menu, accessible bilingual search dialog, verified-catalog cart drawer, and mobile shop-category accordion now include keyboard access, Escape dismissal, focus restoration, body scroll locking, and RTL/LTR behavior.
- [x] Route all seven category families to a compact bilingual collection system that exposes a truthful gated/available state and switches automatically to the verified commerce grid once approved products exist. Browser regression covers all 14 localized routes plus mobile and reduced-motion modes.
- [x] Recompose Shop, Search, PDP, and Cart around the reference system: light editorial hierarchy, verified-catalog gating, real SAR formatting, responsive media, and explicit error/empty/loading states.
- [x] Replace the long sticky Discovery, Journal, About, Contact, FAQ, Trust, and Terms scenes with compact editorial layouts while preserving every chapter, warning, FAQ, provenance note, and internal route.
- [x] Add a current-state full public-surface browser matrix covering 40 AR/EN routes twice at 1440 x 960 and 390 x 844, including one H1, locale direction, bilingual font stacks, landmarks, duplicate IDs, accessible control names, image alt attributes, sticky-scene regression, overflow, and network/runtime diagnostics.
- [x] Add verified Saudi market/currency and locale-switch controls to the shared footer.
- [ ] Complete footer slots for verified social, contact, payment, and legal data only when those owner inputs exist. Empty or unverified channels must not be invented.
- [ ] Replace all remaining gated concept imagery with approved product photography or transparent product sequences when supplied.

### P2 — discovery, measurement, and release polish

- [ ] Reconcile current navigation and collection routes with the approved information architecture, including a canonical gifting route if required.
- [x] Make analytics dispatch consent-aware and default-deny. A bilingual, non-blocking consent panel records an explicit grant or denial; events remain off on denial and the first page view fires immediately on grant without a reload.
- [ ] Complete the analytics event contract (`view_item`, `select_item`, `view_cart`, `begin_checkout`, search, and promotion events) after a real analytics provider and CMP are selected.
- [ ] Ensure journal and trust detail pages have deliberate social imagery rather than relying on a generic fallback.
- [x] Move the shared generated social card to a stable Route Handler so it resolves through explicit absolute metadata and no longer triggers root-layout `metadataBase` warnings.
- [x] Verify the current concept Hero art direction at 390, 768, 1024, 1440, and 1920 widths. Repeat LCP and crop approval after the final owner-supplied imagery replaces concept assets.
- [ ] Run accessibility, keyboard, contrast, performance, SEO, structured-data, checkout, and rollback gates against the final production configuration.

## Acceptance rules

Completion is not proved by a green build alone. Release requires:

1. real approved data and assets replace all explicit gates and concept labels;
2. Arabic and English are reviewed as native compositions at all target widths;
3. every public claim maps to an approved policy or source;
4. the complete Home → Collection → Product → Cart → Checkout path passes browser QA;
5. security, privacy, accessibility, performance, SEO, analytics consent, deployment, monitoring, and rollback gates pass;
6. only then may the release be pushed and deployed to the public domain.

## 2026-07-19 exact-reference rollout

The owner clarified that the supplied `1672 x 941` concept is the visual
authority for the entire public storefront, not only a palette reference. The
new pass therefore treats compact composition, asymmetric ivory Bento frames,
wine canvas, restrained gold detail, and editorial type roles as a shared page
system.

### Visual audit outcome

| Priority | Finding | Remediation status |
|---|---|---|
| P0 | The previous Home Hero consumed 900px, so the first viewport could not contain Hero, Bento, and service strip like the reference | Implemented in source; browser re-baseline pending |
| P0 | The previous Hero used a tall generic bottle rather than a square perfume flacon | Replaced with original desktop/mobile perfume concept assets; owner packshot approval remains required |
| P0 | The Bento used equal portrait cards instead of the reference mosaic | Rebuilt as a compact 12-column, two-row system with responsive 3/2/1 reflow |
| P0 | The service strip rendered after all Home sections | Home now injects it immediately after Bento while other routes retain the shared footer placement |
| P1 | RTL inherited direction reversed the reference's physical header utility positions | Header layout now keeps market/language physically left and actions physically right in both locales |
| P1 | Cairo made Arabic display copy more geometric than the supplied concept | Noto Naskh Arabic is now display-only; Cairo remains the body/control face |
| P1 | Shop, collections, discovery, journal, and trust routes retained long poster-like Heroes and large gaps | Shared route-family CSS now uses compact Heroes, ivory Bento shells, 6-12px gutters, and 48-80px section rhythm |
| P1 | Search, PDP, Cart, and Checkout needed the same system without harming task clarity | Scoped commerce/transaction rollout in progress; logic and authority data remain unchanged |

### New original project assets

- `public/elore-assets/hero-perfume-ritual-desktop-v3.avif`
- `public/elore-assets/hero-perfume-ritual-mobile-v2.avif`
- `public/elore-assets/bento-gifting-ribbon-v2.avif`
- `public/elore-assets/bento-paris-etching-v2.avif`

All four are text-free, logo-free concept assets. They are appropriate for the
gated preview only and do not replace approved launch packshots.

### Current validation state

- Targeted ESLint and `npx tsc --noEmit`: passing during implementation.
- Shop/collection browser QA: passing for AR/EN at 1440/1024/700/350, with
  4/3/2/1 columns and no overflow or browser diagnostics.
- Home visual baseline, updated `test:home-3d`, the full public matrix, live
  commerce matrix, font-stack build check, and final production build remain
  required after all route-family slices settle.
