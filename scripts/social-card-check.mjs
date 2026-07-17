// Fails when a metadata builder returns an openGraph block with no image.
//
// Next does not merge `openGraph`. A route that returns one REPLACES the
// layout's outright — images included. So a builder that sets title, description
// and url and stops looks complete, type-checks, renders, and silently ships a
// route whose share card is a bare link. Nothing on the page shows it. You only
// see it by pasting the URL into a chat, which is not something a build does.
//
// Measured before this existed: 8 of 16 storefront routes had no og:image —
// search, about, contact, faq, terms, trust, trust/shipping and the whole
// journal. The routes that worked (discovery, shop) only worked because they
// happened to name an image of their own; nothing made them.
//
// The rule: if you return an openGraph, it carries an image. site-content's
// defaultSocialCard() is the fallback for anything without art of its own.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const LIB = "src/lib";

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/**
 * Find each `<key>: { ... }` object literal and return its body.
 *
 * Brace-matched, not `[^}]*`. These blocks are full of template literals, and
 * `${title}` carries a closing brace — a lazy character class stops dead on it
 * and reports an images key that is right there two properties later. This
 * check's first draft did exactly that and accused discovery-page-data, which
 * has always been correct. Counting braces handles it for free: `${` opens and
 * `}` closes, so an interpolation is balanced and nets to zero.
 */
function objectBlocks(source, key) {
  const blocks = [];
  const marker = new RegExp(`${key}:\\s*\\{`, "g");
  let match;
  while ((match = marker.exec(source))) {
    let depth = 1;
    let index = match.index + match[0].length;
    const start = index;
    while (index < source.length && depth > 0) {
      const character = source[index];
      if (character === "{") depth += 1;
      else if (character === "}") depth -= 1;
      index += 1;
    }
    blocks.push(source.slice(start, index - 1));
  }
  return blocks;
}

const failures = [];

for (const file of readdirSync(LIB).filter((name) => name.endsWith("page-data.ts"))) {
  const path = join(LIB, file);
  const source = stripComments(readFileSync(path, "utf8"));

  for (const block of objectBlocks(source, "openGraph")) {
    if (/\bimages\s*:/.test(block)) continue;
    failures.push(
      `${path}\n    An openGraph block names no images. A route's openGraph replaces the ` +
        `layout's, so this route shares as a bare link with no card. Add ` +
        `images: defaultSocialCard(title).openGraph — or the route's own art.`,
    );
  }

  // twitter:image is separate metadata and is dropped the same way.
  for (const block of objectBlocks(source, "twitter")) {
    if (/\bimages\s*:/.test(block)) continue;
    failures.push(
      `${path}\n    A twitter block names no images. Same replacement rule as ` +
        `openGraph. Add images: defaultSocialCard(title).twitter.`,
    );
  }
}

if (failures.length > 0) {
  console.error("Social card check FAILED — routes would share as bare links:\n");
  for (const failure of failures) console.error(`  - ${failure}\n`);
  process.exit(1);
}

console.log("Social card check passed: every openGraph and twitter block names an image.");
