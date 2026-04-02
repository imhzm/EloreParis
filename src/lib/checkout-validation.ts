import type { CheckoutRules } from "@/lib/fulfillment";
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

export function validateCheckoutSubmission(
  formState: CheckoutSubmissionInput,
  checkoutRules: CheckoutRules,
) {
  const normalizedPhone = formState.phone.replace(/\D/g, "");

  if (formState.fullName.trim().length < 4) {
    return "يرجى إدخال اسم واضح حتى يمكن ربط الطلب بمرجع قابل للمتابعة.";
  }

  if (normalizedPhone.length < 9) {
    return "رقم الجوال مطلوب بصيغة قابلة للتواصل وتتبع الحالة.";
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

  const selectedShipping = checkoutRules.shippingOptions.find(
    (option) => option.id === formState.shippingMethodId,
  );
  if (!selectedShipping?.enabled) {
    return (
      selectedShipping?.reason ??
      "خيار الشحن المختار غير متاح للمدينة أو لطبيعة عناصر السلة الحالية."
    );
  }

  const selectedPayment = checkoutRules.paymentOptions.find(
    (option) => option.id === formState.paymentMethodId,
  );
  if (!selectedPayment?.enabled) {
    return (
      selectedPayment?.reason ??
      "طريقة الدفع المختارة غير متاحة وفق قواعد التشغيل الحالية للطلب."
    );
  }

  return null;
}
