import type { Metadata } from "next";
import { OpsNav } from "@/components/ops-nav";
import styles from "@/components/order-flow.module.css";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import { getOrderFulfillmentPlan } from "@/lib/fulfillment";
import {
  getCatalogAuthoritySnapshot,
  getOpsDashboardSnapshot,
  getSupplierAuthoritySnapshot,
} from "@/lib/ops-catalog";
import { readAuthorityOrders } from "@/lib/order-authority";
import { getOrderStatusMeta, type StoredOrder } from "@/lib/orders";

export const metadata: Metadata = {
  title: "لوحة التحكم التشغيلية",
  description:
    "لوحة داخلية غير مفهرسة لإدارة الطلبات والكتالوج والتنفيذ التشغيلي داخل ÉLORÉ PARIS.",
  robots: {
    index: false,
    follow: false,
  },
};

type CustomerLane =
  | "verification"
  | "payment"
  | "delivery"
  | "warehouse"
  | "stable";

type CustomerRecord = {
  key: string;
  name: string;
  city: string;
  orders: number;
  value: number;
  latestOrderAt: string;
  lane: CustomerLane;
  laneLabel: string;
  note: string;
  priority: number;
  statusLabel: string;
  orderNumbers: string[];
};

function formatCurrency(value: number) {
  return `${value.toLocaleString("ar-SA")} ر.س`;
}

function buildCustomerKey(order: StoredOrder) {
  const phone = order.customer.phone.replace(/\D/g, "");
  const email = order.customer.email.trim().toLowerCase();

  return phone || email || order.orderNumber;
}

function getCustomerLane(order: StoredOrder) {
  const plan = getOrderFulfillmentPlan(order);

  if (plan.requiresManualReview || order.status === "received") {
    return {
      lane: "verification" as const,
      label: "تحقق العميل",
      note:
        plan.manualReviewReasons[0] ??
        "هذا الحساب يحتاج مراجعة بيانات أو تأكيد أولي قبل استمرار التنفيذ.",
      priority: 0,
    };
  }

  if (plan.paymentLinkRequired && order.status === "payment_pending") {
    return {
      lane: "payment" as const,
      label: "متابعة الدفع",
      note: "الدفع ما زال هو العائق الرئيسي قبل انتقال الطلب للتجهيز.",
      priority: 1,
    };
  }

  if (order.status === "out_for_delivery") {
    return {
      lane: "delivery" as const,
      label: "تتبع التسليم",
      note: "العميل ينتظر وضوحًا في التوصيل وتحديثات شركة الشحن.",
      priority: 2,
    };
  }

  if (order.status === "confirmed" || order.status === "processing") {
    return {
      lane: "warehouse" as const,
      label: "تسليم للمخزن",
      note: "الوعد القادم للعميل يعتمد على التجهيز والحجز والتسليم الداخلي.",
      priority: 3,
    };
  }

  return {
    lane: "stable" as const,
    label: "مستقر",
    note: "لا توجد عوائق عاجلة مرتبطة بهذا الحساب الآن.",
    priority: 4,
  };
}

function buildCustomerRecords(orders: StoredOrder[]) {
  const customers = new Map<string, CustomerRecord>();

  for (const order of [...orders].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  )) {
    const lane = getCustomerLane(order);
    const key = buildCustomerKey(order);
    const existing = customers.get(key);

    if (!existing) {
      customers.set(key, {
        key,
        name: order.customer.fullName,
        city: order.customer.city,
        orders: 1,
        value: order.totalEstimate,
        latestOrderAt: order.createdAt,
        lane: lane.lane,
        laneLabel: lane.label,
        note: lane.note,
        priority: lane.priority,
        statusLabel: getOrderStatusMeta(order.status).label,
        orderNumbers: [order.orderNumber],
      });
      continue;
    }

    existing.orders += 1;
    existing.value += order.totalEstimate;
    existing.orderNumbers.push(order.orderNumber);

    if (order.createdAt > existing.latestOrderAt) {
      existing.latestOrderAt = order.createdAt;
      existing.city = order.customer.city;
    }

    if (lane.priority < existing.priority) {
      existing.name = order.customer.fullName;
      existing.city = order.customer.city;
      existing.lane = lane.lane;
      existing.laneLabel = lane.label;
      existing.note = lane.note;
      existing.priority = lane.priority;
      existing.statusLabel = getOrderStatusMeta(order.status).label;
    }
  }

  return Array.from(customers.values()).sort(
    (left, right) =>
      left.priority - right.priority ||
      right.orders - left.orders ||
      right.latestOrderAt.localeCompare(left.latestOrderAt),
  );
}

