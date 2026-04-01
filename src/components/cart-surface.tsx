"use client";

import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { footerPolicyLinks } from "@/lib/site-content";
import styles from "./cart-surface.module.css";

export function CartSurface() {
  const pathname = usePathname() ?? "/cart";
  const { cartCount, clearCart, isHydrated, lines, removeItem, subtotal, updateItemQuantity } =
    useCart();

  if (!isHydrated) {
    return (
      <div className={styles.page}>
        <section className={styles.emptyCard}>
          <p className={styles.eyebrow}>Cart review</p>
          <h1>جاري استعادة السلة</h1>
          <p>
            يتم الآن تحميل العناصر المحفوظة على هذا الجهاز حتى تظهر المراجعة
            النهائية بشكل صحيح.
          </p>
        </section>
      </div>
    );
  }

  const handleQuantityChange = (productSlug: string, sku: string, nextQuantity: number) => {
    updateItemQuantity({
      productSlug,
      sku,
      quantity: nextQuantity,
    });

    trackAnalyticsEvent("cart_update", {
      source_path: pathname,
      source_page_type: getPageType(pathname),
      product_slug: productSlug,
      sku,
      quantity: Math.max(nextQuantity, 0),
      cart_count: lines.reduce(
        (sum, line) =>
          line.product.slug === productSlug && line.variant.sku === sku
            ? sum + Math.max(nextQuantity, 0)
            : sum + line.quantity,
        0,
      ),
    });
  };

  const handleRemove = (productSlug: string, sku: string) => {
    const currentQuantity =
      lines.find((line) => line.product.slug === productSlug && line.variant.sku === sku)
        ?.quantity ?? 1;

    removeItem(productSlug, sku);

    trackAnalyticsEvent("cart_update", {
      source_path: pathname,
      source_page_type: getPageType(pathname),
      product_slug: productSlug,
      sku,
      quantity: 0,
      cart_count: Math.max(cartCount - currentQuantity, 0),
    });
  };

  const handleClearCart = () => {
    clearCart();

    trackAnalyticsEvent("cart_update", {
      source_path: pathname,
      source_page_type: getPageType(pathname),
      product_slug: "all",
      sku: "all",
      quantity: 0,
      cart_count: 0,
    });
  };

  if (lines.length === 0) {
    return (
      <div className={styles.page}>
        <section className={styles.emptyCard}>
          <p className={styles.eyebrow}>السلة</p>
          <h1>السلة فارغة حاليًا</h1>
          <p>
            تم تجهيز هذه الصفحة لتتحول من صفحة منتج مقنعة إلى مراجعة طلب حقيقية،
            لكن لا توجد عناصر مضافة الآن. يمكنك العودة إلى الاكتشاف التجاري أو
            استخدام البحث بدل الخروج من المسار.
          </p>
          <div className={styles.actionColumn}>
            <TrackedLink
              href="/shop/skincare"
              className={styles.primaryLink}
              analyticsLabel="cart_empty_to_skincare"
              analyticsSurface="cart_empty"
              analyticsDestinationType="collection"
            >
              ابدأي من العناية بالبشرة
            </TrackedLink>
            <TrackedLink
              href="/search"
              className={styles.secondaryLink}
              analyticsLabel="cart_empty_to_search"
              analyticsSurface="cart_empty"
              analyticsDestinationType="search"
            >
              البحث داخل المتجر
            </TrackedLink>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Cart review</p>
          <h1>راجعي السلة قبل خطوة الدفع</h1>
          <p className={styles.summary}>
            هذه السلة أصبحت سطحًا حقيقيًا للمراجعة: تعديل الكمية، إزالة العناصر،
            والانتقال إلى مراجعة الطلب بدل إنهاء الرحلة عند صفحة المنتج.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>إجمالي العناصر</p>
            <strong>{cartCount}</strong>
            <span>إجمالي أولي قبل ربط الشحن والضرائب ومحرك الدفع الفعلي.</span>
          </div>
          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Trust layer</p>
            <h2>سياسات الشحن والاسترجاع ما زالت واضحة داخل الرحلة</h2>
            <p>
              السلة لا تفصل الزائرة عن طبقة الثقة. الروابط الأساسية تبقى متاحة قبل
              بدء الـ checkout.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>Line items</p>
          <h2>عناصر السلة القابلة للتعديل</h2>

          <div className={styles.lineList}>
            {lines.map((line) => (
              <article key={line.key} className={styles.lineItem}>
                <div className={styles.lineHead}>
                  <div>
                    <h3>{line.product.name}</h3>
                    <p className={styles.lineMeta}>{line.product.subtitle}</p>
                  </div>
                  <div className={styles.linePrice}>{line.variant.price} ر.س</div>
                </div>

                <div className={styles.badgeRow}>
                  <span>{line.variant.label}</span>
                  <span>{line.variant.size}</span>
                  <span>{line.product.finish}</span>
                </div>

                <div className={styles.lineFooter}>
                  <div className={styles.quantityControl}>
                    <button
                      type="button"
                      aria-label="تقليل الكمية"
                      onClick={() =>
                        handleQuantityChange(
                          line.product.slug,
                          line.variant.sku,
                          line.quantity - 1,
                        )
                      }
                    >
                      -
                    </button>
                    <strong>{line.quantity}</strong>
                    <button
                      type="button"
                      aria-label="زيادة الكمية"
                      onClick={() =>
                        handleQuantityChange(
                          line.product.slug,
                          line.variant.sku,
                          line.quantity + 1,
                        )
                      }
                    >
                      +
                    </button>
                  </div>

                  <div className={styles.lineFooter}>
                    <div className={styles.lineTotal}>{line.lineTotal} ر.س</div>
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={() => handleRemove(line.product.slug, line.variant.sku)}
                    >
                      إزالة
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className={styles.summaryCard}>
          <p className={styles.sectionTitle}>Order summary</p>
          <h2>ملخص القرار قبل الدفع</h2>

          <div className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <span>إجمالي السلة</span>
              <strong className={styles.summaryValue}>{subtotal} ر.س</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>الشحن</span>
              <strong className={styles.summaryValue}>يُحدَّد بعد الربط التشغيلي</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>الدفع</span>
              <strong className={styles.summaryValue}>خطوة مراجعة تسبق الربط الفعلي</strong>
            </div>
          </div>

          <div className={styles.actionColumn}>
            <TrackedLink
              href="/checkout"
              className={styles.primaryLink}
              analyticsEvent="checkout_start"
              analyticsLabel="cart_to_checkout"
              analyticsSurface="cart_summary"
              analyticsDestinationType="checkout"
              analyticsProperties={{
                cart_count: cartCount,
                subtotal,
              }}
            >
              الانتقال إلى مراجعة الطلب
            </TrackedLink>
            <button type="button" className={styles.ghostButton} onClick={handleClearCart}>
              تفريغ السلة
            </button>
          </div>

          <div className={styles.linkList}>
            {footerPolicyLinks.map((policy) => (
              <TrackedLink
                key={policy.href}
                href={policy.href}
                analyticsLabel={`cart_policy_${policy.href.split("/").at(-1) ?? "route"}`}
                analyticsSurface="cart_policies"
                analyticsDestinationType="trust_policy"
              >
                <span>{policy.label}</span>
                <span>قبل الدفع</span>
              </TrackedLink>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
