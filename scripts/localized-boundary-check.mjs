import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const loading = readFileSync(path.join(root, "src/app/[locale]/localized-loading.tsx"), "utf8");
const errorBoundary = readFileSync(path.join(root, "src/app/[locale]/error.tsx"), "utf8");
const styles = readFileSync(
  path.join(root, "src/app/[locale]/localized-boundary.module.css"),
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
  () => readFileSync(path.join(root, "src/app/[locale]/loading.tsx"), "utf8"),
  /ENOENT/,
  "A locale-root loading boundary would stream before dynamic notFound responses and turn 404 into 200",
);

for (const routeLoadingFile of [
  "src/app/[locale]/cart/loading.tsx",
  "src/app/[locale]/checkout/loading.tsx",
  "src/app/[locale]/track-order/loading.tsx",
  "src/app/[locale]/account/orders/loading.tsx",
]) {
  assert.match(readFileSync(path.join(root, routeLoadingFile), "utf8"), /LocalizedLoading/);
}

console.log("Localized loading/error accessibility and disclosure checks passed.");
