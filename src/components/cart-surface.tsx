"use client";

import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { collectionDirectory, footerPolicyLinks } from "@/lib/site-content";
import { getSupplierRecord, getVariantOperations } from "@/lib/variant-operations";
import styles from "./cart-surface.module.css";

function dedupeBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getKey(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function CartSurface() {
  const pathname = usePathname() ?? "/cart";
  const { cartCount, clearCart, isHydrated, lines, removeItem, subtotal, updateItemQuantity } =
    useCart();

  if (!isHydrated) {
    return (
      <div className={styles.page}>
        <section className={styles.emptyCard}>
          <p className={styles.eyebrow}>Cart review</p>
          <h1>جارٍ استعادة السلة</h1>
          <p>
            يتم الآن تحميل العناصر المحفوظة على هذا الجهاز حتى تظهر المراجعة النهائية
            بشكل صحيح.
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
            هذه الصفحة جاهزة لتربط قرار الشراء بمراجعة الطلب، لكن لا توجد عناصر مضافة
            الآن. يمكنك العودة إلى الاكتشاف التجاري أو استخدام البحث بدل الخروج من
            المسار.
          </p>
          <div className={styles.actionColumn}>
            <TrackedLink
              href="/shop/skincare"
              className={styles.primaryLink}
              analyticsLabel="cart_empty_to_skincare"
              analyticsSurface="cart_empty"
              analyticsDestinationType="collection"
            >
              ابدئي من العناية بالبشرة
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

  const cartProducts = dedupeBy(
    lines.map((line) => line.product),
    (product) => product.slug,
  );
  const cartCollections = dedupeBy(
    cartProducts.map((product) => collectionDirectory[product.collection]),
    (collection) => collection.href,
  );
  const cartQuestions = dedupeBy(
    cartProducts.flatMap((product) =>
      product.questions.slice(0, 1).map((item) => ({
        ...item,
        productName: product.name,
      })),
    ),
    (item) => item.question,
  ).slice(0, 3);
  const cartSupportRoutes = dedupeBy(
    cartProducts.flatMap((product) =>
      product.pairings.map((route) => ({
        ...route,
        productName: product.name,
      })),
    ),
    (route) => route.href,
  ).slice(0, 3);
  const authorityLines = lines.map((line) => {
    const variantOperations = getVariantOperations(
      line.product.slug,
      line.variant.sku,
    );
    const supplier = variantOperations
      ? getSupplierRecord(variantOperations.supplierId)
      : null;
    const requiresStockReview = Boolean(
      variantOperations &&
        variantOperations.stockOnHand <= variantOperations.lowStockThreshold,
    );
    const routeLabel = !variantOperations
      ? "Catalog mapping required"
      : line.variant.availability === "PreOrder" ||
          supplier?.fulfillmentModel === "dropship"
        ? "Supplier direct handoff"
        : requiresStockReview
          ? "Manual stock confirmation"
          : "Local stock dispatch";

    return {
      key: line.key,
      productName: line.product.name,
      supplierName: supplier?.name ?? "Supplier mapping pending",
      supplierId: variantOperations?.supplierId ?? "pending",
      supplierMode: supplier?.fulfillmentModel ?? "unknown",
      routeLabel,
      shippingClass: variantOperations?.shippingClass ?? "pending",
      stockOnHand: variantOperations?.stockOnHand ?? 0,
      lowStockThreshold: variantOperations?.lowStockThreshold ?? 0,
      codEligible: variantOperations?.codEligible ?? false,
      requiresReview:
        line.variant.availability === "PreOrder" || requiresStockReview || !variantOperations,
    };
  });
  const collectionSummary = cartCollections.map((collection) => collection.title).join(" + ");
  const primaryCollection = cartCollections[0];
  const primaryProduct = cartProducts[0];
  const supplierCount = new Set(
    authorityLines.map((line) => line.supplierId),
  ).size;
  const shippingClassCount = new Set(
    authorityLines.map((line) => line.shippingClass),
  ).size;
  const reviewCount = authorityLines.filter((line) => line.requiresReview).length;
  const authorityModeTitle =
    supplierCount > 1
      ? "Mixed-supplier basket"
      : authorityLines[0]
        ? authorityLines[0].supplierName
        : "Authority preview pending";
  const authorityModeBody =
    supplierCount > 1
      ? "السلة الآن تمر عبر أكثر من supplier lane، لذلك أي إضافة جديدة يجب أن تبرر split-shipment أو اختلاف lead time بدل رفع العدد فقط."
      : authorityLines[0]
        ? `المسار الحالي أقرب إلى ${authorityLines[0].supplierMode === "dropship" ? "supplier-assisted fulfillment" : authorityLines[0].supplierMode === "hybrid" ? "hybrid fulfillment" : "direct fulfillment"}، لذا الأولوية الآن هي تثبيت السلة لا توسيعها من جديد.`
        : "لا توجد authority preview كافية بعد لهذه السلة.";
  const bundleModeTitle =
    cartProducts.length === 1
      ? "Single-product intent"
      : cartCollections.length === 1
        ? `Starter bundle داخل ${cartCollections[0]?.title ?? "المسار الحالي"}`
        : "Mixed basket";
  const bundleModeBody =
    cartProducts.length === 1
      ? "السلة ليست bundle كاملة بعد، لذلك أي خطوة إضافية يجب أن تخدم نفس الروتين مباشرة."
      : cartCollections.length === 1
        ? "السلة أقرب إلى bundle منضبطة داخل مسار واحد، لذلك لا تضيفي عنصرًا جديدًا إلا إذا بقي في نفس lane التشغيلية."
        : "السلة الآن مختلطة بين أكثر من مسار، لذلك الأولوية هي تنقية القرار لا رفع العدد.";
  const authorityRules = [
    supplierCount > 1
      ? "السلة لم تعد single-lane bundle، لذلك أي add-on جديد قد يرفع split shipment بدل أن يرفع القيمة بوضوح."
      : shippingClassCount > 1
        ? "العناصر الحالية تشترك في supplier واحد لكن تختلف في shipping class، لذا الأفضل تثبيت القرار قبل أي توسعة جديدة."
        : "العناصر الحالية تسير داخل lane تشغيلية متقاربة، لذلك يمكن إغلاق القرار كسلة منضبطة بدل إعادة فتح browse loop.",
    reviewCount > 0
      ? `${reviewCount} عنصر/عناصر تحتاج stock أو lead-time review قبل اعتبار cart -> checkout handoff مباشرًا بالكامل.`
      : "لا توجد line-level review blockers إضافية على العناصر الحالية داخل cart authority handoff.",
    authorityLines.every((line) => line.codEligible)
      ? "من جهة الـ SKU نفسها لا يوجد COD blocker، وما يتبقى الآن هو قواعد المدينة والإجمالي داخل checkout."
      : "يوجد SKU واحد على الأقل يدفع السلة نحو payment-link authority، لذلك لا تتعاملي مع COD كافتراض تلقائي هنا.",
  ];
  const cartSignals = [
    {
      label: "نية السلة",
      title:
        cartCollections.length === 1 && primaryCollection
          ? `مسار ${primaryCollection.title}`
          : "سلة متعددة المسارات",
      body:
        cartProducts.length === 1 && primaryProduct
          ? `المنتج الحالي (${primaryProduct.name}) يحتاج فقط خطوة داعمة واحدة إذا بقي اعتراض على الاستخدام أو الروتين.`
          : cartCollections.length === 1 && primaryCollection
            ? `السلة ما زالت منضبطة داخل ${primaryCollection.title}، لذلك الأولوية الآن هي مراجعة الكمية لا إعادة فتح التصفح.`
            : `السلة تجمع ${collectionSummary}، فراجعي أن كل عنصر يخدم نفس النتيجة قبل الدفع.`,
    },
    {
      label: "جاهزية القرار",
      title: `${cartProducts.length} منتج / ${cartCount} عنصر`,
      body: cartQuestions.length
        ? "الاعتراضات المتبقية يجب أن تُحسم هنا قبل الانتقال إلى checkout."
        : "تم حصر السلة في عناصر مفهومة، والمرحلة التالية هي مراجعة الطلب بثقة.",
    },
    {
      label: "طبقة الثقة",
      title: "الشحن والسياسات ما زالت داخل الرحلة",
      body: "روابط الشحن والاسترجاع والخصوصية تبقى قريبة من القرار قبل بدء الدفع.",
    },
    {
      label: "Authority mode",
      title: authorityModeTitle,
      body: authorityModeBody,
    },
  ];
  const checkoutChecklist = [
    supplierCount > 1
      ? "إذا تعددت supplier lanes داخل السلة، احسمي ما إذا كان split-shipment مقبولًا قبل الانتقال إلى checkout."
      : "إذا بقيت السلة على supplier lane واحدة، فالأولوية هي تثبيت القرار لا إعادة فتح التصفح.",
    reviewCount > 0
      ? `${reviewCount} عنصر يحتاج مراجعة stock أو lead time، لذلك لا تعاملي checkout كأنه مسار مباشر بالكامل بعد.`
      : "لا توجد مراجعة تشغيلية إضافية مطلوبة على العناصر الحالية قبل handoff التالي.",
    `راجعي كل SKU والكمية قبل الانتقال لأن subtotal الحالي هو ${subtotal} ر.س قبل الشحن والضرائب.`,
    "استخدمي روابط الشحن والاسترجاع والخصوصية من هنا بدل مغادرة المسار بالكامل قبل checkout.",
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Cart review</p>
          <h1>راجعي السلة قبل خطوة الدفع</h1>
          <p className={styles.summary}>
            هذه السلة أصبحت سطحًا حقيقيًا للمراجعة: تعديل الكمية، إزالة العناصر، وربط
            القرار بخطوة checkout بدون فقدان طبقة الشرح أو الثقة.
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
              السلة لا تفصل الزائرة عن طبقة الثقة. الروابط الأساسية تبقى متاحة قبل بدء
              الـ checkout.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>Line items</p>
          <h2>عناصر السلة القابلة للمراجعة والتعديل</h2>

          <div className={styles.signalStrip}>
            {cartSignals.map((signal) => (
              <article key={signal.label} className={styles.signalCard}>
                <p className={styles.eyebrow}>{signal.label}</p>
                <h3>{signal.title}</h3>
                <p>{signal.body}</p>
              </article>
            ))}
          </div>

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

                <div className={styles.lineLinks}>
                  <TrackedLink
                    href={`/products/${line.product.slug}`}
                    className={styles.inlineLink}
                    analyticsLabel={`cart_line_product_${line.product.slug}`}
                    analyticsSurface="cart_line_item"
                    analyticsDestinationType="product"
                  >
                    راجعي صفحة المنتج
                  </TrackedLink>
                  {line.product.pairings[0] ? (
                    <TrackedLink
                      href={line.product.pairings[0].href}
                      className={styles.inlineLink}
                      analyticsLabel={`cart_line_support_${line.product.slug}_${line.product.pairings[0].href.split("/").filter(Boolean).at(-1) ?? "route"}`}
                      analyticsSurface="cart_line_item"
                      analyticsDestinationType="support_route"
                    >
                      {line.product.pairings[0].label}
                    </TrackedLink>
                  ) : null}
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

                  <div className={styles.lineFooterGroup}>
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

          <div className={styles.supportGrid}>
            <article className={styles.supportCard}>
              <p className={styles.eyebrow}>Objection control</p>
              <h3>احسمي آخر تردد قبل checkout</h3>
              {cartQuestions.length ? (
                <div className={styles.questionList}>
                  {cartQuestions.map((item) => (
                    <article key={item.question} className={styles.questionItem}>
                      <strong>{item.question}</strong>
                      <p>{item.answer}</p>
                      <span>{item.productName}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <p>
                  لا توجد اعتراضات موثقة إضافية على هذه العناصر الآن، لذلك تبقى الأولوية
                  لمراجعة الكمية والسياسات قبل الدفع.
                </p>
              )}
            </article>

            <article className={styles.supportCard}>
              <p className={styles.eyebrow}>Complete the routine</p>
              <h3>أضيفي route داعمة واحدة بدل توسيع السلة عشوائيًا</h3>
              <p>
                المطلوب هنا تقوية القرار لا فتح مقارنة جديدة. خذي خطوة داعمة واحدة إذا
                بقي اعتراض حقيقي على الروتين أو النتيجة.
              </p>
              {cartSupportRoutes.length ? (
                <div className={styles.linkList}>
                  {cartSupportRoutes.map((route) => (
                    <TrackedLink
                      key={route.href}
                      href={route.href}
                      analyticsLabel={`cart_support_route_${route.href.split("/").filter(Boolean).at(-1) ?? "route"}`}
                      analyticsSurface="cart_support_routes"
                      analyticsDestinationType="support_route"
                    >
                      <span>{route.label}</span>
                      <span>{route.productName}</span>
                    </TrackedLink>
                  ))}
                </div>
              ) : (
                <p>
                  ستظهر هنا routes داعمة إضافية كلما توسعت طبقة pairings في الكتالوج
                  الحي.
                </p>
              )}
            </article>

            <article className={styles.supportCard}>
              <p className={styles.eyebrow}>Commerce authority handoff</p>
              <h3>هذه السلة يجب أن تغلق lane التشغيلية قبل الانتقال إلى checkout</h3>
              <p>{authorityModeBody}</p>
              <div className={styles.questionList}>
                {authorityLines.map((line) => (
                  <article key={line.key} className={styles.questionItem}>
                    <strong>{line.productName}</strong>
                    <p>
                      {line.routeLabel} عبر {line.supplierName} مع shipping class {line.shippingClass}
                      {line.requiresReview
                        ? `، ومراجعة تشغيلية عند ${line.stockOnHand}/${line.lowStockThreshold} قطعة.`
                        : "."}
                    </p>
                    <span>
                      {line.codEligible ? "COD-safe variant" : "Payment-link route"}
                    </span>
                  </article>
                ))}
              </div>
            </article>

            <article className={styles.supportCard}>
              <p className={styles.eyebrow}>Provider-bound bundle economics</p>
              <h3>ارفعي القيمة فقط إذا بقيت الإضافة داخل نفس handoff التشغيلي</h3>
              <p>{bundleModeBody}</p>
              <div className={styles.questionList}>
                {authorityRules.map((rule) => (
                  <article key={rule} className={styles.questionItem}>
                    <strong>{bundleModeTitle}</strong>
                    <p>{rule}</p>
                  </article>
                ))}
              </div>
            </article>
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
              <strong className={styles.summaryValue}>يُحدد بعد الربط التشغيلي</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>الدفع</span>
              <strong className={styles.summaryValue}>مراجعة قبل الربط الفعلي</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Bundle mode</span>
              <strong className={styles.summaryValue}>{bundleModeTitle}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Authority mode</span>
              <strong className={styles.summaryValue}>{authorityModeTitle}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Supplier lanes</span>
              <strong className={styles.summaryValue}>{supplierCount}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Review mode</span>
              <strong className={styles.summaryValue}>
                {reviewCount ? "Guarded" : "Direct"}
              </strong>
            </div>
          </div>

          <div className={styles.checklistCard}>
            <p className={styles.eyebrow}>Checkout guardrails</p>
            <h3>ما الذي يجب حسمه الآن؟</h3>
            <ul className={styles.checklist}>
              {checkoutChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
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
