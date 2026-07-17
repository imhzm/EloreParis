import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Proves the content ownership register actually covers the site.
 *
 * /ops/content presents this register as exhaustive — "named owners across N
 * mapped public routes", "routes covered by the current ownership freeze" — and
 * an operator signs off against it. So a live public route that appears in no
 * entry does not show up as a gap; it shows up as nothing at all, and the
 * register reports green by omission.
 *
 * That is exactly what happened when perfumes was added as a category: it went
 * live, led the navigation, and the register never knew. Nothing downstream
 * could catch it either — release readiness counts blocked *entries*, not
 * routes.
 *
 * Parsed from source rather than imported because content-governance.ts is a
 * plain module of literals and this check must not depend on the app booting.
 */

const governance = readFileSync("src/lib/content-governance.ts", "utf8");
const registeredRoutes = new Set(
  [...governance.matchAll(/routes:\s*\[([^\]]*)\]/g)].flatMap((match) =>
    [...match[1].matchAll(/"([^"]+)"/g)].map((route) => route[1]),
  ),
);

assert.ok(registeredRoutes.size > 0, "The governance register parsed to nothing — the check is broken, not the register");

// Every shop category that exists is a live public route.
const categoryContent = readFileSync("src/lib/category-content.ts", "utf8");
const categorySlugsBlock = categoryContent.match(
  /export const categorySlugs\s*=\s*\[([^\]]*)\]/,
);
assert.ok(categorySlugsBlock, "Could not read categorySlugs");
const categorySlugs = [...categorySlugsBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
assert.ok(categorySlugs.length >= 6, `Expected the full category set, read ${categorySlugs.length}`);

for (const slug of categorySlugs) {
  assert.ok(
    registeredRoutes.has(`/shop/${slug}`),
    `/shop/${slug} is a live public category with no entry in the content ownership register. ` +
      `It would have no owner, no approver and no launch blocker, and /ops/content would report ` +
      `green on it by omission. Add it to an entry in src/lib/content-governance.ts.`,
  );
}

// Every navigation destination is, by definition, a route we ship.
const i18n = readFileSync("src/lib/i18n.ts", "utf8");
const navBlock = i18n.match(/nav:\s*\[(\[[^\]]*\](?:,\s*\[[^\]]*\])*)\]/);
assert.ok(navBlock, "Could not read the navigation entries");
const navHrefs = [...navBlock[1].matchAll(/\["([^"]+)",/g)].map((m) => m[1]);
assert.ok(navHrefs.length >= 5, `Expected a real navigation, read ${navHrefs.length} entries`);

for (const href of navHrefs) {
  assert.ok(
    registeredRoutes.has(href),
    `"${href}" is in the primary navigation but has no entry in the content ownership register.`,
  );
}

// Routes here are counted and displayed, never matched against a URL, so a
// locale-baked path silently covers one locale and leaves the other uncovered.
for (const route of registeredRoutes) {
  assert.doesNotMatch(
    route,
    /^\/(ar|en)\//,
    `Governance route "${route}" is baked to one locale. Both locales render from the same ` +
      `component, so the other one would be uncovered. Use the locale-agnostic path.`,
  );
}

console.log(
  `Content governance coverage checks passed: ${categorySlugs.length} categories and ` +
    `${navHrefs.length} navigation destinations are all mapped to an owner.`,
);
