import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");

const component = read("src/components/localized-trust-support-experience.tsx");
const styles = read("src/components/localized-trust-support-experience.module.css");
const content = read("src/lib/trust-support-content.ts");

assert.doesNotMatch(component, /useScrollSceneProgress|data-trust-scene|data-trust-detail-scene/);
assert.doesNotMatch(styles, /position\s*:\s*sticky|min-height\s*:\s*135svh|overflow-y\s*:\s*auto/);
assert.doesNotMatch(styles, /height\s*:\s*calc\(100svh/);
assert.match(component, /data-trust-experience/);
assert.match(component, /data-trust-variant="policy"/);
assert.match(component, /data-trust-variant=\{variant\}/);
assert.match(component, /getTrustSupportVariant\(record\.slug\)/);

assert.match(content, /export type TrustSupportVariant = "brand" \| "support" \| "faq" \| "policy"/);
for (const [slug, variant] of Object.entries({
  about: "brand",
  contact: "support",
  faq: "faq",
  terms: "policy",
  verification: "policy",
  privacy: "policy",
  shipping: "policy",
  returns: "policy",
  authenticity: "policy",
})) {
  assert.match(content, new RegExp(`${slug}: "${variant}"`), `${slug} must map to ${variant}`);
}

assert.match(content, /export const trustSupportUiCopy = \{[\s\S]*?ar: \{[\s\S]*?en: \{/);
assert.match(content, /statusLabel: "حالة الاعتماد"/);
assert.match(content, /statusLabel: "Approval status"/);
assert.match(content, /const provisional = \{/);
assert.match(component, /record\.status/);
assert.doesNotMatch(component, /mailto:|tel:/i, "Unverified contact channels must not be introduced");

assert.match(component, /<header[\s\S]*?aria-labelledby="trust-title"/);
assert.match(component, /<header[\s\S]*?aria-labelledby="trust-detail-title"/);
assert.match(component, /<nav aria-label=\{copy\.directory\}>/);
assert.match(component, /<details key=\{question\}>[\s\S]*?<summary>\{question\}<\/summary>/);
assert.match(component, /<Image[\s\S]*?alt=""[\s\S]*?priority/);
assert.match(styles, /:focus-visible/);
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(styles, /@media \(max-width: 620px\)/);

console.log("Compact AR/EN trust and support variants, truth gates, and accessibility checks passed.");
