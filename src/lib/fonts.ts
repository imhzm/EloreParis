import localFont from "next/font/local";
import { Newsreader, Public_Sans } from "next/font/google";

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
 *     every English visitor download ~119 KB of Arabic outlines they can never
 *     render a glyph from. `preload: false` leaves the @font-face in the
 *     stylesheet but lets the browser fetch it only when an Arabic codepoint
 *     actually needs it — which on /en is never.
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
  adjustFontFallback: false,
  fallback: ["Segoe UI", "Tahoma", "Arial"],
  declarations: [
    // Alyamama alef 0.636em -> Newsreader cap 0.676em, so an /ar headline and
    // an /en headline at the same token render at the same visual size.
    { prop: "size-adjust", value: "106%" },
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
  adjustFontFallback: false,
  fallback: ["Segoe UI", "Tahoma", "Arial"],
  declarations: [
    // Arabic has a shorter body and taller ascenders than Latin, so matching
    // tooth-to-x-height alone would demand 1.43x and blow the alefs past the
    // line. Anchored instead on the mean of body and ascender:
    // Fustat mean(tooth .362, alef .755) = .5585 -> Public Sans mean(x .517,
    // cap .723) = .620.
    { prop: "size-adjust", value: "110%" },
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
});

export const fontVariables = [
  arDisplay.variable,
  arBody.variable,
  enDisplay.variable,
  enBody.variable,
].join(" ");
