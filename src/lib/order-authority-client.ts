import type { StoredCartItem } from "@/lib/cart";
import type { Locale } from "@/lib/i18n";
import type { AuthorityCheckoutSubmissionInput } from "@/lib/order-request-validation";
import type { StoredNotification } from "@/lib/notification-types";
import type {
  OrderProviderBindingAction,
  StoredOrder,
} from "@/lib/orders";

type CreateOrderRequestInput = {
  quoteId: string;
  checkout: AuthorityCheckoutSubmissionInput;
};

export type CheckoutQuoteResponse = {
  quoteId: string;
  locale: Locale;
  currency: "SAR";
  taxInclusive: true;
  vatRateBps: number;
  expiresAt: string;
  policySet: {
    termsVersion: string;
    privacyNoticeVersion: string;
    termsPath: string;
    privacyNoticePath: string;
  };
  lines: Array<{
    productSlug: string;
    sku: string;
    nameAr: string;
    nameEn: string;
    labelAr: string;
    labelEn: string;
    size: string;
    quantity: number;
    unitGrossHalalas: number;
    lineGrossHalalas: number;
    lineVatHalalas: number;
  }>;
  shipping: {
    methodId: "standard" | "express";
    labelAr: string;
    labelEn: string;
    estimatedDeliveryAr: string;
    estimatedDeliveryEn: string;
    grossHalalas: number;
    vatHalalas: number;
  };
  paymentOptions: Array<{
    id: "payment_link" | "cash_on_delivery";
    enabled: boolean;
    reasonCode: "provider_unavailable" | "unavailable_for_cart" | null;
  }>;
  subtotalGrossHalalas: number;
  subtotalVatHalalas: number;
  totalGrossHalalas: number;
  totalVatHalalas: number;
};

type OrderResponse = {
  order: StoredOrder;
  notifications: StoredNotification[];
  customerAccessHandoffPath?: string;
};

export type OrderAttemptRecoveryResponse =
  | { state: "unknown" }
  | { state: "in_progress" }
  | { state: "completed"; order: StoredOrder };

type OpsOrderUpdateResponse = {
  order: StoredOrder;
  previousStatus: StoredOrder["status"];
  nextStatus: StoredOrder["status"];
};

type OpsOrderProviderUpdateResponse = {
  order: StoredOrder;
  action: OrderProviderBindingAction;
};

export class AuthorityApiError extends Error {
  code: string;
  statusCode: number;
  issues: string[];

  constructor(message: string, code: string, statusCode: number, issues: string[] = []) {
    super(message);
    this.name = "AuthorityApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.issues = issues;
  }
}

async function parseApiResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; code?: string; issues?: string[] }
    | T
    | null;

  if (!response.ok) {
    const errorMessage =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}.`;

    throw new AuthorityApiError(
      errorMessage,
      payload && typeof payload === "object" && "code" in payload && typeof payload.code === "string"
        ? payload.code
        : "authority_request_failed",
      response.status,
      payload && typeof payload === "object" && "issues" in payload && Array.isArray(payload.issues)
        ? payload.issues.filter((issue): issue is string => typeof issue === "string")
        : [],
    );
  }

  if (!payload) {
    throw new Error("API returned an empty response.");
  }

  return payload as T;
}

export async function createCheckoutQuoteThroughAuthority(input: {
  items: StoredCartItem[];
  shippingMethodId: "standard" | "express";
  locale: Locale;
}, signal?: AbortSignal) {
  const response = await fetch("/api/checkout/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
    signal,
  });
  const payload = await parseApiResponse<{ quote: CheckoutQuoteResponse }>(response);
  return payload.quote;
}

export async function createOrderThroughAuthority(
  input: CreateOrderRequestInput,
  idempotencyKey: string,
) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<OrderResponse>(response);
}

export async function recoverOrderAttemptFromAuthority(
  idempotencyKey: string,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ idempotencyKey });
  const response = await fetch(`/api/orders/recovery?${params.toString()}`, {
    cache: "no-store",
    signal,
  });
  return parseApiResponse<OrderAttemptRecoveryResponse>(response);
}

export async function fetchRecentOrderFromAuthority(orderNumber: string) {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`, {
    cache: "no-store",
  });

  return parseApiResponse<OrderResponse>(response);
}

export async function fetchTrackedOrderFromAuthority(
  orderNumber: string,
  phoneLastFour: string,
) {
  const params = new URLSearchParams({
    phoneLastFour,
  });
  const response = await fetch(
    `/api/orders/${encodeURIComponent(orderNumber)}?${params.toString()}`,
    {
      cache: "no-store",
    },
  );

  return parseApiResponse<OrderResponse>(response);
}

export async function fetchOpsOrdersFromAuthority() {
  const response = await fetch("/api/ops/orders", { cache: "no-store" });
  const payload = await parseApiResponse<{ orders: StoredOrder[] }>(response);
  return payload.orders;
}

export async function advanceOpsOrderFromAuthority(orderNumber: string) {
  const response = await fetch(`/api/ops/orders/${encodeURIComponent(orderNumber)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  return parseApiResponse<OpsOrderUpdateResponse>(response);
}

export async function updateOpsOrderProviderBinding(
  orderNumber: string,
  action: OrderProviderBindingAction,
) {
  const response = await fetch(`/api/ops/orders/${encodeURIComponent(orderNumber)}/provider`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  return parseApiResponse<OpsOrderProviderUpdateResponse>(response);
}
