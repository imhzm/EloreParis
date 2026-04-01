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

type CartItemInput = {
  productSlug: string;
  sku: string;
  quantity: number;
};

type CartContextValue = {
  isHydrated: boolean;
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
  const [items, setItems] = useState<StoredCartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);
      const parsedValue = rawValue ? JSON.parse(rawValue) : [];
      setItems(sanitizeCartItems(parsedValue));
    } catch {
      setItems([]);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage write failures and keep the in-memory cart usable.
    }
  }, [isHydrated, items]);

  const lines = resolveCartLines(items);
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
