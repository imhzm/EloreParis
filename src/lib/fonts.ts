import { Cairo, Playfair_Display, Public_Sans } from "next/font/google";

/**
 * The type system, per the 2026-07-17 brand identity sheet.
 *
 *   ARABIC — PRIMARY    Cairo Display / Bold
 *   ENGLISH — SECONDARY Playfair Display / Regular
 *
 * The sheet is the authority and supersedes the measured pairing that stood
 * here before (Alyamama + Fustat + Newsreader + Public Sans), which the owner
 * confirmed on 2026-07-17.
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
 * AR — Cairo, the whole Arabic voice. One family for display and body,
 * separated by weight, which is what the sheet shows and what the pack's "no
 * more than two faces per language" rule asks for. Arabic has no native
 * serif/sans split to import.
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
  enDisplay.variable,
  enBody.variable,
].join(" ");
