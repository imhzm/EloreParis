import {
  normalizeSaudiMobile,
  type CheckoutSubmissionInput,
} from "@/lib/checkout-validation";

export const MAX_ORDER_REQUEST_BYTES = 32 * 1024;
export const MAX_ORDER_ITEMS = 50;

export type AuthorityCheckoutSubmissionInput = CheckoutSubmissionInput & {
  termsVersion: string;
  privacyNoticeVersion: string;
};

type CreateOrderRequest = {
  quoteId: string;
  checkout: AuthorityCheckoutSubmissionInput;
};

type OrderRequestValidationResult =
  | { ok: true; value: CreateOrderRequest }
  | { ok: false };

const orderKeys = ["quoteId", "checkout"] as const;
const checkoutKeys = [
  "fullName",
  "phone",
  "email",
  "city",
  "district",
  "addressLine",
  "notes",
  "shippingMethodId",
  "paymentMethodId",
  "acceptPolicies",
  "acceptUpdates",
  "termsVersion",
  "privacyNoticeVersion",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
) {
  const keys = Object.keys(value);
  return (
    keys.length === allowedKeys.length &&
    keys.every((key) => allowedKeys.includes(key))
  );
}

function parseBoundedString(
  value: unknown,
  minimumLength: number,
  maximumLength: number,
) {
  if (typeof value !== "string") return null;

  const normalizedValue = value.trim();
  if (
    normalizedValue.length < minimumLength ||
    normalizedValue.length > maximumLength
  ) {
    return null;
  }

  return normalizedValue;
}

function parseCheckout(value: unknown): AuthorityCheckoutSubmissionInput | null {
  if (!isRecord(value) || !hasExactKeys(value, checkoutKeys)) return null;

  const fullName = parseBoundedString(value.fullName, 4, 120);
  const rawPhone = parseBoundedString(value.phone, 9, 24);
  const phone = rawPhone ? normalizeSaudiMobile(rawPhone) : null;
  const email = parseBoundedString(value.email, 0, 254);
  const city = parseBoundedString(value.city, 2, 80);
  const district = parseBoundedString(value.district, 2, 80);
  const addressLine = parseBoundedString(value.addressLine, 8, 300);
  const notes = parseBoundedString(value.notes, 0, 1_000);
  const termsVersion = parseBoundedString(value.termsVersion, 1, 120);
  const privacyNoticeVersion = parseBoundedString(
    value.privacyNoticeVersion,
    1,
    120,
  );

  if (
    fullName === null ||
    phone === null ||
    email === null ||
    city === null ||
    district === null ||
    addressLine === null ||
    notes === null ||
    termsVersion === null ||
    privacyNoticeVersion === null ||
    (value.shippingMethodId !== "standard" &&
      value.shippingMethodId !== "express") ||
    (value.paymentMethodId !== "payment_link" &&
      value.paymentMethodId !== "cash_on_delivery") ||
    typeof value.acceptPolicies !== "boolean" ||
    typeof value.acceptUpdates !== "boolean"
  ) {
    return null;
  }

  return {
    fullName,
    phone,
    email,
    city,
    district,
    addressLine,
    notes,
    shippingMethodId: value.shippingMethodId,
    paymentMethodId: value.paymentMethodId,
    acceptPolicies: value.acceptPolicies,
    acceptUpdates: value.acceptUpdates,
    termsVersion,
    privacyNoticeVersion,
  };
}

export function parseCreateOrderRequest(
  value: unknown,
): OrderRequestValidationResult {
  if (!isRecord(value) || !hasExactKeys(value, orderKeys)) {
    return { ok: false };
  }

  const quoteId = parseBoundedString(value.quoteId, 16, 160);
  if (!quoteId) return { ok: false };

  const checkout = parseCheckout(value.checkout);
  if (!checkout) {
    return { ok: false };
  }

  return {
    ok: true,
    value: {
      quoteId,
      checkout,
    },
  };
}
