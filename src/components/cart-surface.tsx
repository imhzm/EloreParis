"use client";

import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";
import { collectionDirectory, footerPolicyLinks } from "@/lib/site-content";
import styles from "./cart-surface.module.css";

function StateCard({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.page}>
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
  const copy = locale === "en" ? {
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
  } : {
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
  };

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
        eyebrow={copy.loading[0]}
        title={copy.loading[1]}
        body={copy.loading[2]}
      />
    );
  }

  if (catalogStatus === "error") {
    return (
      <StateCard
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
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Cart review · Authority resolved</p>
          <h1>راجعي الاختيار قبل تثبيت السعر النهائي.</h1>
          <p className={styles.summary}>
            السعر الظاهر مشتق من الكتالوج المنشور، بينما يثبت الـcheckout السعر والضريبة والشحن والتوفر مرة أخيرة عبر quote قصيرة الصلاحية.
          </p>
        </div>
        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>إجمالي العناصر المتاحة</p>
            <strong>{cartCount}</strong>
            <span>{hasUnavailable ? `${unavailableItems.length} عنصر يحتاج إزالة أو استبدال.` : "كل العناصر الحالية قابلة للانتقال إلى مراجعة الطلب."}</span>
          </div>
          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>سعر موثوق</p>
            <h2>لا نثق بالسعر المحفوظ في الجهاز</h2>
            <p>أي تغيير في النشر أو المخزون يعاد حله من الخادم قبل إتمام الطلب.</p>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>عناصر السلة</p>
          <h2>منتجات قابلة للمراجعة والتعديل</h2>

          {hasUnavailable ? (
            <div className={styles.inlineError} role="status">
              بعض العناصر لم تعد متاحة في الكتالوج المنشور. احتفظنا بمراجعها حتى تختاري إزالتها بنفسك.
            </div>
          ) : null}

          <div className={styles.lineList}>
            {lines.map((line) => (
              <article key={line.key} className={styles.lineItem}>
                <div className={styles.lineHead}>
                  <div>
                    <p className={styles.eyebrow}>{collectionDirectory[line.product.collection].title}</p>
                    <h3>{line.product.name}</h3>
                    <p className={styles.lineMeta}>{line.product.subtitle}</p>
                  </div>
                  <div className={styles.linePrice}>{line.variant.price} ر.س</div>
                </div>
                <div className={styles.badgeRow}>
                  <span>{line.variant.label}</span>
                  <span>{line.variant.size}</span>
                  <span>{line.variant.availability === "InStock" ? "متاح" : "غير متاح حاليًا"}</span>
                </div>
                <div className={styles.lineLinks}>
                  <TrackedLink href={`/${locale}/product/${line.product.slug}`} className={styles.inlineLink} analyticsLabel={`cart_product_${line.product.slug}`} analyticsSurface="cart_line">
                    صفحة المنتج
                  </TrackedLink>
                  <span className={styles.lineMeta}>{line.product.shippingNote}</span>
                </div>
                <div className={styles.lineFooter}>
                  <div className={styles.quantityControl} aria-label={`كمية ${line.product.name}`}>
                    <button type="button" aria-label="تقليل الكمية" onClick={() => updateQuantity(line.product.slug, line.variant.sku, line.quantity - 1)}>−</button>
                    <strong>{line.quantity}</strong>
                    <button type="button" aria-label="زيادة الكمية" onClick={() => updateQuantity(line.product.slug, line.variant.sku, line.quantity + 1)}>+</button>
                  </div>
                  <div className={styles.lineFooterGroup}>
                    <div className={styles.lineTotal}>{line.lineTotal} ر.س</div>
                    <button type="button" className={styles.ghostButton} onClick={() => remove(line.product.slug, line.variant.sku)}>إزالة</button>
                  </div>
                </div>
              </article>
            ))}

            {unavailableItems.map((item) => (
              <article key={`${item.productSlug}:${item.sku}`} className={styles.lineItem}>
                <div className={styles.lineHead}>
                  <div><p className={styles.eyebrow}>غير متاح</p><h3>{item.productSlug}</h3><p className={styles.lineMeta}>SKU: {item.sku}</p></div>
                </div>
                <div className={styles.inlineError}>لا يمكن تسعير هذا العنصر أو إرساله إلى checkout من النسخة المنشورة الحالية.</div>
                <button type="button" className={styles.ghostButton} onClick={() => remove(item.productSlug, item.sku)}>إزالة العنصر</button>
              </article>
            ))}
          </div>

          <div className={styles.cardActions}>
            <button type="button" className={styles.ghostButton} onClick={clearCart}>إفراغ السلة</button>
            <TrackedLink href={localizePath(locale, "/shop")} className={styles.secondaryLink} analyticsLabel="cart_continue_shop" analyticsSurface="cart_actions">متابعة التسوق</TrackedLink>
          </div>
        </article>

        <aside className={styles.summaryList}>
          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>ملخص أولي</p>
            <h2>{subtotal} ر.س</h2>
            <div className={styles.summaryList}>
              <div className={styles.summaryRow}><span>العناصر المتاحة</span><strong className={styles.summaryValue}>{cartCount}</strong></div>
              <div className={styles.summaryRow}><span>العملة</span><strong className={styles.summaryValue}>SAR</strong></div>
              <div className={styles.summaryRow}><span>الضريبة</span><strong className={styles.summaryValue}>تُثبت في quote</strong></div>
              <div className={styles.summaryRow}><span>الشحن</span><strong className={styles.summaryValue}>حسب الاختيار</strong></div>
            </div>
            {hasUnavailable ? (
              <button type="button" className={styles.primaryButton} disabled>أزيلي العناصر غير المتاحة أولًا</button>
            ) : (
              <TrackedLink href={localizePath(locale, "/checkout")} className={styles.primaryLink} analyticsEvent="checkout_start" analyticsLabel="cart_to_checkout" analyticsSurface="cart_summary" analyticsDestinationType="checkout">
                الانتقال إلى مراجعة الطلب
              </TrackedLink>
            )}
            <p className={styles.helperText}>لا يتم إنشاء حجز مخزون أو طلب بمجرد فتح هذه الصفحة.</p>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>قبل المتابعة</p>
            <h2>السياسات في نفس الرحلة</h2>
            <div className={styles.linkList}>
              {footerPolicyLinks.map((link) => (
                <TrackedLink key={link.href} href={localizePath(locale, link.href)} analyticsLabel={`cart_policy_${link.href.split("/").at(-1)}`} analyticsSurface="cart_policy">
                  <span>{link.label}</span><span className={styles.policyArrow} aria-hidden="true">←</span>
                </TrackedLink>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
