import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CustomerOrdersSurface } from "@/components/customer-orders-surface";
import { StorefrontShell } from "@/components/storefront-shell";
import {
  CUSTOMER_ACCOUNT_COOKIE,
  CUSTOMER_ACCESS_COOKIE,
  getAuthorityOrdersForCustomerAccountCookie,
  getAuthorityOrdersForCustomerAccessCookie,
} from "@/lib/order-authority";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "طلباتي",
  description:
    "مراجعة الطلبات الموثقة على الحساب الحالي بعد auth handoff، أو على هذا الجهاز عبر customer-access session داخل النسخة الحالية من متجر Cozmateks.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountOrdersPage() {
  const cookieStore = await cookies();
  const customerAccountToken = cookieStore.get(CUSTOMER_ACCOUNT_COOKIE)?.value;
  const customerAccessToken = cookieStore.get(CUSTOMER_ACCESS_COOKIE)?.value;
  const accountOrders = await getAuthorityOrdersForCustomerAccountCookie(
    customerAccountToken,
  );
  const orders =
    accountOrders.length > 0
      ? accountOrders
      : await getAuthorityOrdersForCustomerAccessCookie(customerAccessToken);

  return (
    <StorefrontShell activeHref="/track-order">
      <CustomerOrdersSurface orders={orders} />
    </StorefrontShell>
  );
}