export default async function OpsDashboardPage() {
  const orders = await readAuthorityOrders();
  const dashboard = getOpsDashboardSnapshot(orders);
  const catalog = getCatalogAuthoritySnapshot(orders);
  const suppliers = getSupplierAuthoritySnapshot(orders);
  const customers = buildCustomerRecords(orders);

  const catalogQueue = Object.values(catalog.records)
    .filter((record) => record.liveOrderCount > 0 || record.supplierStatus === "watch")
    .sort(
      (left, right) =>
        right.pendingDemandUnits - left.pendingDemandUnits ||
        right.manualReviewOrders - left.manualReviewOrders ||
        right.supplierWarningCount - left.supplierWarningCount,
    )
    .slice(0, 4);

  const supplierQueue = Object.values(suppliers.records)
    .filter((record) => record.liveOrderCount > 0 || record.supplierStatus === "watch")
    .sort(
      (left, right) =>
        right.watchItemCount - left.watchItemCount ||
        right.pendingDemandUnits - left.pendingDemandUnits ||
        right.liveOrderCount - left.liveOrderCount,
    )
    .slice(0, 4);

  const urgentCustomers = customers.filter((customer) => customer.priority <= 2);

  return (
    <StorefrontShell activeHref="/ops">
      <div className={`${styles.page} ${styles.opsDashboard}`}>
        <OpsNav activeHref="/ops" />

        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Operations control center</p>
            <h1>لوحة قيادة واحدة لكل قرار تشغيلي مهم.</h1>
            <p className={styles.summary}>
              تجربة داكنة وسينمائية للوحة التحكم تجمع الطلبات، العملاء، الكتالوج،
              الموردين، والإشعارات في مشاهد واضحة بدل كروت متفرقة. كل قسم يجيب على
              سؤال واحد: ما الذي يحتاج قرارًا الآن؟
            </p>
          </div>

          <div className={styles.heroAside}>
            <div className={styles.metricCard}>
              <p>Operating scope</p>
              <strong>{orders.length}</strong>
              <span>
                طلب مباشر داخل authority الحالية، مع{" "}
                {dashboard.catalogCoverage.stockedProducts} منتج نشط و{" "}
                {dashboard.catalogCoverage.variants} variant تشغيلي.
              </span>
            </div>

            <div className={styles.metricCard}>
              <p>Customer pressure</p>
              <strong>{urgentCustomers.length}</strong>
              <span>
                حسابات تحتاج تحققًا أو متابعة دفع أو تتبع تسليم قبل أن تتأثر تجربة
                العميل.
              </span>
            </div>

            <div className={styles.noticeCard}>
              <p className={styles.eyebrow}>Safety boundary</p>
              <h2>تصميم جديد بدون تغيير منطق التشغيل</h2>
              <p>
                هذه المرحلة تعيد بناء تجربة لوحة التحكم بصريًا وتنظيميًا، لكنها لا
                تغيّر صلاحيات الوصول أو APIs أو إجراءات تحديث الطلبات.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.statusSummaryGrid}>
          <article className={styles.statusSummaryCard}>
            <p className={styles.sectionTitle}>Active orders</p>
            <strong>{orders.length}</strong>
            <span>كل الطلبات الحية التي تحرك التشغيل اليوم.</span>
          </article>
          <article className={styles.statusSummaryCard}>
            <p className={styles.sectionTitle}>Catalog review</p>
            <strong>{catalog.reviewRequiredProducts}</strong>
            <span>منتجات تحتاج مراجعة قبل تثبيت حقيقة الكتالوج.</span>
          </article>
          <article className={styles.statusSummaryCard}>
            <p className={styles.sectionTitle}>Supplier watch</p>
            <strong>{suppliers.suppliersOnWatch}</strong>
            <span>موردون لديهم ضغط مخزون أو عناصر تحتاج متابعة.</span>
          </article>
          <article className={styles.statusSummaryCard}>
            <p className={styles.sectionTitle}>Unique customers</p>
            <strong>{customers.length}</strong>
            <span>عملاء ظاهرون في بيانات التشغيل الحالية.</span>
          </article>
          <article className={styles.statusSummaryCard}>
            <p className={styles.sectionTitle}>Follow-up queue</p>
            <strong>{urgentCustomers.length}</strong>
            <span>حسابات تحتاج owner واضحًا قبل الخطوة التالية.</span>
          </article>
          <article className={styles.statusSummaryCard}>
            <p className={styles.sectionTitle}>Pending demand</p>
            <strong>{catalog.pendingDemandUnits}</strong>
            <span>وحدات مرتبطة بطلبات مفتوحة أو دفع قيد الانتظار.</span>
          </article>
        </section>

        <section className={styles.layout}>
          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>Decision lanes</p>
            <h2>ثلاثة مسارات تتحكم في جودة التشغيل.</h2>
            <div className={styles.lineList}>
              <article className={styles.lineItem}>
                <div className={styles.lineHead}>
                  <h3>Catalog ownership</h3>
                  <span className={styles.linePrice}>
                    {catalog.productsWithDemand} منتجًا عليه طلب
                  </span>
                </div>
                <p className={styles.lineMeta}>
                  ربط مباشر بين الطلبات المفتوحة وحقيقة المنتج: هل المخزون كافٍ؟
                  هل المورد يحتاج متابعة؟ وهل المنتج جاهز للبيع بثقة؟
                </p>
                <div className={styles.badgeRow}>
                  <span>{catalog.reviewRequiredProducts} review</span>
                  <span>{catalog.supplierFollowupProducts} supplier follow-up</span>
                  <span>{catalog.pendingDemandUnits} pending units</span>
                </div>
              </article>

              <article className={styles.lineItem}>
                <div className={styles.lineHead}>
                  <h3>Supplier ownership</h3>
                  <span className={styles.linePrice}>
                    {suppliers.suppliersWithDemand} موردًا نشطًا
                  </span>
                </div>
                <p className={styles.lineMeta}>
                  متابعة ضغط الموردين وإعادة التعبئة والتنسيق قبل أن تتحول مشاكل
                  المخزون إلى تجربة سيئة للعميل.
                </p>
                <div className={styles.badgeRow}>
                  <span>{suppliers.suppliersOnWatch} on watch</span>
                  <span>{suppliers.suppliersNeedingReplenishment} replenishment</span>
                  <span>{suppliers.coordinationSuppliers} coordination</span>
                </div>
              </article>

              <article className={styles.lineItem}>
                <div className={styles.lineHead}>
                  <h3>Customer ownership</h3>
                  <span className={styles.linePrice}>
                    {formatCurrency(urgentCustomers.reduce((sum, customer) => sum + customer.value, 0))}
                  </span>
                </div>
                <p className={styles.lineMeta}>
                  العملاء لم يعودوا مجرد أرقام طلبات. اللوحة تعرض من يحتاج تحققًا،
                  دفعًا، أو تتبعًا الآن.
                </p>
                <div className={styles.badgeRow}>
                  <span>{customers.filter((customer) => customer.lane === "verification").length} verification</span>
                  <span>{customers.filter((customer) => customer.lane === "payment").length} payment</span>
                  <span>{customers.filter((customer) => customer.lane === "delivery").length} delivery</span>
                </div>
              </article>
            </div>
          </article>

          <aside className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Quick routes</p>
            <h2>انتقال سريع للصفحات التنفيذية</h2>
            <div className={styles.linkList}>
              <TrackedLink href="/ops/orders" analyticsLabel="ops_dashboard_orders" analyticsSurface="ops_dashboard" analyticsDestinationType="ops_orders">
                <span>Orders desk</span>
                <span>{urgentCustomers.length} follow-up</span>
              </TrackedLink>
              <TrackedLink href="/ops/catalog" analyticsLabel="ops_dashboard_catalog" analyticsSurface="ops_dashboard" analyticsDestinationType="ops_catalog">
                <span>Catalog authority</span>
                <span>{catalog.reviewRequiredProducts} review</span>
              </TrackedLink>
              <TrackedLink href="/ops/fulfillment" analyticsLabel="ops_dashboard_fulfillment" analyticsSurface="ops_dashboard" analyticsDestinationType="ops_fulfillment">
                <span>Fulfillment handoff</span>
                <span>{suppliers.coordinationSuppliers} coordination</span>
              </TrackedLink>
              <TrackedLink href="/ops/release" analyticsLabel="ops_dashboard_release" analyticsSurface="ops_dashboard" analyticsDestinationType="ops_release">
                <span>Release readiness</span>
                <span>gates</span>
              </TrackedLink>
            </div>
          </aside>
        </section>

        <section className={styles.layout}>
          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>Operational hotspots</p>
            <h2>أعلى نقاط تحتاج متابعة في الكتالوج والموردين.</h2>
            <div className={styles.catalogPanelGrid}>
              <article className={styles.lineItem}>
                <div className={styles.lineHead}>
                  <h3>Catalog queue</h3>
                  <span className={styles.linePrice}>{catalogQueue.length} items</span>
                </div>
                <div className={styles.lineList}>
                  {catalogQueue.length > 0 ? (
                    catalogQueue.map((record) => (
                      <div key={record.productSlug} className={styles.referenceCard}>
                        <div className={styles.referenceRow}>
                          <strong>{record.productName}</strong>
                          <span className={styles.referenceValue}>
                            {record.pendingDemandUnits} pending
                          </span>
                        </div>
                        <p className={styles.lineMeta}>{record.authorityNote}</p>
                        <div className={styles.badgeRow}>
                          <span>{record.authorityLane}</span>
                          <span>{record.liveOrderCount} live orders</span>
                          <span>{record.supplierWarningCount} supplier watch</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.helperText}>لا توجد عناصر كتالوج عاجلة الآن.</p>
                  )}
                </div>
              </article>

              <article className={styles.lineItem}>
                <div className={styles.lineHead}>
                  <h3>Supplier queue</h3>
                  <span className={styles.linePrice}>{supplierQueue.length} suppliers</span>
                </div>
                <div className={styles.lineList}>
                  {supplierQueue.length > 0 ? (
                    supplierQueue.map((record) => (
                      <div key={record.supplierId} className={styles.referenceCard}>
                        <div className={styles.referenceRow}>
                          <strong>{record.supplierName}</strong>
                          <span className={styles.referenceValue}>
                            {record.watchItemCount} watch
                          </span>
                        </div>
                        <p className={styles.lineMeta}>{record.authorityNote}</p>
                        <div className={styles.badgeRow}>
                          <span>{record.authorityLane}</span>
                          <span>{record.pendingDemandUnits} pending units</span>
                          <span>{record.liveOrderCount} live orders</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.helperText}>كل الموردين في حالة مستقرة الآن.</p>
                  )}
                </div>
              </article>
            </div>
          </article>

          <aside className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Demand signals</p>
            <h2>أين يتركز الطلب؟</h2>
            <div className={styles.summaryList}>
              {dashboard.topProducts.map((product) => (
                <div key={product.slug} className={styles.summaryRow}>
                  <span>{product.name}</span>
                  <strong className={styles.summaryValue}>{product.quantity} units</strong>
                </div>
              ))}
              {dashboard.topCities.map((city) => (
                <div key={city.city} className={styles.summaryRow}>
                  <span>{city.city}</span>
                  <strong className={styles.summaryValue}>{city.count}</strong>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className={styles.layout}>
          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>Customer follow-up</p>
            <h2>العملاء الذين يحتاجون قرارًا الآن.</h2>
            <div className={styles.lineList}>
              {customers.slice(0, 5).map((customer) => (
                <article key={customer.key} className={styles.lineItem}>
                  <div className={styles.lineHead}>
                    <h3>{customer.name}</h3>
                    <span className={styles.linePrice}>{formatCurrency(customer.value)}</span>
                  </div>
                  <p className={styles.lineMeta}>
                    {customer.city} · {customer.note}
                  </p>
                  <div className={styles.badgeRow}>
                    <span>{customer.laneLabel}</span>
                    <span>{customer.statusLabel}</span>
                    <span>{customer.orders} open orders</span>
                  </div>
                  <p className={styles.helperText}>
                    {customer.orderNumbers.slice(0, 3).join(" · ")}
                  </p>
                </article>
              ))}
            </div>
          </article>

          <aside className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Continuity</p>
            <h2>إشارات الاستمرارية</h2>
            <div className={styles.summaryList}>
              {dashboard.repeatCustomers.map((customer) => (
                <div key={customer.name} className={styles.summaryRow}>
                  <span>{customer.name}</span>
                  <strong className={styles.summaryValue}>
                    {customer.orderCount} orders
                  </strong>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </StorefrontShell>
  );
}
