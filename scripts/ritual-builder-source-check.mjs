import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");

const page = read("src/app/(storefront)/[locale]/rituals/builder/page.tsx");
const redirect = read("src/app/(storefront)/[locale]/rituals/page.tsx");
const component = read("src/components/ritual-builder.tsx");
const recommendation = read("src/lib/ritual-recommendation.ts");
const analytics = read("src/lib/analytics.ts");
const i18n = read("src/lib/i18n.ts");
const home = read("src/components/elore-reference-home.tsx");
const styles = read("src/components/ritual-builder.module.css");

// Only the public catalogue projection crosses into the experience. Draft and
// authority records must never become a hidden recommendation source.
assert.match(page, /getPublicCatalogSnapshot\(candidate\)/);
assert.match(page, /catalogAvailable=\{catalog\.available\}/);
assert.match(page, /products=\{catalog\.products\}/);
assert.doesNotMatch(`${page}\n${component}\n${recommendation}`, /catalog-authority|CatalogImportProduct|Math\.random/);
assert.match(recommendation, /readonly PublicCatalogProduct\[\]/);
assert.match(recommendation, /right\.score - left\.score \|\| left\.product\.slug\.localeCompare/);
assert.match(recommendation, /product\.approvedClaims/);

// The quiz remains native-keyboard operable and its result never bypasses the
// honest catalogue gate or the single-purchasable-variant rule.
assert.match(component, /<fieldset/);
assert.match(component, /<legend/);
assert.match(component, /type="radio"/);
assert.match(component, /aria-current=\{step === index \? "step"/);
assert.match(component, /catalogAvailable\s*\? recommendRitualProducts/);
assert.match(component, /inStockVariants\.length === 1/);
assert.match(component, /role="status" aria-live="polite"/);

// Ritual events still pass through the project's consent-aware analytics
// boundary; the component does not introduce a direct network side-channel.
for (const event of ["ritual_start", "ritual_step", "ritual_complete"]) {
  assert.match(analytics, new RegExp(`\\| "${event}"`));
  assert.match(component, new RegExp(`trackAnalyticsEvent\\("${event}"`));
}
assert.match(analytics, /typeof window === "undefined" \|\| !hasAnalyticsConsent\(\)/);
assert.doesNotMatch(component, /fetch\(|sendBeacon|XMLHttpRequest|email|phone/i);

assert.match(redirect, /redirect\(`\/\$\{locale\}\/rituals\/builder`\)/);
assert.match(i18n, /"\/rituals\/builder"/);
assert.match(i18n, /\["\/rituals\/builder", "ابني طقسك"\]/);
assert.match(i18n, /\["\/rituals\/builder", "Ritual finder"\]/);
assert.match(home, /href=\{href\("\/rituals\/builder"\)\}/);
assert.match(page, /"@type": "WebPage"/);
assert.match(page, /"@type": "BreadcrumbList"/);
assert.match(page, /"ar-SA": "\/ar\/rituals\/builder"/);
assert.match(styles, /@media \(max-width: 820px\)/);
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);

console.log("Ritual builder public-catalog, accessibility, analytics and route contract passed.");
