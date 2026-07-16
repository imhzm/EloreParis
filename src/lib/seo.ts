import type { Metadata } from "next";
import { isSearchIndexingEnabled } from "@/lib/search-visibility";

export const previewNoindexRobots = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
} satisfies NonNullable<Metadata["robots"]>;

const indexableRichPreviewRobots = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large" as const,
  },
} satisfies NonNullable<Metadata["robots"]>;

/**
 * Functions, not constants.
 *
 * These used to be consts derived from a single module-scope
 * `isSearchIndexingEnabled()` call, which froze the answer at import — build
 * time for prerendered metadata, process start for everything else. robots.ts
 * and sitemap.ts call the same predicate per request, so the two could disagree
 * about whether the site was indexable and nothing said so.
 *
 * Being callable does not make prerendered metadata dynamic: a page's robots tag
 * is still decided when that page is rendered, and for a static page that is the
 * build. What it does is stop the freeze from being invisible, and let every
 * dynamic surface agree with robots.txt. The gates the build reads are exported
 * by deploy-release.sh for exactly this reason — and changing an approval
 * therefore requires a redeploy, not a restart.
 */
export function getPublicRichPreviewRobots(): NonNullable<Metadata["robots"]> {
  return isSearchIndexingEnabled()
    ? indexableRichPreviewRobots
    : previewNoindexRobots;
}

/**
 * `undefined` when indexing is on, so Next omits the tag entirely and pages are
 * free to opt themselves out; the explicit noindex otherwise.
 */
export function getDefaultMetadataRobots(): Metadata["robots"] {
  return isSearchIndexingEnabled() ? undefined : previewNoindexRobots;
}
