import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");

const provider = read("src/components/wishlist-provider.tsx");
const button = read("src/components/wishlist-button.tsx");
const header = read("src/components/wishlist-header-link.tsx");
const surface = read("src/components/wishlist-surface.tsx");
const page = read("src/app/(storefront)/[locale]/wishlist/page.tsx");
const layout = read("src/app/(storefront)/[locale]/layout.tsx");
const productCard = read("src/components/product-card.tsx");
const productCardStyles = read("src/components/product-card.module.css");
const productExperience = read("src/components/cinematic-product-experience.tsx");
const shell = read("src/components/storefront-shell.tsx");
const analytics = read("src/lib/analytics.ts");
const i18n = read("src/lib/i18n.ts");
const sitemap = read("src/app/sitemap.ts");

// Versioned local-only state: malformed or future data fails closed, hydration
// happens after mount, and no account/API dependency can leak into this slice.
assert.match(provider, /WISHLIST_STORAGE_KEY = "elore:wishlist:v1"/);
assert.match(provider, /WISHLIST_STORAGE_VERSION = 1/);
assert.match(provider, /parsed\.version !== WISHLIST_STORAGE_VERSION/);
assert.match(provider, /if \(!isHydrated\) return;[\s\S]*?localStorage\.setItem/);
assert.match(provider, /window\.addEventListener\("storage"/);
assert.doesNotMatch(provider, /fetch\(|account|auth|email|phone/i);
assert.match(layout, /<WishlistProvider>[\s\S]*?<CartProvider>/);

// Both product surfaces expose a native pressed button. On cards it stays
// above the stretched name link and commerce actions remain independently live.
assert.match(productCard, /<WishlistButton[\s\S]*?surface="product_card"/);
assert.match(productExperience, /<WishlistButton[\s\S]*?surface="product_purchase"/);
assert.match(button, /aria-pressed=\{isSaved\}/);
assert.match(button, /disabled=\{!isHydrated\}/);
assert.match(productCardStyles, /\.name a::after\s*\{[\s\S]*?inset:\s*0/);
assert.match(productCardStyles, /\.wishlistButton\s*\{[\s\S]*?z-index:\s*2/);
assert.match(productCardStyles, /\.addButton,[\s\S]*?\.chooseLink,[\s\S]*?\.soldOut[\s\S]*?z-index:\s*1/);

assert.match(shell, /<WishlistHeaderLink locale=\{locale\} \/>/);
assert.match(header, /data-wishlist-header/);
assert.match(header, /isHydrated && count > 0/);

// Server truth is the only product source. An unavailable catalogue preserves
// local ids; reconciliation happens only once public truth is available.
assert.match(page, /getPublicCatalogSnapshot\(candidate\)/);
assert.match(page, /products=\{catalog\.products\}/);
assert.match(surface, /new Map\(products\.map/);
assert.match(surface, /catalogAvailable \? slugs\.filter/);
assert.match(surface, /if \(!isHydrated \|\| !catalogAvailable \|\| staleSlugs\.length === 0\) return/);
assert.match(surface, /removeMany\(staleSlugs\)/);
assert.match(surface, /role="status"/);
assert.doesNotMatch(`${page}\n${surface}`, /catalog-authority|CatalogImportProduct/);

for (const event of ["wishlist_add", "wishlist_remove", "wishlist_view"]) {
  assert.match(analytics, new RegExp(`\\| "${event}"`));
}
assert.match(button, /trackAnalyticsEvent\(isSaved \? "wishlist_remove" : "wishlist_add"/);
assert.match(surface, /eventName="wishlist_view"/);
assert.match(analytics, /typeof window === "undefined" \|\| !hasAnalyticsConsent\(\)/);

assert.match(i18n, /"\/wishlist"/);
assert.match(page, /robots: \{ index: false, follow: false \}/);
assert.match(page, /"@type": "WebPage"/);
assert.match(page, /"@type": "BreadcrumbList"/);
assert.doesNotMatch(sitemap, /wishlist/);

console.log("Wishlist local-state, public-catalog, stacking, analytics and metadata contract passed.");
