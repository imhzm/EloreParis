"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const WISHLIST_STORAGE_KEY = "elore:wishlist:v1";
export const WISHLIST_STORAGE_VERSION = 1;

const MAX_WISHLIST_ITEMS = 100;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type StoredWishlist = {
  version: typeof WISHLIST_STORAGE_VERSION;
  slugs: string[];
};

type WishlistContextValue = {
  isHydrated: boolean;
  slugs: string[];
  count: number;
  has: (productSlug: string) => boolean;
  add: (productSlug: string) => void;
  remove: (productSlug: string) => void;
  removeMany: (productSlugs: readonly string[]) => void;
  toggle: (productSlug: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function sanitizeSlugs(value: unknown) {
  if (!Array.isArray(value)) return [];

  const unique = new Set<string>();
  for (const candidate of value) {
    if (typeof candidate !== "string") continue;
    const slug = candidate.trim().toLocaleLowerCase();
    if (!slugPattern.test(slug)) continue;
    unique.add(slug);
    if (unique.size >= MAX_WISHLIST_ITEMS) break;
  }
  return [...unique];
}

export function parseStoredWishlist(rawValue: string | null) {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredWishlist> | null;
    if (
      !parsed ||
      parsed.version !== WISHLIST_STORAGE_VERSION ||
      !Array.isArray(parsed.slugs)
    ) {
      return [];
    }
    return sanitizeSlugs(parsed.slugs);
  } catch {
    return [];
  }
}

function serializeWishlist(slugs: readonly string[]) {
  return JSON.stringify({
    version: WISHLIST_STORAGE_VERSION,
    slugs: sanitizeSlugs(slugs),
  } satisfies StoredWishlist);
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;
    queueMicrotask(() => {
      if (!isActive) return;
      setSlugs(parseStoredWishlist(window.localStorage.getItem(WISHLIST_STORAGE_KEY)));
      setIsHydrated(true);
    });

    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key !== WISHLIST_STORAGE_KEY) return;
      setSlugs(parseStoredWishlist(event.newValue));
    };
    window.addEventListener("storage", syncAcrossTabs);
    return () => {
      isActive = false;
      window.removeEventListener("storage", syncAcrossTabs);
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, serializeWishlist(slugs));
    } catch {
      // Keep the in-memory list usable when storage is blocked or full.
    }
  }, [isHydrated, slugs]);

  const add = useCallback((productSlug: string) => {
    const [slug] = sanitizeSlugs([productSlug]);
    if (!slug) return;
    setSlugs((current) => current.includes(slug)
      ? current
      : sanitizeSlugs([...current, slug]));
  }, []);

  const remove = useCallback((productSlug: string) => {
    setSlugs((current) => current.filter((slug) => slug !== productSlug));
  }, []);

  const removeMany = useCallback((productSlugs: readonly string[]) => {
    const removable = new Set(sanitizeSlugs(productSlugs));
    if (removable.size === 0) return;
    setSlugs((current) => current.filter((slug) => !removable.has(slug)));
  }, []);

  const toggle = useCallback((productSlug: string) => {
    const [slug] = sanitizeSlugs([productSlug]);
    if (!slug) return;
    setSlugs((current) => {
      if (current.includes(slug)) {
        return current.filter((candidate) => candidate !== slug);
      }
      return sanitizeSlugs([...current, slug]);
    });
  }, []);

  const slugSet = useMemo(() => new Set(slugs), [slugs]);
  const has = useCallback((productSlug: string) => slugSet.has(productSlug), [slugSet]);
  const value = useMemo<WishlistContextValue>(() => ({
    isHydrated,
    slugs,
    count: slugs.length,
    has,
    add,
    remove,
    removeMany,
    toggle,
  }), [add, has, isHydrated, remove, removeMany, slugs, toggle]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider.");
  return context;
}
