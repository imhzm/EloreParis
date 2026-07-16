import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
// The storefront lives under a route group so that [locale]/layout.tsx can be a
// root layout and read the locale from params, which is what lets these routes
// prerender. Route groups do not appear in URLs, only on disk.
const localeRoot = "src/app/(storefront)/[locale]";
const loading = readFileSync(path.join(root, localeRoot, "localized-loading.tsx"), "utf8");
const errorBoundary = readFileSync(path.join(root, localeRoot, "error.tsx"), "utf8");
const styles = readFileSync(
  path.join(root, localeRoot, "localized-boundary.module.css"),
  "utf8",
);

assert.match(loading, /role="status"/);
assert.match(loading, /aria-live="polite"/);
assert.match(loading, /aria-busy="true"/);
assert.match(errorBoundary, /role="alert"/);
assert.match(errorBoundary, /aria-live="assertive"/);
assert.match(errorBoundary, /headingRef\.current\?\.focus\(\)/);
assert.match(errorBoundary, /onClick=\{reset\}/);
assert.match(errorBoundary, /\`\/\$\{locale\}\/track-order\`/);
assert.doesNotMatch(`${loading}\n${errorBoundary}`, /<main\b/i);
assert.doesNotMatch(errorBoundary, /error\.(?:message|stack|digest)/);
assert.match(styles, /prefers-reduced-motion:\s*reduce/);
assert.match(styles, /\.loadingBlock\s*\{\s*animation:\s*none/);
assert.throws(
  () => readFileSync(path.join(root, localeRoot, "loading.tsx"), "utf8"),
  /ENOENT/,
  "A locale-root loading boundary would stream before dynamic notFound responses and turn 404 into 200",
);

for (const routeLoadingFile of [
  "cart/loading.tsx",
  "checkout/loading.tsx",
  "track-order/loading.tsx",
  "account/orders/loading.tsx",
]) {
  assert.match(
    readFileSync(path.join(root, localeRoot, routeLoadingFile), "utf8"),
    /LocalizedLoading/,
  );
}

console.log("Localized loading/error accessibility and disclosure checks passed.");
