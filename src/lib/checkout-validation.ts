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

export type CheckoutFieldErrors = Partial<
  Record<keyof CheckoutSubmissionInput, string>
>;

export type CheckoutValidationResult = {
  summary: string;
  fieldErrors: CheckoutFieldErrors;
};

export function normalizeSaudiMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^05\d{8}$/.test(digits)) return `966${digits.slice(1)}`;
  if (/^5\d{8}$/.test(digits)) return `966${digits}`;
  if (/^9665\d{8}$/.test(digits)) return digits;
  return null;
}

export function validateCheckoutSubmissionFields(
  formState: CheckoutSubmissionInput,
  availability: CheckoutAvailability,
  locale: "ar" | "en" = "ar",
): CheckoutValidationResult | null {
  const normalizedPhone = normalizeSaudiMobile(formState.phone);
  const messages = locale === "en" ? {
    summary: "Review the highlighted fields before placing your order.",
    fullName: "Enter a clear full name so the order can be linked to a traceable reference.",
    phone: "Enter a valid Saudi mobile number, such as 05XXXXXXXX or +9665XXXXXXXX.",
    city: "Enter the delivery city.",
    district: "Enter the delivery district.",
    address: "Enter a more detailed address so the order can be fulfilled correctly.",
    email: "The email address does not appear to be valid.",
    policies: "Review and accept the shipping, privacy, and returns policies before placing the order.",
    shipping: "The selected shipping option is not available for the current catalog.",
    payment: "The selected payment method is not available for this order.",
  } : {
    summary: "راجعي الحقول الموضحة قبل إنشاء الطلب.",
    fullName: "يرجى إدخال اسم واضح حتى يمكن ربط الطلب بمرجع قابل للمتابعة.",
    phone: "أدخلي رقم جوال سعودي صحيحًا، مثل 05XXXXXXXX أو +9665XXXXXXXX.",
    city: "يرجى إدخال مدينة التسليم.",
    district: "يرجى إدخال حي التسليم.",
    address: "أضيفي عنوانًا أدق حتى تكون خطوة الطلب قابلة للتحويل إلى تشغيل فعلي لاحقًا.",
    email: "البريد الإلكتروني المدخل لا يبدو صالحًا.",
    policies: "يلزم تأكيد مراجعة سياسات الشحن والخصوصية والاسترجاع قبل تثبيت الطلب.",
    shipping: "خيار الشحن المختار غير متاح للكتالوج الحالي.",
    payment: "طريقة الدفع المختارة غير متاحة لهذا الطلب.",
  };
  const fieldErrors: CheckoutFieldErrors = {};

  if (formState.fullName.trim().length < 4) {
    fieldErrors.fullName = messages.fullName;
  }

  if (!normalizedPhone) {
    fieldErrors.phone = messages.phone;
  }

  if (formState.city.trim().length < 2) {
    fieldErrors.city = messages.city;
  }

  if (formState.district.trim().length < 2) {
    fieldErrors.district = messages.district;
  }

  if (formState.addressLine.trim().length < 8) {
    fieldErrors.addressLine = messages.address;
  }

  if (
    formState.email.trim().length > 0 &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())
  ) {
    fieldErrors.email = messages.email;
  }

  if (!formState.acceptPolicies) {
    fieldErrors.acceptPolicies = messages.policies;
  }

  if (!availability.shippingMethodIds.includes(formState.shippingMethodId)) {
    fieldErrors.shippingMethodId = messages.shipping;
  }

  if (!availability.paymentMethodIds.includes(formState.paymentMethodId)) {
    fieldErrors.paymentMethodId = messages.payment;
  }

  return Object.keys(fieldErrors).length > 0
    ? { summary: messages.summary, fieldErrors }
    : null;
}

export function validateCheckoutSubmission(
  formState: CheckoutSubmissionInput,
  availability: CheckoutAvailability,
  locale: "ar" | "en" = "ar",
) {
  const result = validateCheckoutSubmissionFields(formState, availability, locale);
  return result ? Object.values(result.fieldErrors)[0] ?? result.summary : null;
}
