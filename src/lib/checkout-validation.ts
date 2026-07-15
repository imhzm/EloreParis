import type {
  CheckoutCustomerDetails,
  PaymentMethodId,
  ShippingMethodId,
} from "@/lib/orders";

export type CheckoutSubmissionInput = CheckoutCustomerDetails & {
  shippingMethodId: ShippingMethodId;
  paymentMethodId: PaymentMethodId;
  acceptPolicies: boolean;
  acceptUpdates: boolean;
};

export type CheckoutAvailability = {
  shippingMethodIds: ShippingMethodId[];
  paymentMethodIds: PaymentMethodId[];
};

export function normalizeSaudiMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^05\d{8}$/.test(digits)) return `966${digits.slice(1)}`;
  if (/^5\d{8}$/.test(digits)) return `966${digits}`;
  if (/^9665\d{8}$/.test(digits)) return digits;
  return null;
}

export function validateCheckoutSubmission(
  formState: CheckoutSubmissionInput,
  availability: CheckoutAvailability,
) {
  const normalizedPhone = normalizeSaudiMobile(formState.phone);

  if (formState.fullName.trim().length < 4) {
    return "يرجى إدخال اسم واضح حتى يمكن ربط الطلب بمرجع قابل للمتابعة.";
  }

  if (!normalizedPhone) {
    return "أدخلي رقم جوال سعودي صحيحًا، مثل 05XXXXXXXX أو +9665XXXXXXXX.";
  }

  if (formState.city.trim().length < 2 || formState.district.trim().length < 2) {
    return "يرجى تحديد المدينة والحي حتى تصبح نافذة الشحن مفهومة من البداية.";
  }

  if (formState.addressLine.trim().length < 8) {
    return "أضيفي عنوانًا أدق حتى تكون خطوة الطلب قابلة للتحويل إلى تشغيل فعلي لاحقًا.";
  }

  if (
    formState.email.trim().length > 0 &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())
  ) {
    return "البريد الإلكتروني المدخل لا يبدو صالحًا.";
  }

  if (!formState.acceptPolicies) {
    return "يلزم تأكيد مراجعة سياسات الشحن والخصوصية والاسترجاع قبل تثبيت الطلب.";
  }

  if (!availability.shippingMethodIds.includes(formState.shippingMethodId)) {
    return "خيار الشحن المختار غير متاح للكتالوج الحالي.";
  }

  if (!availability.paymentMethodIds.includes(formState.paymentMethodId)) {
    return "طريقة الدفع المختارة غير متاحة لهذا الطلب.";
  }

  return null;
}
