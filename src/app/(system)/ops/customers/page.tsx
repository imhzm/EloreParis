import type { Metadata } from "next";
import Link from "next/link";
import { OpsNav } from "@/components/ops-nav";
import { DownloadCsvButton } from "@/components/ops-download-csv";
import styles from "@/components/ops-customers.module.css";
import { StorefrontShell } from "@/components/storefront-shell";
import { getOpsCustomerSnapshot } from "@/lib/ops-customer-insights";
import { readAuthorityOrders } from "@/lib/order-authority";

export const metadata: Metadata = {
  title: "إدارة العملاء",
  description:
    "مساحة تشغيلية محمية لمراجعة العملاء ونشاط الطلبات داخل ÉLORÉ PARIS.",
  robots: { index: false, follow: false },
};

type OpsCustomersPageProps = {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[]; pageSize?: string | string[] }>;
};

const CUSTOMERS_PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_CUSTOMERS_PAGE_SIZE = 25;

const currencyFormatter = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("ar-SA", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "غير متاح" : dateFormatter.format(date);
}

export default async function OpsCustomersPage({
  searchParams,
}: OpsCustomersPageProps) {
  const parameters = await searchParams;
  const rawQuery = Array.isArray(parameters.q) ? parameters.q[0] : parameters.q;
  const rawPage = Array.isArray(parameters.page) ? parameters.page[0] : parameters.page;
  const rawPageSize = Array.isArray(parameters.pageSize) ? parameters.pageSize[0] : parameters.pageSize;
  const currentPage = Math.max(1, Number(rawPage) || 1);
  const pageSize = CUSTOMERS_PAGE_SIZES.includes(Number(rawPageSize)) ? Number(rawPageSize) : DEFAULT_CUSTOMERS_PAGE_SIZE;
  const orders = await readAuthorityOrders();
  const snapshot = getOpsCustomerSnapshot(orders, rawQuery);

  const totalCustomers = snapshot.customers.length;
  const totalPages = Math.max(1, Math.ceil(totalCustomers / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedCustomers = snapshot.customers.slice(startIndex, startIndex + pageSize);

  const stats = [
    {
      label: "إجمالي العملاء",
      value: snapshot.totalCustomerCount.toLocaleString("ar-SA"),
      note: "هوية مجمّعة من الهاتف أو البريد داخل الطلبات",
    },
    {
      label: "عملاء متكررون",
      value: snapshot.repeatCustomerCount.toLocaleString("ar-SA"),
      note: "أكثر من طلب مسجّل للعميل نفسه",
    },
    {
      label: "يحتاجون متابعة",
      value: snapshot.attentionCustomerCount.toLocaleString("ar-SA"),
      note: "تحقق أو دفع أو تنفيذ أو توصيل",
    },
    {
      label: "قيمة الطلبات المسجلة",
      value: currencyFormatter.format(snapshot.totalRecordedValue),
      note: "ليست إيرادًا محصلًا ما لم يؤكد مزود الدفع",
    },
  ];

  return (
    <StorefrontShell activeHref="/ops/customers">
      <OpsNav activeHref="/ops/customers" />
      <div className={styles.page}>
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>CUSTOMER OPERATIONS</span>
            <h1>العملاء</h1>
            <p>
              رؤية تشغيلية موحّدة مبنية على الطلبات الفعلية، لتحديد العملاء
              المتكررين وحالات المتابعة بدون إنشاء بيانات أو نجاحات وهمية.
            </p>
          </div>
          <span className={styles.sourceBadge}>المصدر: Order Authority</span>
        </header>

        <section className={styles.statsGrid} aria-label="ملخص العملاء">
          {stats.map((stat) => (
            <article className={styles.statCard} key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <p>{stat.note}</p>
            </article>
          ))}
        </section>

        <section className={styles.workspace}>
          <div className={styles.toolbar}>
            <div>
              <h2>دليل العملاء</h2>
              <p>
                {snapshot.query
                  ? `${totalCustomers.toLocaleString("ar-SA")} نتيجة مطابقة`
                  : `${snapshot.totalCustomerCount.toLocaleString("ar-SA")} عميل مسجّل`}
                {totalPages > 1 ? ` (صفحة ${safePage} من ${totalPages})` : null}
              </p>
            </div>
            <div className={styles.toolbarActions}>
              <DownloadCsvButton
                filename="elore-customers.csv"
                rows={snapshot.customers.map((c) => ({
                  الاسم: c.name,
                  المدينة: c.city ?? "",
                  الهاتف: c.maskedPhone,
                  البريد: c.maskedEmail,
                  عدد_الطلبات: c.orderCount,
                  الطلبات_النشطة: c.openOrderCount,
                  القيمة_المسجلة: c.recordedValue,
                  آخر_طلب: c.latestOrderNumber,
                  حالة_المتابعة: c.laneLabel,
                  عميل_متكرر: c.isRepeatCustomer ? "نعم" : "لا",
                }))}
                label="تصدير CSV"
              />
              <form className={styles.searchForm} action="/ops/customers" method="get" role="search">
                <label htmlFor="customer-search">البحث في العملاء والطلبات</label>
                <div>
                  <input
                    id="customer-search"
                    name="q"
                    type="search"
                    defaultValue={snapshot.query}
                    maxLength={100}
                    placeholder="الاسم، المدينة، الهاتف، البريد أو رقم الطلب"
                  />
                  <button type="submit">بحث</button>
                  {snapshot.query ? <Link href="/ops/customers">مسح</Link> : null}
                </div>
              </form>
            </div>
          </div>

          {paginatedCustomers.length > 0 ? (
            <div className={styles.tableFrame} tabIndex={0} role="region" aria-label="جدول العملاء">
              <table>
                <thead>
                  <tr>
                    <th scope="col">العميل</th>
                    <th scope="col">التواصل</th>
                    <th scope="col">الطلبات</th>
                    <th scope="col">القيمة المسجلة</th>
                    <th scope="col">آخر طلب</th>
                    <th scope="col">حالة المتابعة</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map((customer) => (
                    <tr key={customer.key}>
                      <td>
                        <strong>{customer.name}</strong>
                        <span>{customer.city || "المدينة غير مسجلة"}</span>
                        {customer.isRepeatCustomer ? <em>عميل متكرر</em> : null}
                      </td>
                      <td>
                        <span dir="ltr">{customer.maskedPhone}</span>
                        <span dir="ltr">{customer.maskedEmail}</span>
                      </td>
                      <td>
                        <strong>{customer.orderCount.toLocaleString("ar-SA")}</strong>
                        <span>{customer.openOrderCount.toLocaleString("ar-SA")} طلب نشط</span>
                      </td>
                      <td><strong>{currencyFormatter.format(customer.recordedValue)}</strong></td>
                      <td>
                        <strong dir="ltr">#{customer.latestOrderNumber}</strong>
                        <span>{customer.latestStatusLabel}</span>
                        <time dateTime={customer.latestOrderAt}>{formatDate(customer.latestOrderAt)}</time>
                      </td>
                      <td>
                        <span className={`${styles.status} ${styles[customer.lane]}`}>
                          {customer.laneLabel}
                        </span>
                        <small>{customer.laneNote}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState} role="status">
              <strong>لا توجد نتائج مطابقة</strong>
              <p>جرّب اسمًا أو مدينة أو رقم طلب آخر، أو امسح البحث لعرض الدليل كاملًا.</p>
              <Link href="/ops/customers">عرض جميع العملاء</Link>
            </div>
          )}

          {totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="التنقل بين صفحات العملاء">
              <div className={styles.paginationInfo}>
                <span>{startIndex + 1}–{Math.min(startIndex + pageSize, totalCustomers)} من {totalCustomers}</span>
                <label>
                  <span>عرض</span>
                  <select
                    className={styles.pageSizeSelect}
                    defaultValue={pageSize}
                    onChange={(event) => {
                      const url = new URL(window.location.href);
                      url.searchParams.set("pageSize", event.currentTarget.value);
                      url.searchParams.set("page", "1");
                      window.location.href = url.toString();
                    }}
                  >
                    {CUSTOMERS_PAGE_SIZES.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className={styles.paginationPages}>
                {safePage > 1 ? (
                  <Link
                    href={`/ops/customers?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(parameters as Record<string, string>).entries()), page: String(safePage - 1) }).toString()}`}
                    className={styles.pageLink}
                    aria-label="الصفحة السابقة"
                  >
                    ‹
                  </Link>
                ) : null}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((pageNum) => pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - safePage) <= 1)
                  .map((pageNum, index, arr) => {
                    const elements: React.ReactNode[] = [];
                    if (index > 0 && pageNum - arr[index - 1] > 1) {
                      elements.push(<span key={`ellipsis-${pageNum}`} className={styles.ellipsis}>…</span>);
                    }
                    elements.push(
                      pageNum === safePage ? (
                        <span key={pageNum} className={`${styles.pageLink} ${styles.pageLinkActive}`}>{pageNum}</span>
                      ) : (
                        <Link
                          key={pageNum}
                          href={`/ops/customers?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(parameters as Record<string, string>).entries()), page: String(pageNum) }).toString()}`}
                          className={styles.pageLink}
                          aria-label={`الصفحة ${pageNum}`}
                        >
                          {pageNum}
                        </Link>
                      ),
                    );
                    return elements;
                  })}
                {safePage < totalPages ? (
                  <Link
                    href={`/ops/customers?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(parameters as Record<string, string>).entries()), page: String(safePage + 1) }).toString()}`}
                    className={styles.pageLink}
                    aria-label="الصفحة التالية"
                  >
                    ›
                  </Link>
                ) : null}
              </div>
            </nav>
          ) : null}

          <aside className={styles.authorityNote}>
            <strong>حدود هذه المرحلة</strong>
            <p>
              هذه شاشة قراءة تشغيلية وليست CRM مستقلًا. تعديل بيانات العميل أو
              حذفها سيبقى مغلقًا حتى إنشاء Customer Authority بصلاحيات وتدقيق
              واضحين بدل الكتابة مباشرة داخل سجل الطلب.
            </p>
          </aside>
        </section>
      </div>
    </StorefrontShell>
  );
}
