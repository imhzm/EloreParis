import localFont from "next/font/local";
import { Newsreader, Public_Sans } from "next/font/google";

// NOTE: every value passed to next/font must be a literal. The calls are
// transformed by SWC at build time and it cannot follow a variable — hoisting
// the shared unicode-range into a const fails the build with a misleading
// "Can't resolve 'next/font/local/target.css'". Hence the repetition below.

/**
 * The type system. One module so a face can never be swapped on one surface and
 * not another.
 *
 * The two Arabic faces are self-hosted rather than pulled from next/font/google
 * for two independent reasons:
 *
 *  1. Alyamama is not in the family list bundled with next@16.2.10 (1,911
 *     families; Google Fonts publishes 1,942). `import { Alyamama } from
 *     "next/font/google"` FAILS THE BUILD. Do not "simplify" these to Google
 *     imports — re-check on each Next upgrade before trying.
 *  2. next/font preloads unconditionally when `preload: true`. Both Arabic
 *     faces are imported by the shared [locale] layout, so preloading them made
 *     every English visitor download Arabic outlines they can never render a
 *     glyph from. `preload: false` leaves the @font-face in the stylesheet but
 *     lets the browser fetch it only when an Arabic codepoint actually needs
 *     it — which on /en is never.
 *
 * HOW THE TWO SCRIPTS ARE KEPT APART
 *
 * The Arabic faces come FIRST in the CSS stack and are subset to Arabic blocks
 * only — no Latin letters, no Western digits. That is what makes the split
 * safe, and the order is a consequence of it rather than a preference:
 *
 *   - Arabic codepoints hit the Arabic face immediately.
 *   - Latin and digits find nothing there and fall through to Newsreader /
 *     Public Sans, so the wordmark and every price render in the Latin voice
 *     and never in the borrowed Latin bundled inside an Arabic face.
 *   - On /en no glyph ever maps to an Arabic face, so it is never fetched.
 *
 * Latin-first ordering cannot work here. `adjustFontFallback: false` is typed
 * and documented but SILENTLY IGNORED by next/font/google in 16.2.10 — verified
 * in the built CSS, where --font-en-display still expands to
 * `"Newsreader", "Newsreader Fallback"`. That generated fallback resolves to a
 * local system serif (Times New Roman on Windows) which carries Arabic, so with
 * the Latin variable first every Arabic glyph matched it and the Arabic face
 * was never reached: the whole Arabic site rendered in Times. The option IS
 * honoured for next/font/local, which is why it still appears below.
 *
 * `size-adjust` values are measured, not taste. See the ratios on each face.
 */

/** AR display — Alyamama (SIL OFL). Naskh with real stroke modulation. */
export const arDisplay = localFont({
  src: "../fonts/Alyamama-var.woff2",
  weight: "300 900",
  style: "normal",
  display: "swap",
  variable: "--font-ar-display",
  preload: false,
  // The default metric proxy is Arial, which is not a sane stand-in for Naskh.
  // No `fallback` list either: every family named here is appended to this
  // variable, and it sits ahead of the Latin faces in the stack — a single
  // Arabic-capable entry (Segoe UI, Tahoma, Arial) would swallow Latin glyphs
  // before Newsreader ever saw them. The tail of the stack lives in globals.css.
  adjustFontFallback: false,
  declarations: [
    // Alyamama alef 0.636em -> Newsreader cap 0.676em, so an /ar headline and
    // an /en headline at the same token render at the same visual size.
    { prop: "size-adjust", value: "106%" },
    // A browser cannot know what a webfont covers until it downloads it, and
    // this face is first in the stack — so on /en it fetched the file just to
    // discover it holds no Latin. Declaring the range it is subset to lets the
    // browser skip it from the stylesheet alone.
    {
      prop: "unicode-range",
      value: "U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF",
    },
  ],
});

/** AR body — Fustat (SIL OFL). One variable file replaces four statics. */
export const arBody = localFont({
  src: "../fonts/Fustat-var.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  variable: "--font-ar-body",
  preload: false,
  // Same as arDisplay: no fallback list, because it would sit ahead of the
  // Latin body face and capture every Western digit — i.e. every price.
  adjustFontFallback: false,
  declarations: [
    // Arabic has a shorter body and taller ascenders than Latin, so matching
    // tooth-to-x-height alone would demand 1.43x and blow the alefs past the
    // line. Anchored instead on the mean of body and ascender:
    // Fustat mean(tooth .362, alef .755) = .5585 -> Public Sans mean(x .517,
    // cap .723) = .620.
    { prop: "size-adjust", value: "110%" },
    // Same as arDisplay — see the note there.
    {
      prop: "unicode-range",
      value: "U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF",
    },
  ],
});

/**
 * EN display — Newsreader.
 *
 * `axes: ["opsz"]` is REQUIRED, not decorative. next/font only requests
 * non-wght axes that are listed explicitly; omit it and Google serves the face
 * pinned at its opsz default of 16, `font-optical-sizing: auto` silently
 * no-ops, and a 96px hero renders at the contrast of body copy — losing the
 * entire reason this face was chosen over a static Didone.
 */
export const enDisplay = Newsreader({
  variable: "--font-en-display",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  // MUST stay false, and not for metric reasons.
  //
  // With it on, next/font appends a generated "Newsreader Fallback" family to
  // this variable, so --font-en-display expands to a two-family list. The CSS
  // stack is Latin-first, which makes the real order:
  //     Newsreader, "Newsreader Fallback", arDisplay, ...
  // That fallback resolves to a local system serif — Times New Roman on
  // Windows — which *does* carry Arabic. CSS picks the first family that has
  // the glyph, so every Arabic character matched the fallback and the Arabic
  // face was never reached: the whole Arabic site silently rendered in Times.
  // Verified in-browser: document.fonts.check('arDisplay', 'جمال') === false.
  //
  // For the same reason there is no `fallback` list here: anything named in it
  // is appended to this variable too, so a single Arabic-capable entry (Segoe
  // UI, Tahoma, or a bare `serif` resolving to Times) would re-open the hole.
  // The tail of the stack lives in globals.css, after the Arabic face.
  adjustFontFallback: false,
});

/**
 * EN body — Public Sans.
 *
 * Roman only. Both faces ship real italics and both were requested at first,
 * which preloaded ~175 KB of italic outlines on every page — for nothing: the
 * only <em> and <i> in the codebase are styling hooks that their own CSS pins
 * back to `font-style: normal`, so not one italic glyph is ever rendered. Add
 * the italic back the day italic copy is actually authored, not before.
 */
export const enBody = Public_Sans({
  variable: "--font-en-body",
  subsets: ["latin"],
  display: "swap",
  // Same reason as enDisplay: any family in this variable — generated fallback
  // or hand-listed — sits ahead of the Arabic body face and swallows every
  // Arabic glyph.
  adjustFontFallback: false,
});

export const fontVariables = [
  arDisplay.variable,
  arBody.variable,
  enDisplay.variable,
  enBody.variable,
].join(" ");
