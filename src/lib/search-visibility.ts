import { isPublicCatalogApproved, isPublicDiscoveryContentApproved, isPublicEditorialContentApproved, isPublicLegalContentApproved } from "./release-controls";

function normalizeOptionalUrl(candidate?: string | null) {
  if (!candidate) {
    return null;
  }

  const trimmed = candidate.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, "");
}

function isHostedUrl(candidate?: string | null) {
  const normalizedUrl = normalizeOptionalUrl(candidate);

  if (!normalizedUrl) {
    return false;
  }

  try {
    const parsedUrl = new URL(normalizedUrl);
    return !["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname);
  } catch {
    return false;
  }
}

export type SearchRuntimeStage = "local" | "preview" | "production";

export function getSearchRuntimeStage(
  env: NodeJS.ProcessEnv = process.env,
): SearchRuntimeStage {
  const appEnv = env.APP_ENV?.trim().toLowerCase();

  if (appEnv === "production") {
    return "production";
  }

  if (["preview", "staging", "test"].includes(appEnv ?? "")) {
    return "preview";
  }

  const vercelEnv = env.VERCEL_ENV?.trim().toLowerCase();

  if (vercelEnv === "production") {
    return "production";
  }

  if (vercelEnv) {
    return "preview";
  }

  if (env.NODE_ENV !== "production") {
    return "local";
  }

  if (
    isHostedUrl(env.NEXT_PUBLIC_SITE_URL) ||
    isHostedUrl(env.RENDER_EXTERNAL_URL) ||
    isHostedUrl(env.VERCEL_PROJECT_PRODUCTION_URL)
  ) {
    return "production";
  }

  if (isHostedUrl(env.VERCEL_BRANCH_URL) || isHostedUrl(env.VERCEL_URL)) {
    return "preview";
  }

  return "local";
}

export function isSearchIndexingEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  return (
    getSearchRuntimeStage(env) === "production" &&
    isPublicReleaseApproved(env) &&
    isPublicCatalogApproved(env) &&
    isPublicDiscoveryContentApproved(env) &&
    isPublicEditorialContentApproved(env) &&
    isPublicLegalContentApproved(env)
  );
}

export function isPublicReleaseApproved(
  env: NodeJS.ProcessEnv = process.env,
) {
  return env.PUBLIC_RELEASE_APPROVED?.trim().toLowerCase() === "true";
}

export function getSearchCrawlerDirectiveHeader(
  env: NodeJS.ProcessEnv = process.env,
) {
  return isSearchIndexingEnabled(env) ? null : "noindex, nofollow, noarchive";
}
