import {
  Cairo,
  Noto_Naskh_Arabic,
  Playfair_Display,
  Public_Sans,
} from "next/font/google";

/**
 * The type system follows the approved compact-commerce reference and the
 * implementation pack's role split.
 *
 *   ARABIC — DISPLAY    Noto Naskh Arabic
 *   ARABIC — UI/BODY    Cairo
 *   ENGLISH — SECONDARY Playfair Display / Regular
 *
 * The user's latest direction makes the supplied reference the visual
 * authority. Noto Naskh provides its editorial headline silhouette while Cairo
 * remains the clearer UI face.
 *
 * HOW THE TWO SCRIPTS ARE KEPT APART — NOT HERE.
 *
 * The bilingual stack is assembled in globals.css from the REAL family names,
 * not from the `variable` names these exports produce. Read the comment on
 * --stack-display there before changing anything in this file; the reasoning
 * lives at the place that depends on it.
 *
 * The short version, measured against a clean build rather than assumed:
 *
 * 1. `subsets` does NOT fence a family to a script. It selects what gets
 *    preloaded. Cairo requested with subsets: ["arabic"] still emits a basic
 *    Latin face, so Cairo will happily render the wordmark and every price.
 *
 * 2. `adjustFontFallback: false` is typed but IGNORED here — the generated
 *    "<Family> Fallback" is emitted anyway, and it is range-less, so whichever
 *    variable comes first in a stack renders everything.
 *
 * These exports therefore exist for ONE reason: `fontVariables` goes on <html>,
 * and that class is what makes next/font emit and preload the @font-face rules
 * at all. The --font-* variables they define are deliberately unused — nothing
 * outside this file reads them. `variable` is still the right option to pass,
 * though: `className` would set font-family on <html> to the poisoned pair.
 */

/**
 * AR body/control — Cairo. Keeping it separate from display preserves compact,
 * legible navigation and form labels while the more calligraphic face remains
 * limited to headings.
 *
 * One call, not two. Display and body were separate exports with identical
 * options, which emitted every Cairo @font-face twice for two variables that
 * nothing reads.
 */
export const arabic = Cairo({
  variable: "--font-ar",
  subsets: ["arabic"],
  weight: "variable",
  display: "swap",
});

/**
 * AR display — Noto Naskh Arabic.
 *
 * The compact commerce reference uses a calligraphic editorial silhouette for
 * display copy while the UI remains deliberately clean. Cairo therefore stays
 * the body/control face and Noto Naskh is limited to headings. This is also the
 * explicit Arabic display recommendation in the implementation pack.
 */
export const arabicDisplay = Noto_Naskh_Arabic({
  variable: "--font-ar-display",
  subsets: ["arabic"],
  weight: "variable",
  display: "swap",
});

/** EN display — Playfair Display, per the sheet. */
export const enDisplay = Playfair_Display({
  variable: "--font-en-display",
  subsets: ["latin"],
  display: "swap",
});

/**
 * EN body — Public Sans.
 *
 * The sheet names Playfair for English, and Playfair is a display face: Google's
 * own notes place it at headings, and its contrast is drawn for large sizes.
 * Setting 15–17px body copy in it is a legibility regression, so the sheet's
 * face is used where the sheet shows it — headlines — and a body companion
 * carries running text. The implementation pack asks for exactly this split
 * ("Latin Display" and "Latin UI/Body" as separate roles) and sanctions a
 * neutral sans for the body role.
 *
 * Roman only: the sole <em> and <i> in the codebase are styling hooks their own
 * CSS pins back to font-style: normal, so italic outlines would preload to
 * render nothing.
 */
export const enBody = Public_Sans({
  variable: "--font-en-body",
  subsets: ["latin"],
  display: "swap",
});

export const fontVariables = [
  arabic.variable,
  arabicDisplay.variable,
  enDisplay.variable,
  enBody.variable,
].join(" ");
