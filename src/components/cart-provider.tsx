"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  CART_STORAGE_KEY,
  getCartCount,
  getCartSubtotal,
  MAX_CART_ITEM_QUANTITY,
  resolveCartLines,
  sanitizeCartItems,
  type ResolvedCartLine,
  type StoredCartItem,
} from "@/lib/cart";
import type {
  PublicCartResolution,
  PublicCatalogProduct,
} from "@/lib/public-catalog-types";
import { usePathname } from "next/navigation";

type CartItemInput = {
  productSlug: string;
  sku: string;
  quantity: number;
};

type CartContextValue = {
  isHydrated: boolean;
  catalogStatus: "loading" | "ready" | "unavailable" | "error";
  catalogError: string | null;
  unavailableItems: StoredCartItem[];
  items: StoredCartItem[];
  lines: ResolvedCartLine[];
  cartCount: number;
  subtotal: number;
  addItem: (input: CartItemInput) => void;
  updateItemQuantity: (input: CartItemInput) => void;
  removeItem: (productSlug: string, sku: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Math.floor(value)));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/ar";
  const [items, setItems] = useState<StoredCartItem[]>([]);
  const [isStorageHydrated, setIsStorageHydrated] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<PublicCatalogProduct[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<CartContextValue["catalogStatus"]>("loading");
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [unavailableKeys, setUnavailableKeys] = useState<string[]>([]);
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ar";

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);
      const parsedValue = rawValue ? JSON.parse(rawValue) : [];
      setItems(sanitizeCartItems(parsedValue));
    } catch {
      setItems([]);
    } finally {
      setIsStorageHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isStorageHydrated) return;
    const controller = new AbortController();
    setCatalogStatus("loading");
    setCatalogError(null);

    void fetch("/api/catalog", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, items }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as
          | PublicCartResolution
          | null;
        if (!response.ok || !body || !Array.isArray(body.products)) {
          throw new Error("تعذر تحميل كتالوج المنتجات المعتمد.");
        }

        setCatalogProducts(body.products);
        setUnavailableKeys(body.unavailableKeys ?? []);
        setCatalogStatus(body.available ? "ready" : "unavailable");
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setCatalogStatus("error");
        setCatalogError(
          loadError instanceof Error
            ? loadError.message
            : "تعذر تحميل كتالوج المنتجات المعتمد.",
        );
      });

    return () => controller.abort();
  }, [isStorageHydrated, items, locale]);

  const isHydrated = isStorageHydrated && catalogStatus !== "loading";

  useEffect(() => {
    if (!isStorageHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage write failures and keep the in-memory cart usable.
    }
  }, [isStorageHydrated, items]);

  const lines = resolveCartLines(items, catalogProducts);
  const unavailableKeySet = new Set(unavailableKeys);
  const unavailableItems = items.filter((item) =>
    unavailableKeySet.has(`${item.productSlug}:${item.sku}`),
  );
  const cartCount = getCartCount(lines);
  const subtotal = getCartSubtotal(lines);

  const addItem = ({ productSlug, sku, quantity }: CartItemInput) => {
    setItems((currentItems) =>
      sanitizeCartItems([
        ...currentItems,
        {
          productSlug,
          sku,
          quantity: clampQuantity(quantity),
        },
      ]),
    );
  };

  const updateItemQuantity = ({ productSlug, sku, quantity }: CartItemInput) => {
    if (quantity <= 0) {
      setItems((currentItems) =>
        currentItems.filter(
          (item) => !(item.productSlug === productSlug && item.sku === sku),
        ),
      );
      return;
    }

    setItems((currentItems) =>
      sanitizeCartItems(
        currentItems.map((item) =>
          item.productSlug === productSlug && item.sku === sku
            ? { ...item, quantity: clampQuantity(quantity) }
            : item,
        ),
      ),
    );
  };

  const removeItem = (productSlug: string, sku: string) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => !(item.productSlug === productSlug && item.sku === sku),
      ),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        isHydrated,
        catalogStatus,
        catalogError,
        unavailableItems,
        items,
        lines,
        cartCount,
        subtotal,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }

  return context;
}
