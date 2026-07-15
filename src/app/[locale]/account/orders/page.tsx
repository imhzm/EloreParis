import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  CustomerOrdersSurface,
  type CustomerOrderSummary,
} from "@/components/customer-orders-surface";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale } from "@/lib/i18n";
import {
  CUSTOMER_ACCOUNT_COOKIE,
  CUSTOMER_ACCESS_COOKIE,
  getAuthorityOrdersForCustomerAccountCookie,
  getAuthorityOrdersForCustomerAccessCookie,
} from "@/lib/order-authority";
import type { StoredOrder } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }> };

const metadataCopy = {
  ar: {
    title: "طلباتي",
    description: "راجعي الطلبات المرتبطة بحسابك أو بجلسة الوصول الآمنة على هذا الجهاز.",
  },
  en: {
    title: "My orders",
    description: "Review orders linked to your account or secure access session on this device.",
  },
} as const;

function toCustomerSummary(order: StoredOrder): CustomerOrderSummary {
  const paymentIsPending =
    order.paymentMethodId === "payment_link" &&
    order.providerBindings.payment.state !== "confirmed";
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    status: order.status,
    paymentMethodId: order.paymentMethodId,
    shippingMethodId: order.shippingMethodId,
    paymentUrl: paymentIsPending ? order.providerBindings.payment.paymentUrl : null,
    trackingNumber: order.providerBindings.shipping.trackingNumber,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const canonical = `/${locale}/account/orders`;
  return {
    ...metadataCopy[locale],
    alternates: {
      canonical,
      languages: {
        "ar-SA": "/ar/account/orders",
        "en-SA": "/en/account/orders",
        "x-default": "/ar/account/orders",
      },
    },
    robots: { index: false, follow: false },
  };
}

export default async function LocalizedAccountOrdersPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const cookieStore = await cookies();
  const customerAccountToken = cookieStore.get(CUSTOMER_ACCOUNT_COOKIE)?.value;
  const customerAccessToken = cookieStore.get(CUSTOMER_ACCESS_COOKIE)?.value;
  const accountOrders = await getAuthorityOrdersForCustomerAccountCookie(customerAccountToken);
  const orders = customerAccountToken
    ? accountOrders
    : await getAuthorityOrdersForCustomerAccessCookie(customerAccessToken);

  return (
    <StorefrontShell
      activeHref="/account/orders"
      locale={locale}
      languageHref={`/${locale === "ar" ? "en" : "ar"}/account/orders`}
    >
      <CustomerOrdersSurface locale={locale} orders={orders.map(toCustomerSummary)} />
    </StorefrontShell>
  );
}
