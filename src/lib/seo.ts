import type { Metadata } from "next";
import { isSearchIndexingEnabled } from "@/lib/search-visibility";

const searchIndexingEnabled = isSearchIndexingEnabled();

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

export const publicRichPreviewRobots = searchIndexingEnabled
  ? indexableRichPreviewRobots
  : previewNoindexRobots;

export const defaultMetadataRobots: Metadata["robots"] = searchIndexingEnabled
  ? undefined
  : previewNoindexRobots;
