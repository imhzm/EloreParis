import { NextResponse } from "next/server";
import { getPublicCatalogSnapshot } from "@/lib/public-catalog";
import type { PublicCatalogLocale } from "@/lib/public-catalog-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPublicCatalogLocale(value: string | null): value is PublicCatalogLocale {
  return value === "ar" || value === "en";
}

export function GET(request: Request) {
  const localeValue = new URL(request.url).searchParams.get("locale") ?? "ar";
  if (!isPublicCatalogLocale(localeValue)) {
    return NextResponse.json(
      { error: "Catalog locale must be ar or en.", code: "catalog_locale_invalid" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(getPublicCatalogSnapshot(localeValue), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

type ResolveItem = { productSlug: string; sku: string; quantity: number };

function isExactResolveItem(value: unknown): value is ResolveItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    Object.keys(item).length === 3 &&
    typeof item.productSlug === "string" &&
    item.productSlug.trim().length > 0 &&
    item.productSlug.length <= 180 &&
    typeof item.sku === "string" &&
    item.sku.trim().length > 0 &&
    item.sku.length <= 180 &&
    Number.isSafeInteger(item.quantity) &&
    (item.quantity as number) >= 1 &&
    (item.quantity as number) <= 10
  );
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim();
  if (contentType !== "application/json") {
    return NextResponse.json(
      { error: "Catalog resolver accepts application/json only.", code: "unsupported_media_type" },
      { status: 415, headers: { "Cache-Control": "no-store" } },
    );
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 32 * 1024) {
    return NextResponse.json(
      { error: "Catalog resolver payload is too large.", code: "catalog_resolve_too_large" },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    rawBody = "";
  }
  if (new TextEncoder().encode(rawBody).byteLength > 32 * 1024) {
    return NextResponse.json(
      { error: "Catalog resolver payload is too large.", code: "catalog_resolve_too_large" },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  let value: unknown;
  try {
    value = JSON.parse(rawBody) as unknown;
  } catch {
    value = null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return NextResponse.json(
      { error: "Catalog resolver payload is invalid.", code: "catalog_resolve_invalid" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = value as Record<string, unknown>;
  const locale = typeof body.locale === "string" ? body.locale : null;
  if (
    Object.keys(body).length !== 2 ||
    !isPublicCatalogLocale(locale) ||
    !Array.isArray(body.items) ||
    body.items.length > 50 ||
    !body.items.every(isExactResolveItem)
  ) {
    return NextResponse.json(
      { error: "Catalog resolver requires locale and up to 50 valid cart items.", code: "catalog_resolve_invalid" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const items = body.items as ResolveItem[];
  const snapshot = getPublicCatalogSnapshot(locale);
  const requestedKeys = new Set<string>(
    items.map((item) => `${item.productSlug.trim()}:${item.sku.trim()}`),
  );
  const products = snapshot.products.flatMap((product) => {
    const variants = product.variants.filter((variant) =>
      requestedKeys.has(`${product.slug}:${variant.sku}`),
    );
    return variants.length ? [{ ...product, variants }] : [];
  });
  const resolved = new Map<string, "InStock" | "PreOrder" | "OutOfStock">(
    products.flatMap((product) =>
      product.variants.map((variant) => [
        `${product.slug}:${variant.sku}`,
        variant.availability,
      ] as const),
    ),
  );
  const unavailableKeys = [...requestedKeys].filter(
    (key) => resolved.get(key) !== "InStock",
  );

  return NextResponse.json(
    { ...snapshot, products, unavailableKeys },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
