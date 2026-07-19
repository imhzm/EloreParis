"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { TrackedLink } from "@/components/tracked-link";
import { localizePath, type Locale } from "@/lib/i18n";
import styles from "./mega-shop-menu.module.css";

const menuCopy = {
  ar: {
    label: "المتجر",
    eyebrow: "THE ÉLORÉ EDIT",
    title: "اختيارات مرتبة حسب طقسك.",
    body: "ابدئي بالفئة التي تناسب لحظتك، ثم قارني التفاصيل الموثقة بهدوء.",
    all: "استكشفي المتجر بالكامل",
    groups: [
      ["العناية", [["العناية بالبشرة", "/shop/skincare"], ["العناية بالشعر", "/shop/haircare"], ["العناية بالجسم", "/shop/bodycare"]]],
      ["الحضور", [["العطور", "/shop/perfumes"], ["المكياج", "/shop/makeup"], ["الأدوات والإكسسوارات", "/shop/tools"]]],
      ["الإهداء", [["الهدايا والمجموعات", "/shop/beauty-sets"], ["الروتينات", "/routines"], ["دليل المكونات", "/ingredients"]]],
    ],
  },
  en: {
    label: "Shop",
    eyebrow: "THE ÉLORÉ EDIT",
    title: "A considered edit for every ritual.",
    body: "Begin with the category that suits the moment, then compare verified details at your own pace.",
    all: "Explore the complete shop",
    groups: [
      ["Care", [["Skincare", "/shop/skincare"], ["Haircare", "/shop/haircare"], ["Body care", "/shop/bodycare"]]],
      ["Presence", [["Perfumes", "/shop/perfumes"], ["Makeup", "/shop/makeup"], ["Tools & accessories", "/shop/tools"]]],
      ["Gifting", [["Gifts & sets", "/shop/beauty-sets"], ["Rituals", "/routines"], ["Ingredient guide", "/ingredients"]]],
    ],
  },
} as const;

export function MegaShopMenu({ locale, isActive }: { locale: Locale; isActive: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const copy = menuCopy[locale];
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close, isOpen]);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${isActive ? styles.active : ""}`}
        aria-expanded={isOpen}
        aria-controls="shop-mega-menu"
        onClick={() => setIsOpen(true)}
      >
        {copy.label}
        <svg viewBox="0 0 12 8" aria-hidden="true"><path d="m1 1 5 5 5-5" /></svg>
      </button>

      <div id="shop-mega-menu" className={`${styles.panel} ${isOpen ? styles.open : ""}`} aria-hidden={!isOpen}>
        <div className={styles.editorial}>
          <Image src="/elore-assets/editorial-skin-light-concept-1122w.avif" alt="" fill sizes="340px" />
          <div className={styles.editorialCopy}>
            <p lang="en">{copy.eyebrow}</p>
            <strong>{copy.title}</strong>
            <span>{copy.body}</span>
          </div>
        </div>

        <div className={styles.directory}>
          {copy.groups.map(([title, links]) => (
            <section key={title}>
              <h2>{title}</h2>
              {links.map(([label, href]) => (
                <TrackedLink key={href} href={localizePath(locale, href)} analyticsLabel={`mega_${href.replaceAll("/", "_")}`} analyticsSurface="header_mega_menu" onClick={close}>
                  <span>{label}</span><span aria-hidden="true">↗</span>
                </TrackedLink>
              ))}
            </section>
          ))}
          <TrackedLink className={styles.allLink} href={localizePath(locale, "/shop")} analyticsLabel="mega_all_products" analyticsSurface="header_mega_menu" onClick={close}>{copy.all}</TrackedLink>
        </div>
      </div>
    </div>
  );
}
