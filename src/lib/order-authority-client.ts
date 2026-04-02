import type { StoredCartItem } from "@/lib/cart";
import type { CheckoutSubmissionInput } from "@/lib/checkout-validation";
import type { StoredNotification } from "@/lib/notification-types";
import type { StoredOrder } from "@/lib/orders";

type CreateOrderRequestInput = {
  items: StoredCartItem[];
  checkout: CheckoutSubmissionInput;
};

type OrderResponse = {
  order: StoredOrder;
  notifications: StoredNotification[];
};

type OpsOrderUpdateResponse = {
  order: StoredOrder;
  previousStatus: StoredOrder["status"];
  nextStatus: StoredOrder["status"];
};

async function parseApiResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
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

    throw new Error(errorMessage);
  }

  if (!payload) {
    throw new Error("API returned an empty response.");
  }

  return payload as T;
}

export async function createOrderThroughAuthority(input: CreateOrderRequestInput) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse<OrderResponse>(response);
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
  const response = await fetch("/api/ops/orders", {
    cache: "no-store",
  });
  const payload = await parseApiResponse<{ orders: StoredOrder[] }>(response);

  return payload.orders;
}

export async function advanceOpsOrderFromAuthority(orderNumber: string) {
  const response = await fetch(`/api/ops/orders/${encodeURIComponent(orderNumber)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseApiResponse<OpsOrderUpdateResponse>(response);
}
