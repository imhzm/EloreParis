# ÉLORÉ PARIS — Image Placement Spec

Generated from the site-wide audit (adversarially verified). **Blocked on image-generation credits** — the account has 0.6 credits and each image costs 2. Top up, then generate per the table and drop each asset into the reserved slot. None of these are bugs; they are the imagery plan.

Art direction (brand sheet §08): soft warm directional light, burgundy silk, travertine/natural stone, blush peony florals, gold touches, editorial composition, muted saturation so photos sit against burgundy without shouting.

Recommended model: `marketing_studio_image` (commercial/product) or `nano_banana_pro` (needs crisp text/4K). Reserve each aspect-ratio box in CSS first so imagery drops in with no layout churn.

| # | Slot (component:line) | Subject | Aspect | Transparency | Art direction |
|---|---|---|---|---|---|
| 1 | `omnira-inspired-home.tsx:117-134` (CSS bottle stage) | Perfume flacon still-life to seat on the existing CSS pedestal | ~3:4 portrait (~490px tall) | **Yes** (cutout, no background) | Clear rectangular flacon, gold cap, embossed ÉLORÉ, soft warm side light, glass highlight + reflection, faint blush-peony & burgundy-satin accents at the base. CSS pedestal/halo stays behind it. |
| 2 | `cinematic-shop-atlas-stage.tsx:41-54` (gradient hero) | /shop hero product still-life | 16:9 landscape, full-bleed | No | Warm-lit flacon + gold compact on travertine, burgundy silk ribbon arcing across ivory/beige, soft blush florals; keep negative space on the inline-end so the headline reads. |
| 3 | `cinematic-product-experience.tsx:104-111` (FORMULA text scene) | 3 ingredient macros behind the INCI cards | square→portrait crops | No | Shallow-DoF botanicals on travertine — damascus rose, sandalwood/amber resin, bergamot zest; muted saturation to sit against burgundy. |
| 4 | `cinematic-product-experience.tsx:99,108` (fitOrbit / ingredientStack / gifting) | Scent-pyramid + gifting photos | square/portrait; gifting ~3:2 | No | Citrus (top note), rose/jasmine (heart), amber/sandalwood (base); gifting/packaging still for the التغليف block. |
| 5 | `bento-content.ts:62-64` (perfumes tile = satin placeholder) | Perfume-tile still-life (replaces the silk-fold stand-in) | ~4:5 fill portrait | No | Amber-toned flacon on stone, blush florals, burgundy ribbon accent, warm light. |
| 6 | `bento-commerce-grid.tsx:80-98` (gifting card, flat sand) | Gift still-life | portrait fill, min-block 15rem | No | Burgundy satin + white gift box + gold wax-seal badge; keep a dark gradient region for the white label. |
| 7 | `bento-commerce-grid.tsx:113-126` (quote card, flat ivory) | Faded Paris landmark | end-third of the card | No | Grayscale/desaturated Eiffel to the inline-end, low opacity, light scrim keeps the quote legible. |
| 8 | `bento-commerce-grid.tsx:39-57` (intro tile) | Gold peony line-art ornament | small mark | **Yes** (sits on ivory) | Gold peony/flower line illustration anchored lower inline-start. |
| 9 | `cart-surface.tsx:200-233` (text-only lines) | Line thumbnails + summary editorial + optional gift-wrap | 1:1 thumbs; 4:5 summary; 3:2 gift | No | Bind each line's `media[0]` as a square cover thumb; burgundy ÉLORÉ paper bag + ribbon gift box on travertine, blush petals, warm light. |
| 10 | `localized-journal-experience.tsx:26,38` (lane + directory text tiles) | Per-article thumbnails | ~4:3 or 1:1 | No | Warm-ivory editorial vignettes matched to category (skincare texture / candle-lit ritual / gifting), low saturation. Driven by `record.image`. |

**Asset-splitting note:** `public/elore-assets` has 16 files today; every photographic AVIF is reused across 2–6 unrelated surfaces (one texture stands in for perfume/skincare/gifting). When new photography is generated, break the shared textures apart so each subject gets its own art-directed asset.
