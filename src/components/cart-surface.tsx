"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnalyticsViewEvent } from "@/components/analytics-view-event";
import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";
import { collectionDirectory, footerPolicyLinks } from "@/lib/site-content";
import styles from "./cart-surface.module.css";

const cartCopy = {
  en: {
    loading: ["Cart verification", "Restoring your cart", "We are checking saved items against the latest verified catalog before showing prices or availability."],
    error: ["Verification unavailable", "Your cart items are still saved", "We could not reach the verified product catalog. Reload the page to try again."],
    retry: "Try again",
    backToShop: "Return to shop",
    gate: ["Catalog verification", "Shopping is temporarily paused", "Your choices remain saved locally, but prices, availability, and checkout will stay unavailable until the verified product catalog is published."],
    explore: "Explore the shop",
    trust: "How we verify products",
    empty: ["Shopping cart", "Your cart is currently empty", "Explore the collection or search the shop, then return here to review verified prices and availability."],
    browse: "Browse the collection",
    search: "Search the shop",
    heroEyebrow: "Cart review · Authority resolved",
    heroTitle: "Review your selection before the final price is confirmed.",
    heroSummary: "Displayed prices come from the published catalog. Checkout verifies price, VAT, shipping, and availability one final time through a short-lived quote.",
    availableItems: "Available items",
    unavailableCount: (count: number) => `${count} ${count === 1 ? "item needs" : "items need"} to be removed or replaced.`,
    allItemsReady: "Every current item can proceed to order review.",
    trustedPrice: "Verified price",
    serverPriceTitle: "We do not trust a price saved on the device",
    serverPriceBody: "Any publishing or inventory change is resolved again by the server before the order is placed.",
    cartItems: "Cart items",
    reviewableProducts: "Products ready for review and adjustment",
    unavailableNotice: "Some items are no longer available in the published catalog. We kept their references so you can choose whether to remove them.",
    inStock: "Available",
    notAvailable: "Currently unavailable",
    productPage: "Product page",
    quantity: (name: string) => `Quantity for ${name}`,
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    remove: "Remove",
    unavailable: "Unavailable",
    unavailableItem: "This item cannot be priced or sent to checkout from the current published catalog.",
    removeItem: "Remove item",
    clearCart: "Clear cart",
    continueShopping: "Continue shopping",
    initialSummary: "Initial summary",
    availableCount: "Available items",
    currency: "Currency",
    tax: "VAT",
    taxValue: "Confirmed in the quote",
    shipping: "Shipping",
    shippingValue: "Based on selection",
    removeUnavailableFirst: "Remove unavailable items first",
    reviewOrder: "Continue to order review",
    reservationNotice: "Opening this page does not reserve inventory or create an order.",
    beforeContinuing: "Before continuing",
    policiesTitle: "Policies within the same journey",
    policyLabels: {
      "/terms": "Terms and conditions",
      "/trust/verification": "Business information",
      "/trust/privacy": "Privacy",
      "/trust/shipping": "Shipping and delivery",
      "/trust/returns": "Exchanges and returns",
      "/trust/authenticity": "Authenticity and quality",
    } as Record<string, string>,
  },
  ar: {
    loading: ["التحقق من السلة", "جارٍ استعادة سلتك", "نراجع العناصر المحفوظة مقابل أحدث كتالوج موثّق قبل عرض السعر أو التوفر."],
    error: ["تعذر التحقق", "عناصر السلة ما زالت محفوظة", "تعذر الاتصال بكتالوج المنتجات الموثّق. أعيدي تحميل الصفحة للمحاولة مرة أخرى."],
    retry: "إعادة المحاولة",
    backToShop: "العودة إلى المتجر",
    gate: ["التحقق من الكتالوج", "الشراء متوقف مؤقتًا", "نحافظ على اختياراتك محليًا، لكن الأسعار والتوفر والدفع ستظل غير متاحة حتى نشر كتالوج المنتجات الموثّق."],
    explore: "استكشاف المتجر",
    trust: "كيف نتحقق من المنتجات؟",
    empty: ["سلة التسوق", "السلة فارغة حاليًا", "ابدئي من المجموعة أو البحث، ثم عودي هنا لمراجعة السعر والتوفر الموثّقين."],
    browse: "تصفح المجموعة",
    search: "البحث داخل المتجر",
    heroEyebrow: "مراجعة السلة · بيانات موثّقة",
    heroTitle: "راجعي الاختيار قبل تثبيت السعر النهائي.",
    heroSummary: "السعر الظاهر مشتق من الكتالوج المنشور، بينما يثبت الدفع السعر والضريبة والشحن والتوفر مرة أخيرة عبر عرض سعر قصير الصلاحية.",
    availableItems: "إجمالي العناصر المتاحة",
    unavailableCount: (count: number) => `${count} عنصر يحتاج إزالة أو استبدال.`,
    allItemsReady: "كل العناصر الحالية قابلة للانتقال إلى مراجعة الطلب.",
    trustedPrice: "سعر موثوق",
    serverPriceTitle: "لا نثق بالسعر المحفوظ في الجهاز",
    serverPriceBody: "أي تغيير في النشر أو المخزون يعاد حله من الخادم قبل إتمام الطلب.",
    cartItems: "عناصر السلة",
    reviewableProducts: "منتجات قابلة للمراجعة والتعديل",
    unavailableNotice: "بعض العناصر لم تعد متاحة في الكتالوج المنشور. احتفظنا بمراجعها حتى تختاري إزالتها بنفسك.",
    inStock: "متاح",
    notAvailable: "غير متاح حاليًا",
    productPage: "صفحة المنتج",
    quantity: (name: string) => `كمية ${name}`,
    decrease: "تقليل الكمية",
    increase: "زيادة الكمية",
    remove: "إزالة",
    unavailable: "غير متاح",
    unavailableItem: "لا يمكن تسعير هذا العنصر أو إرساله إلى الدفع من النسخة المنشورة الحالية.",
    removeItem: "إزالة العنصر",
    clearCart: "إفراغ السلة",
    continueShopping: "متابعة التسوق",
    initialSummary: "ملخص أولي",
    availableCount: "العناصر المتاحة",
    currency: "العملة",
    tax: "الضريبة",
    taxValue: "تُثبت في عرض السعر",
    shipping: "الشحن",
    shippingValue: "حسب الاختيار",
    removeUnavailableFirst: "أزيلي العناصر غير المتاحة أولًا",
    reviewOrder: "الانتقال إلى مراجعة الطلب",
    reservationNotice: "لا يتم إنشاء حجز مخزون أو طلب بمجرد فتح هذه الصفحة.",
    beforeContinuing: "قبل المتابعة",
    policiesTitle: "السياسات في نفس الرحلة",
    policyLabels: Object.fromEntries(footerPolicyLinks.map((link) => [link.href, link.label])) as Record<string, string>,
  },
} as const;

