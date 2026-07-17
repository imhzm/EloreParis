// Fails the build when a scroll reveal hides content instead of revealing it.
//
// The scroll-scene system drives three custom properties per scene: --progress,
// --enter and --exit. All three are declared `0` in CSS and written ONLY by
// use-scroll-scene-progress.ts. So `--enter` reads 0 in every state that matters
// before the handler has run on that scene:
//
//   - the server-rendered HTML, before hydration
//   - any session where the JS fails or is still in flight
//   - the moment a scene's sticky frame first fills the viewport, since progress
//     starts at 0 there
//   - a `#hash` jump straight into a scene, which lands at progress 0
//
// Binding OPACITY to it therefore does not delay content — it hides it, and
// opacity does not remove anything from the tab order, so what it hides is still
// focusable. This shipped in five components at once:
//
//   - cinematic-product-experience: the whole purchase panel — variant selector,
//     quantity, Add to Cart — at opacity 0 with seven reachable buttons, and the
//     hero's own `href="#purchase"` CTA landing on it.
//   - omnira-inspired-home: the newsletter field, submit and consent.
//   - localized-journal-experience: 22 links measured on-screen, focusable and
//     invisible at once.
//   - localized-search-experience and localized-trust-support-experience:
//     headings and directory links.
//
// CLAUDE.md §13 allows fade + translate reveals and forbids "تأخير ظهور المحتوى
// الأساسي" — delaying the essential content. The rule this enforces is the line
// between those two: drive TRANSFORM from --enter as much as you like, because a
// transform cannot make content unreachable. Do not drive opacity from it.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIRS = ["src/components", "src/app"];

/** Opacity below this is not a reveal; it is a hidden control. */
const LEGIBLE = 0.5;

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Resolve an opacity expression in the at-rest state the browser starts in. */
function resolveAtRest(expression) {
  const substituted = expression
    .replace(/var\(--enter\)/g, "0")
    .replace(/var\(--exit\)/g, "0")
    .replace(/var\(--progress\)/g, "0")
    .replace(/calc/g, "");
  if (!/^[\d\s.+\-*/()]+$/.test(substituted)) return null;
  try {
    const value = Function(`"use strict";return (${substituted})`)();
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function cssFilesIn(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...cssFilesIn(full));
    else if (entry.name.endsWith(".css")) out.push(full);
  }
  return out;
}

const failures = [];

for (const dir of DIRS) {
  for (const file of cssFilesIn(dir)) {
    const css = stripComments(readFileSync(file, "utf8"));
    for (const [, expression] of css.matchAll(/opacity\s*:\s*([^;}]*var\(--enter\)[^;}]*)/g)) {
      const atRest = resolveAtRest(expression);
      if (atRest === null) {
        failures.push(
          `${file}\n    opacity: ${expression.trim()}\n    Could not be resolved, so it cannot be shown to be safe. ` +
            `Drive transform from --enter instead of opacity.`,
        );
        continue;
      }
      if (atRest < LEGIBLE) {
        failures.push(
          `${file}\n    opacity: ${expression.trim()}\n    Resolves to ${atRest} before the scroll handler runs, so this content is ` +
            `invisible on the server-rendered page, on a #hash jump into the scene, and for the first ` +
            `stretch of the scene's own scroll — while staying in the tab order. ` +
            `Drive transform from --enter; leave opacity to --exit.`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Scroll reveal check FAILED — content is hidden, not revealed:\n");
  for (const failure of failures) console.error(`  - ${failure}\n`);
  process.exit(1);
}

console.log("Scroll reveal check passed: no opacity is gated behind --enter.");
