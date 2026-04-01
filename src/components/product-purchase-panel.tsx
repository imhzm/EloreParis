"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { type ProductVariant } from "@/lib/site-content";
import styles from "./product-purchase-panel.module.css";

type ProductPurchasePanelProps = {
  productSlug: string;
  productName: string;
  variants: ProductVariant[];
  shippingNote: string;
};

export function ProductPurchasePanel({
  productSlug,
  productName,
  variants,
  shippingNote,
}: ProductPurchasePanelProps) {
  const pathname = usePathname() ?? `/products/${productSlug}`;
  const { addItem, cartCount } = useCart();
  const [selectedSku, setSelectedSku] = useState(variants[0]?.sku ?? "");
  const [quantity, setQuantity] = useState(1);
  const [statusMessage, setStatusMessage] = useState("");

  const selectedVariant =
    variants.find((variant) => variant.sku === selectedSku) ?? variants[0];

  const handleQuantityChange = (nextQuantity: number) => {
    setQuantity(Math.min(10, Math.max(1, nextQuantity)));
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      return;
    }

    addItem({
      productSlug,
      sku: selectedVariant.sku,
      quantity,
    });

    setStatusMessage(`تمت إضافة ${productName} إلى السلة.`);

    trackAnalyticsEvent("add_to_cart", {
      source_path: pathname,
      source_page_type: getPageType(pathname),
      product_slug: productSlug,
      sku: selectedVariant.sku,
      quantity,
      unit_price: selectedVariant.price,
      cart_count: cartCount + quantity,
    });
  };

  if (!selectedVariant) {
    return null;
  }

  return (
    <section className={styles.panel} aria-labelledby={`buy-${productSlug}`}>
      <div>
        <p className={styles.supportText}>قرار الشراء</p>
        <h2 id={`buy-${productSlug}`}>اختيار الدرجة أو الحجم ثم إضافته للسلة</h2>
      </div>

      <div className={styles.variantList}>
        {variants.map((variant) => {
          const isActive = variant.sku === selectedVariant.sku;

          return (
            <button
              key={variant.sku}
              type="button"
              className={`${styles.variantButton} ${isActive ? styles.variantActive : ""}`}
              onClick={() => setSelectedSku(variant.sku)}
              aria-pressed={isActive}
            >
              <strong>{variant.label}</strong>
              <div className={styles.variantMeta}>
                <span>{variant.size}</span>
                <span>{variant.price} ر.س</span>
                <span
                  className={
                    variant.availability === "InStock"
                      ? styles.availability
                      : styles.availabilityPending
                  }
                >
                  {variant.availability === "InStock" ? "متاح" : "طلب مسبق"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles.controls}>
        <div className={styles.quantityRow}>
          <p className={styles.quantityLabel}>
            السلة الحالية تحفظ على هذا الجهاز لتجربة مراجعة الطلب قبل ربط محرك
            التجارة.
          </p>
          <div className={styles.quantityControl}>
            <button
              type="button"
              className={styles.quantityButton}
              onClick={() => handleQuantityChange(quantity - 1)}
              aria-label="تقليل الكمية"
            >
              -
            </button>
            <span className={styles.quantityValue}>{quantity}</span>
            <button
              type="button"
              className={styles.quantityButton}
              onClick={() => handleQuantityChange(quantity + 1)}
              aria-label="زيادة الكمية"
            >
              +
            </button>
          </div>
        </div>

        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>إجمالي هذا الاختيار</span>
          <strong className={styles.priceValue}>
            {selectedVariant.price * quantity} ر.س
          </strong>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleAddToCart}
          >
            أضيفي إلى السلة
          </button>
          <TrackedLink
            href="/cart"
            className={styles.secondaryLink}
            analyticsLabel={`product_to_cart_${productSlug}`}
            analyticsSurface="product_purchase_panel"
            analyticsDestinationType="cart"
          >
            استعراض السلة
          </TrackedLink>
        </div>
      </div>

      <p className={styles.supportText}>{shippingNote}</p>
      <p className={styles.status} aria-live="polite">
        {statusMessage}
      </p>

      <div className={styles.stickyBar}>
        <div className={styles.stickyMeta}>
          <strong>{selectedVariant.price * quantity} ر.س</strong>
          <span>{selectedVariant.label}</span>
        </div>
        <button
          type="button"
          className={styles.stickyButton}
          onClick={handleAddToCart}
        >
          أضيفي للسلة
        </button>
      </div>
    </section>
  );
}
