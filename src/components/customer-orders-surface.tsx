import { TrackedLink } from "@/components/tracked-link";
import {
  getOrderStatusMeta,
  getPaymentMethodById,
  getShippingMethodById,
  type StoredOrder,
} from "@/lib/orders";
import styles from "./order-flow.module.css";

type CustomerOrdersSurfaceProps = {
  orders: StoredOrder[];
};

function formatOrderDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function CustomerOrdersSurface({
  orders,
}: CustomerOrdersSurfaceProps) {
  const sortedOrders = [...orders].sort((leftOrder, rightOrder) =>
    rightOrder.createdAt.localeCompare(leftOrder.createdAt),
  );

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Customer access</p>
          <h1>مراجعة الطلبات الموثقة على الحساب الحالي أو هذا الجهاز</h1>
          <p className={styles.summary}>
            هذه الصفحة تسحب قائمة الطلبات من authority الحالية عبر account ownership الموثق بعد auth handoff،
            أو عبر customer-access session الحالية إذا كانت هي قناة التحقق الوحيدة المتاحة.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>Ownership scope</p>
            <strong>{sortedOrders.length} طلب موثق</strong>
            <span>
              إذا اكتمل auth handoff فستظهر الطلبات الموثقة على الحساب الحالي عبر أكثر من جهاز،
              وإلا تبقى الصفحة معتمدة على session الجهاز الحالي فقط.
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Next step</p>
            <h2>كل طلب يحتفظ بمراجعه التشغيلية</h2>
            <p>
              ستجدين هنا payment ref وsettlement ref وshipping ref وtracking number وحالة
              التنفيذ لكل طلب موثق على الحساب الحالي أو على هذا الجهاز.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>Verified orders for the current account</p>
          <h2>قائمة الطلبات</h2>

          {sortedOrders.length ? (
            <div className={styles.summaryList}>
              {sortedOrders.map((order) => {
                const statusMeta = getOrderStatusMeta(order.status);
                const activePaymentUrl =
                  order.paymentMethodId === "payment_link" &&
                  order.providerBindings.payment.state !== "confirmed"
                    ? order.providerBindings.payment.paymentUrl
                    : null;

                return (
                  <article key={order.orderNumber} className={styles.referenceCard}>
                    <div className={styles.referenceRow}>
                      <span>{order.orderNumber}</span>
                      <strong className={styles.referenceValue}>{statusMeta.label}</strong>
                    </div>
                    <p>{statusMeta.description}</p>

                    <div className={styles.referenceRow}>
                      <span>وقت الإنشاء</span>
                      <strong className={styles.referenceValue}>
                        {formatOrderDate(order.createdAt)}
                      </strong>
                    </div>
                    <div className={styles.referenceRow}>
                      <span>الدفع</span>
                      <strong className={styles.referenceValue}>
                        {getPaymentMethodById(order.paymentMethodId)?.label ?? order.paymentMethodId}
                      </strong>
                    </div>
                    <div className={styles.referenceRow}>
                      <span>الشحن</span>
                      <strong className={styles.referenceValue}>
                        {getShippingMethodById(order.shippingMethodId)?.label ?? order.shippingMethodId}
                      </strong>
                    </div>
                    <div className={styles.referenceRow}>
                      <span>Payment reference</span>
                      <strong className={styles.referenceValue}>
                        {order.providerBindings.payment.referenceId ?? "pending"}
                      </strong>
                    </div>
                    <div className={styles.referenceRow}>
                      <span>Settlement reference</span>
                      <strong className={styles.referenceValue}>
                        {order.providerBindings.payment.settlementReference ?? "pending"}
                      </strong>
                    </div>
                    <div className={styles.referenceRow}>
                      <span>Shipping reference</span>
                      <strong className={styles.referenceValue}>
                        {order.providerBindings.shipping.bookingReference ?? "pending"}
                      </strong>
                    </div>
                    <div className={styles.referenceRow}>
                      <span>Tracking number</span>
                      <strong className={styles.referenceValue}>
                        {order.providerBindings.shipping.trackingNumber ?? "pending"}
                      </strong>
                    </div>

                    <div className={styles.actionColumn}>
                      {activePaymentUrl ? (
                        <TrackedLink
                          href={activePaymentUrl}
                          className={styles.primaryLink}
                          analyticsLabel="customer_orders_to_payment_provider"
                          analyticsSurface="customer_orders_list"
                          analyticsDestinationType="payment_provider"
                          target="_blank"
                          rel="noreferrer"
                        >
                          إكمال الدفع
                        </TrackedLink>
                      ) : null}
                      <TrackedLink
                        href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
                        className={activePaymentUrl ? styles.secondaryLink : styles.primaryLink}
                        analyticsLabel="customer_orders_to_tracking"
                        analyticsSurface="customer_orders_list"
                        analyticsDestinationType="order_tracking"
                      >
                        تتبّع الطلب
                      </TrackedLink>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.inlineNotice}>
              لا توجد جلسة موثقة لهذا الحساب أو هذا الجهاز الآن. ابدئي أولًا من
              تتبع الطلب أو صفحة التأكيد.
            </div>
          )}
        </article>

        <aside className={styles.summaryCard}>
          <p className={styles.sectionTitle}>Access routes</p>
          <h2>ادخلي إلى الطلب الصحيح بالمرجع الأوضح</h2>

          <div className={styles.actionColumn}>
            <TrackedLink
              href="/track-order"
              className={styles.primaryLink}
              analyticsLabel="customer_orders_to_track_order"
              analyticsSurface="customer_orders_empty_state"
              analyticsDestinationType="order_tracking"
            >
              تتبّع طلب آخر
            </TrackedLink>
            <TrackedLink
              href="/shop"
              className={styles.secondaryLink}
              analyticsLabel="customer_orders_to_shop"
              analyticsSurface="customer_orders_empty_state"
              analyticsDestinationType="collection_hub"
            >
              العودة إلى المتجر
            </TrackedLink>
          </div>
        </aside>
      </section>
    </div>
  );
}
