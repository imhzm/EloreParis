import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isLocale, isLocalizedCommercePath, isLocalizedDiscoveryPath, isLocalizedJournalPath, isLocalizedShopCollectionPath, isLocalizedTrustSupportPath } from "@/lib/i18n";
import { getLegacyJournalRedirect, isRetiredLegacyJournalSlug } from "@/lib/journal-routing";
import { isPublicCatalogApproved } from "@/lib/release-controls";
import { getSearchCrawlerDirectiveHeader } from "@/lib/search-visibility";
import {
  canRoleAccessOpsPath,
  getDefaultOpsPathForRole,
  getOpsAccessConfig,
  OPS_SESSION_COOKIE,
  sanitizeOpsNextPath,
  verifyOpsSessionToken,
} from "@/lib/ops-access";

function applySearchCrawlerDirective(response: NextResponse) {
  const directive = getSearchCrawlerDirectiveHeader();
  if (directive) {
    response.headers.set("X-Robots-Tag", directive);
  }
  return response;
}

async function protectOperations(request: NextRequest) {
  const accessConfig = getOpsAccessConfig();
  if (!accessConfig.isProtectionActive) return NextResponse.next();

  const nextPath = sanitizeOpsNextPath(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  const redirectUrl = new URL("/ops-access", request.url);
  redirectUrl.searchParams.set("next", nextPath);

  if (!accessConfig.isConfigured) {
    redirectUrl.searchParams.set("mode", "setup_required");
    return NextResponse.redirect(redirectUrl);
  }

  const sessionCookie = request.cookies.get(OPS_SESSION_COOKIE)?.value;
  const session = sessionCookie
    ? await verifyOpsSessionToken(sessionCookie, accessConfig)
    : null;

  if (!session) return NextResponse.redirect(redirectUrl);

  if (!canRoleAccessOpsPath(session.role, request.nextUrl.pathname)) {
    const fallbackUrl = new URL(getDefaultOpsPathForRole(session.role), request.url);
    fallbackUrl.searchParams.set("denied", request.nextUrl.pathname);
    return NextResponse.redirect(fallbackUrl);
  }

  return NextResponse.next();
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/ops" || pathname.startsWith("/ops/")) {
    return applySearchCrawlerDirective(await protectOperations(request));
  }

  if (pathname === "/") {
    return applySearchCrawlerDirective(NextResponse.redirect(new URL("/ar", request.url), 308));
  }

  if (pathname === "/shop") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/ar/shop";
    return applySearchCrawlerDirective(NextResponse.redirect(redirectUrl, 308));
  }

  if (isLocalizedShopCollectionPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/ar${pathname}`;
    return applySearchCrawlerDirective(NextResponse.redirect(redirectUrl, 308));
  }

  if (isLocalizedDiscoveryPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/ar${pathname}`;
    return applySearchCrawlerDirective(NextResponse.redirect(redirectUrl, 308));
  }

  if (isLocalizedTrustSupportPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/ar${pathname}`;
    return applySearchCrawlerDirective(NextResponse.redirect(redirectUrl, 308));
  }

  if (isLocalizedJournalPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/ar${pathname}`;
    return applySearchCrawlerDirective(NextResponse.redirect(redirectUrl, 308));
  }

  if (pathname === "/search") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/ar/search";
    return applySearchCrawlerDirective(NextResponse.redirect(redirectUrl, 308));
  }

  if (pathname === "/checkout/success") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/ar/checkout/success";
    const response = NextResponse.redirect(redirectUrl, 307);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return applySearchCrawlerDirective(response);
  }

  if (isLocalizedCommercePath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/ar${pathname}`;
    return applySearchCrawlerDirective(NextResponse.redirect(redirectUrl, 308));
  }

  if (pathname.startsWith("/journal/")) {
    const slug = pathname.slice("/journal/".length);
    const destination = getLegacyJournalRedirect(slug);
    if (destination) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = `/ar${destination}`;
      return applySearchCrawlerDirective(NextResponse.redirect(redirectUrl, 308));
    }
    if (isRetiredLegacyJournalSlug(slug)) {
      return new NextResponse("<!doctype html><html lang=\"ar\" dir=\"rtl\"><meta charset=\"utf-8\"><title>المحتوى لم يعد متاحًا</title><main><h1>المحتوى لم يعد متاحًا</h1><p>تم إيقاف هذا المحتوى التجريبي لأنه لم يعد يطابق معايير المجلة.</p></main></html>", {
        status: 410,
        headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow, noarchive", "Cache-Control": "public, max-age=3600" },
      });
    }
  }

  if (pathname.startsWith("/products/") && !isPublicCatalogApproved()) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/ar/shop";
    return applySearchCrawlerDirective(NextResponse.redirect(redirectUrl, 308));
  }

  const localeSegment = pathname.split("/", 3)[1] ?? "";
  if (isLocale(localeSegment)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-elore-locale", localeSegment);
    return applySearchCrawlerDirective(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  return applySearchCrawlerDirective(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2)$).*)",
  ],
};
