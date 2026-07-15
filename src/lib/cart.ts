import type {
  PublicCatalogProduct,
  PublicCatalogVariant,
} from "@/lib/public-catalog-types";

export const CART_STORAGE_KEY = "cozmateks-cart";
export const MAX_CART_ITEM_QUANTITY = 10;

export type StoredCartItem = {
  productSlug: string;
  sku: string;
  quantity: number;
};

export type ResolvedCartLine = {
  key: string;
  product: PublicCatalogProduct;
  variant: PublicCatalogVariant;
  quantity: number;
  lineTotal: number;
};

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Math.floor(value)));
}

function normalizeCartItem(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<StoredCartItem>;

  if (
    typeof candidate.productSlug !== "string" ||
    typeof candidate.sku !== "string" ||
    typeof candidate.quantity !== "number"
  ) {
    return null;
  }

  const productSlug = candidate.productSlug.trim();
  const sku = candidate.sku.trim();
  if (!productSlug || productSlug.length > 180 || !sku || sku.length > 180) {
    return null;
  }

  return {
    productSlug,
    sku,
    quantity: clampQuantity(candidate.quantity),
  } satisfies StoredCartItem;
}

export function sanitizeCartItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as StoredCartItem[];
  }

  const merged = new Map<string, StoredCartItem>();

  for (const item of value) {
    const normalized = normalizeCartItem(item);

    if (!normalized) {
      continue;
    }

    const key = `${normalized.productSlug}:${normalized.sku}`;
    const existing = merged.get(key);

    if (existing) {
      existing.quantity = clampQuantity(existing.quantity + normalized.quantity);
      continue;
    }

    merged.set(key, normalized);
  }

  return Array.from(merged.values());
}

export function resolveCartLines(
  items: StoredCartItem[],
  products: PublicCatalogProduct[] = [],
) {
  const productMap = new Map(products.map((product) => [product.slug, product]));
  return items.reduce<ResolvedCartLine[]>((lines, item) => {
    const product = productMap.get(item.productSlug);

    if (!product) {
      return lines;
    }

    const variant = product.variants.find((candidate) => candidate.sku === item.sku);

    if (!variant) {
      return lines;
    }

    const quantity = clampQuantity(item.quantity);

    lines.push({
      key: `${product.slug}:${variant.sku}`,
      product,
      variant,
      quantity,
      lineTotal: variant.price * quantity,
    });

    return lines;
  }, []);
}

export function getCartCount(lines: ResolvedCartLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function getCartSubtotal(lines: ResolvedCartLine[]) {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0);
}
