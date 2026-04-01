import {
  getProductBySlug,
  type ProductRecord,
  type ProductVariant,
} from "@/lib/site-content";

export const CART_STORAGE_KEY = "cozmateks-cart";
export const MAX_CART_ITEM_QUANTITY = 10;

export type StoredCartItem = {
  productSlug: string;
  sku: string;
  quantity: number;
};

export type ResolvedCartLine = {
  key: string;
  product: ProductRecord;
  variant: ProductVariant;
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

  const product = getProductBySlug(candidate.productSlug);

  if (!product) {
    return null;
  }

  const variant = product.variants.find((item) => item.sku === candidate.sku);

  if (!variant) {
    return null;
  }

  return {
    productSlug: candidate.productSlug,
    sku: candidate.sku,
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

export function resolveCartLines(items: StoredCartItem[]) {
  return items.reduce<ResolvedCartLine[]>((lines, item) => {
    const product = getProductBySlug(item.productSlug);

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