function formatMoney(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "en" ? "en-SA" : "ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(value);
}

function StateCard({
  state,
  eyebrow,
  title,
  body,
  children,
}: {
  state: "loading" | "error" | "gated" | "empty";
  eyebrow: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.page} data-cart-surface data-cart-state={state}>
      <section className={styles.emptyCard}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p>{body}</p>
        {children}
      </section>
    </div>
  );
}

export function CartSurface() {
  const pathname = usePathname() ?? "/cart";
  const {
    cartCount,
    catalogError,
    catalogStatus,
    clearCart,
    isHydrated,
    lines,
    removeItem,
    subtotal,
    unavailableItems,
    updateItemQuantity,
  } = useCart();
  const locale: Locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ar";
  const copy = cartCopy[locale];

  function updateQuantity(productSlug: string, sku: string, quantity: number) {
    updateItemQuantity({ productSlug, sku, quantity });
    trackAnalyticsEvent("cart_update", {
      source_path: pathname,
      source_page_type: getPageType(pathname),
      product_slug: productSlug,
      sku,
      quantity: Math.max(quantity, 0),
    });
  }

  function remove(productSlug: string, sku: string) {
    removeItem(productSlug, sku);
    trackAnalyticsEvent("cart_update", {
      source_path: pathname,
      source_page_type: getPageType(pathname),
      product_slug: productSlug,
      sku,
      quantity: 0,
    });
  }

  if (!isHydrated) {
    return (
      <StateCard
        state="loading"
        eyebrow={copy.loading[0]}
        title={copy.loading[1]}
        body={copy.loading[2]}
      />
    );
  }

  if (catalogStatus === "error") {
    return (
      <StateCard
        state="error"
        eyebrow={copy.error[0]}
        title={copy.error[1]}
        body={catalogError ?? copy.error[2]}
      >
        <div className={styles.actionColumn}>
          <button className={styles.primaryButton} type="button" onClick={() => window.location.reload()}>
            {copy.retry}
          </button>
          <TrackedLink href={localizePath(locale, "/shop")} className={styles.secondaryLink} analyticsLabel="cart_error_to_shop" analyticsSurface="cart_error">
            {copy.backToShop}
          </TrackedLink>
        </div>
      </StateCard>
    );
  }

  if (catalogStatus === "unavailable") {
    return (
      <StateCard
        state="gated"
        eyebrow={copy.gate[0]}
        title={copy.gate[1]}
        body={copy.gate[2]}
      >
        <div className={styles.actionColumn}>
          <TrackedLink href={localizePath(locale, "/shop")} className={styles.primaryLink} analyticsLabel="cart_gate_to_shop" analyticsSurface="cart_gate">
            {copy.explore}
          </TrackedLink>
          <TrackedLink href={localizePath(locale, "/trust")} className={styles.secondaryLink} analyticsLabel="cart_gate_to_trust" analyticsSurface="cart_gate">
            {copy.trust}
          </TrackedLink>
        </div>
      </StateCard>
    );
  }

  if (!lines.length && !unavailableItems.length) {
    return (
      <StateCard
        state="empty"
        eyebrow={copy.empty[0]}
        title={copy.empty[1]}
        body={copy.empty[2]}
      >
        <div className={styles.actionColumn}>
          <TrackedLink href={localizePath(locale, "/shop")} className={styles.primaryLink} analyticsLabel="cart_empty_to_shop" analyticsSurface="cart_empty">
            {copy.browse}
          </TrackedLink>
          <TrackedLink href={localizePath(locale, "/search")} className={styles.secondaryLink} analyticsLabel="cart_empty_to_search" analyticsSurface="cart_empty">
            {copy.search}
          </TrackedLink>
        </div>
      </StateCard>
    );
  }

  const hasUnavailable = unavailableItems.length > 0;

  return (
    <div className={styles.page} data-cart-surface data-cart-state="ready">
      <AnalyticsViewEvent
        eventName="view_cart"
        eventKey={`cart:${locale}`}
        properties={{
          currency: "SAR",
          item_count: cartCount,
          line_count: lines.length,
          unavailable_count: unavailableItems.length,
          value: subtotal,
        }}
      />
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{copy.heroEyebrow}</p>
          <h1>{copy.heroTitle}</h1>
          <p className={styles.summary}>{copy.heroSummary}</p>
        </div>
        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>{copy.availableItems}</p>
            <strong>{cartCount}</strong>
            <span>{hasUnavailable ? copy.unavailableCount(unavailableItems.length) : copy.allItemsReady}</span>
          </div>
          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>{copy.trustedPrice}</p>
            <h2>{copy.serverPriceTitle}</h2>
            <p>{copy.serverPriceBody}</p>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>{copy.cartItems}</p>
          <h2>{copy.reviewableProducts}</h2>

          {hasUnavailable ? (
            <div className={styles.inlineError} role="status">
              {copy.unavailableNotice}
            </div>
          ) : null}

          <div className={styles.lineList}>
            {lines.map((line) => {
              const media = line.product.media[0];
              return (
                <article key={line.key} className={styles.lineItem}>
                  <div className={styles.lineMedia}>
                    {media ? <Image src={media.url} alt={media.alt || line.product.name} fill sizes="(max-width: 680px) 100vw, 180px" /> : <span aria-hidden="true" />}
                  </div>
                  <div className={styles.lineContent}>
                    <div className={styles.lineHead}>
                      <div>
                        <p className={styles.eyebrow}>{locale === "en" ? collectionDirectory[line.product.collection].subtitle : collectionDirectory[line.product.collection].title}</p>
                        <h3>{line.product.name}</h3>
                        <p className={styles.lineMeta}>{line.product.subtitle}</p>
                      </div>
                      <div className={styles.linePrice}>{formatMoney(line.variant.price, locale)}</div>
                    </div>
                    <div className={styles.badgeRow}>
                      <span>{line.variant.label}</span>
                      <span>{line.variant.size}</span>
                      <span>{line.variant.availability === "InStock" ? copy.inStock : copy.notAvailable}</span>
                    </div>
                    <div className={styles.lineLinks}>
                      <TrackedLink href={`/${locale}/product/${line.product.slug}`} className={styles.inlineLink} analyticsLabel={`cart_product_${line.product.slug}`} analyticsSurface="cart_line">
                        {copy.productPage}
                      </TrackedLink>
                      <span className={styles.lineMeta}>{line.product.shippingNote}</span>
                    </div>
                    <div className={styles.lineFooter}>
                      <div className={styles.quantityControl} aria-label={copy.quantity(line.product.name)}>
                        <button type="button" aria-label={copy.decrease} onClick={() => updateQuantity(line.product.slug, line.variant.sku, line.quantity - 1)}>−</button>
                        <strong>{line.quantity}</strong>
                        <button type="button" aria-label={copy.increase} onClick={() => updateQuantity(line.product.slug, line.variant.sku, line.quantity + 1)}>+</button>
                      </div>
                      <div className={styles.lineFooterGroup}>
                        <div className={styles.lineTotal}>{formatMoney(line.lineTotal, locale)}</div>
                        <button type="button" className={styles.ghostButton} onClick={() => remove(line.product.slug, line.variant.sku)}>{copy.remove}</button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {unavailableItems.map((item) => (
              <article key={`${item.productSlug}:${item.sku}`} className={`${styles.lineItem} ${styles.unavailableLine}`}>
                <div className={styles.lineHead}>
                  <div><p className={styles.eyebrow}>{copy.unavailable}</p><h3>{item.productSlug}</h3><p className={styles.lineMeta}>SKU: {item.sku}</p></div>
                </div>
                <div className={styles.inlineError}>{copy.unavailableItem}</div>
                <button type="button" className={styles.ghostButton} onClick={() => remove(item.productSlug, item.sku)}>{copy.removeItem}</button>
              </article>
            ))}
          </div>

          <div className={styles.cardActions}>
            <button type="button" className={styles.ghostButton} onClick={clearCart}>{copy.clearCart}</button>
            <TrackedLink href={localizePath(locale, "/shop")} className={styles.secondaryLink} analyticsLabel="cart_continue_shop" analyticsSurface="cart_actions">{copy.continueShopping}</TrackedLink>
          </div>
        </article>

        <aside className={styles.summaryList}>
          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>{copy.initialSummary}</p>
            <h2>{formatMoney(subtotal, locale)}</h2>
            <div className={styles.summaryList}>
              <div className={styles.summaryRow}><span>{copy.availableCount}</span><strong className={styles.summaryValue}>{cartCount}</strong></div>
              <div className={styles.summaryRow}><span>{copy.currency}</span><strong className={styles.summaryValue}>SAR</strong></div>
              <div className={styles.summaryRow}><span>{copy.tax}</span><strong className={styles.summaryValue}>{copy.taxValue}</strong></div>
              <div className={styles.summaryRow}><span>{copy.shipping}</span><strong className={styles.summaryValue}>{copy.shippingValue}</strong></div>
            </div>
            {hasUnavailable ? (
              <button type="button" className={styles.primaryButton} disabled>{copy.removeUnavailableFirst}</button>
            ) : (
              <TrackedLink href={localizePath(locale, "/checkout")} className={styles.primaryLink} analyticsLabel="cart_to_checkout" analyticsSurface="cart_summary" analyticsDestinationType="checkout">
                {copy.reviewOrder}
              </TrackedLink>
            )}
            <p className={styles.helperText}>{copy.reservationNotice}</p>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>{copy.beforeContinuing}</p>
            <h2>{copy.policiesTitle}</h2>
            <div className={styles.linkList}>
              {footerPolicyLinks.map((link) => (
                <TrackedLink key={link.href} href={localizePath(locale, link.href)} analyticsLabel={`cart_policy_${link.href.split("/").at(-1)}`} analyticsSurface="cart_policy">
                  <span>{copy.policyLabels[link.href] ?? link.label}</span><span className={styles.policyArrow} aria-hidden="true">{locale === "en" ? "→" : "←"}</span>
                </TrackedLink>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
