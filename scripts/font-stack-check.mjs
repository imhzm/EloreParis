// Guards the bilingual font stack against the two failure modes that have both
// shipped from this repo. Reads the BUILT CSS, because every fact this checks is
// produced by next/font at build time and none of it is visible in the source.
//
// FAILURE MODE 1 — a range-less family in front of a real one.
//   next/font emits a generated companion for every family: "Cairo Fallback" is
//   local(Arial), "Playfair Display Fallback" is local(Times New Roman). They
//   carry no unicode-range, so they match every glyph in every script and end
//   the cascade. Put one ahead of Cairo and the entire Arabic site renders in
//   Times. That is why --stack-* names real families rather than the
//   --font-*-* variables, each of which expands to `Family, Family Fallback`.
//
// FAILURE MODE 2 — a name in the stack that no @font-face defines.
//   Because the stacks name families directly, a next/font upgrade that hashes
//   family names (its own source comments say it intends to) would silently
//   drop the site to Georgia. Nothing would throw. This asserts every named
//   family is really declared.
//
// Run against .next after a build: `npm run test:font-stack`.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const CSS_DIR = join(".next", "static", "chunks");

/** Families the stacks are allowed to name without an @font-face — the generics
 *  and the system faces the OS provides. */
const SYSTEM_FAMILIES = new Set([
  "georgia",
  "serif",
  "sans-serif",
  "segoe ui",
  "tahoma",
]);

function readBuiltCss() {
  if (!existsSync(CSS_DIR)) {
    throw new Error(`No built CSS at ${CSS_DIR}. Run \`npm run build\` first.`);
  }
  const files = readdirSync(CSS_DIR).filter((f) => f.endsWith(".css"));
  if (files.length === 0) {
    throw new Error(`No .css files under ${CSS_DIR}. Run \`npm run build\` first.`);
  }
  return files.map((f) => readFileSync(join(CSS_DIR, f), "utf8")).join("\n");
}

/**
 * Every @font-face in the build: whether it declares a unicode-range, and
 * whether it is a downloaded webfont (url) or a local() alias.
 *
 * The distinction matters. A range-less local() does NOT reliably end the
 * cascade: "Cairo Fallback" is local(Arial), and on a box with no Arial the
 * face never loads and the browser walks on to the next family. So generics
 * trailing a range-less local() are a real safety net, not dead weight. A
 * range-less family only truly swallows the rest when it is guaranteed to
 * resolve — and either way it swallows everything for the systems where it DOES
 * resolve, which is what makes it fatal in front of a real webfont.
 */
function collectFontFaces(css) {
  const faces = new Map(); // family -> { ranged, downloaded }
  for (const [, body] of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const family = body.match(/font-family:\s*([^;]+)/)?.[1];
    if (!family) continue;
    const name = family.trim().replace(/^['"]|['"]$/g, "").toLowerCase();
    const ranged = /unicode-range:/.test(body);
    const downloaded = /src:[^;]*url\(/.test(body);
    // A family split across subset files is ranged only if EVERY file is.
    const prev = faces.get(name);
    faces.set(name, {
      ranged: prev ? prev.ranged && ranged : ranged,
      downloaded: prev ? prev.downloaded || downloaded : downloaded,
    });
  }
  return faces;
}

function parseStack(css, token) {
  const value = css.match(new RegExp(`${token}:\\s*([^;}]+)`))?.[1];
  if (!value) throw new Error(`${token} is not defined in the built CSS.`);
  return value.split(",").map((f) => f.trim().replace(/^['"]|['"]$/g, ""));
}

const css = readBuiltCss();
const faces = collectFontFaces(css);
const failures = [];

for (const token of ["--stack-display", "--stack-body"]) {
  const stack = parseStack(css, token);

  // Failure mode 2: a named family nothing declares.
  stack.forEach((family, index) => {
    const key = family.toLowerCase();
    if (SYSTEM_FAMILIES.has(key)) return;
    if (faces.has(key)) return;
    failures.push(
      `${token} names "${family}" at position ${index + 1}, but no @font-face ` +
        `declares it and it is not a known system family. Every glyph would ` +
        `fall past it. If next/font started hashing family names, build the ` +
        `stack from the font objects instead of naming families here.`,
    );
  });

  // Failure mode 1: a range-less family in front of a real webfont. Everything
  // downstream of it is unreachable on every system where the local() resolves,
  // so the webfont pays to download and never inks a glyph — and if it is the
  // Arabic face, the site renders in whatever the local() happens to be.
  const lastWebfont = stack.reduce(
    (last, family, i) => (faces.get(family.toLowerCase())?.downloaded ? i : last),
    -1,
  );
  stack.slice(0, Math.max(lastWebfont, 0)).forEach((family, index) => {
    const face = faces.get(family.toLowerCase());
    if (!face || face.ranged) return;
    const buried = stack
      .slice(index + 1, lastWebfont + 1)
      .filter((f) => faces.get(f.toLowerCase())?.downloaded);
    failures.push(
      `${token} puts the range-less family "${family}" at position ` +
        `${index + 1}, ahead of the real webfont(s) ${buried.join(", ")}. ` +
        `It carries no unicode-range, so it matches every glyph in every ` +
        `script and buries them. Range-less families may only trail the ` +
        `webfonts.`,
    );
  });
}

// The Latin-only roles get prepended to the full stack at two call sites
// (`var(--font-body-latin), var(--font-body)`), so the same rule binds them:
// a generated fallback here would hide Cairo and render Arabic eyebrows in Arial.
for (const token of ["--font-display-latin", "--font-body-latin"]) {
  const stack = parseStack(css, token);
  const generated = stack.filter((f) => /\bFallback$/i.test(f));
  if (generated.length > 0) {
    failures.push(
      `${token} includes the generated fallback "${generated[0]}". This token is ` +
        `prepended to the full stack for bilingual eyebrows, and the generated ` +
        `fallback is range-less, so it would render their Arabic in ` +
        `local(Arial) instead of Cairo. Name a single real family.`,
    );
  }
}

if (failures.length > 0) {
  console.error("Font stack check FAILED:\n");
  for (const f of failures) console.error(`  - ${f}\n`);
  process.exit(1);
}

console.log(
  `Font stack check passed: ${faces.size} @font-face families, ` +
    `no range-less family ahead of a real one.`,
);
