"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { getProductBySlug, type ProductVariant } from "@/lib/site-content";
import { getSupplierRecord, getVariantOperations } from "@/lib/variant-operations";
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
  const product = getProductBySlug(productSlug);

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

    setStatusMessage(
      `تمت إضافة ${productName} إلى السلة. عدد العناصر بعد هذه الخطوة: ${cartCount + quantity}.`,
    );

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

  const selectedTotal = selectedVariant.price * quantity;
  const compareAtTotal = selectedVariant.compareAtPrice
    ? selectedVariant.compareAtPrice * quantity
    : null;
  const savingsAmount = compareAtTotal ? compareAtTotal - selectedTotal : 0;
  const variantOperations = getVariantOperations(productSlug, selectedVariant.sku);
  const supplier = variantOperations
    ? getSupplierRecord(variantOperations.supplierId)
    : null;
  const requiresStockReview = Boolean(
    variantOperations &&
      variantOperations.stockOnHand <= variantOperations.lowStockThreshold,
  );
  const authorityPreview = variantOperations
    ? [
        {
          label: "Supplier lane",
          title: supplier?.name ?? "Supplier mapping pending",
          body: supplier
            ? `${supplier.fulfillmentModel === "dropship" ? "مسار مورد مباشر" : supplier.fulfillmentModel === "hybrid" ? "مسار مختلط" : "مسار مباشر"} مع lead time ${supplier.leadTime}.`
            : "هذا الـ SKU ما زال يحتاج ربط supplier authority أوضح قبل أي ادعاء تشغيلي نهائي.",
        },
        {
          label: "Dispatch mode",
          title:
            selectedVariant.availability === "PreOrder" ||
            supplier?.fulfillmentModel === "dropship"
              ? "Supplier-assisted handoff"
              : requiresStockReview
                ? "Manual stock confirmation"
                : "Local stock lane",
          body:
            selectedVariant.availability === "PreOrder"
              ? "الدرجة الحالية تعمل كـ preorder، لذلك checkout يجب أن يبقى منضبطًا حول lead time بدل وعود فورية."
              : requiresStockReview
                ? `المخزون الحالي ${variantOperations.stockOnHand} ويقترب من حد المراجعة ${variantOperations.lowStockThreshold}، لذا توجد طبقة تأكيد قبل الاعتماد النهائي.`
                : `shipping class الحالية هي ${variantOperations.shippingClass} مع مخزون تشغيلي ظاهر قبل الانتقال إلى السلة.`,
        },
        {
          label: "Payment guardrail",
          title: variantOperations.codEligible ? "COD-safe variant" : "Payment-link route",
          body: variantOperations.codEligible
            ? "هذا الـ SKU مؤهل تشغيليًا لمسار الدفع عند الاستلام إذا بقيت بقية عناصر السلة والمدينة ضمن نفس القواعد."
            : "هذا الـ SKU يوجه السلة نحو payment-link handoff إذا أصبح هو المحدد التشغيلي داخل الطلب.",
        },
      ]
    : [];
  const decisionSignals = product
    ? [
        {
          label: "Fit",
          title: product.concern,
          body: `الأقرب لهذا المنتج عندما يكون الهدف هو ${product.concern} مع رغبة في ${product.finish}.`,
        },
        {
          label: "Routine",
          title: product.routineStep,
          body: `يدخل بوضوح في خطوة ${product.routineStep} بدل إضافة طبقة غير مفهومة داخل الروتين.`,
        },
        {
          label: "Trust",
          title: shippingNote,
          body: "الشحن يبقى ظاهرًا قبل الدفع حتى لا يتحول القرار إلى مفاجأة عند checkout.",
        },
      ]
    : [];
  const objectionQuestions = product?.questions.slice(0, 2) ?? [];
  const supportRoutes = product?.pairings.slice(0, 2) ?? [];

  return (
    <section className={styles.panel} aria-labelledby={`buy-${productSlug}`}>
      <div>
        <p className={styles.supportText}>قرار الشراء</p>
        <h2 id={`buy-${productSlug}`}>اختيار الدرجة أو الحجم ثم إضافته إلى السلة</h2>
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

      {decisionSignals.length ? (
        <div className={styles.decisionGrid}>
          {decisionSignals.map((signal) => (
            <article key={signal.label} className={styles.decisionCard}>
              <p className={styles.cardLabel}>{signal.label}</p>
              <strong>{signal.title}</strong>
              <p>{signal.body}</p>
            </article>
          ))}
        </div>
      ) : null}

      {objectionQuestions.length ? (
        <div className={styles.supportCard}>
          <div className={styles.cardHeading}>
            <p className={styles.cardLabel}>Objection control</p>
            <h3>احسمي آخر اعتراض قبل add-to-cart</h3>
          </div>

          <div className={styles.questionList}>
            {objectionQuestions.map((item) => (
              <article key={item.question} className={styles.questionItem}>
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {authorityPreview.length ? (
        <div className={styles.supportCard}>
          <div className={styles.cardHeading}>
            <p className={styles.cardLabel}>Authority preview</p>
            <h3>هذا الـ SKU لا يخرج إلى checkout بنفس منطق كل الدرجات أو الأحجام.</h3>
          </div>

          <div className={styles.questionList}>
            {authorityPreview.map((item) => (
              <article key={item.label} className={styles.questionItem}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.controls}>
        <div className={styles.quantityRow}>
          <p className={styles.quantityLabel}>
            السلة الحالية تحفظ هذا القرار على هذا الجهاز حتى تنتقلي إلى مراجعة الطلب بدل
            إنهاء الرحلة عند صفحة المنتج.
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
          <div className={styles.priceStack}>
            <strong className={styles.priceValue}>{selectedTotal} ر.س</strong>
            {compareAtTotal ? (
              <span className={styles.compareValue}>
                بدل {compareAtTotal} ر.س{` - وفر ${savingsAmount} ر.س`}
              </span>
            ) : null}
          </div>
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

        {supportRoutes.length ? (
          <div className={styles.supportCard}>
            <div className={styles.cardHeading}>
              <p className={styles.cardLabel}>Support route</p>
              <h3>كمّلي القرار بخطوة داعمة واحدة فقط</h3>
            </div>
            <p className={styles.quantityLabel}>
              إذا بقي اعتراض متعلق بالروتين أو السياق، خذي route واحدة داعمة بدل فتح
              browsing loop جديد.
            </p>
            <div className={styles.routeList}>
              {supportRoutes.map((route) => (
                <TrackedLink
                  key={route.href}
                  href={route.href}
                  analyticsLabel={`product_purchase_support_${productSlug}_${route.href.split("/").filter(Boolean).at(-1) ?? "route"}`}
                  analyticsSurface="product_purchase_panel"
                  analyticsDestinationType="support_route"
                >
                  <span>{route.label}</span>
                  <span>Support route</span>
                </TrackedLink>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <p className={styles.supportText}>{shippingNote}</p>
      <p className={styles.status} aria-live="polite">
        {statusMessage}
      </p>

      <div className={styles.stickyBar}>
        <div className={styles.stickyMeta}>
          <strong>{selectedTotal} ر.س</strong>
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
