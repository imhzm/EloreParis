import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");
const arabicText = /[\u0600-\u06ff]/;

const cartSurface = read("src/components/cart-surface.tsx");
const cartProvider = read("src/components/cart-provider.tsx");
const checkoutReview = read("src/components/checkout-review.tsx");
const checkoutValidation = read("src/lib/checkout-validation.ts");

const cartRenderPath = cartSurface.slice(cartSurface.indexOf("export function CartSurface"));
const checkoutRenderPath = checkoutReview.slice(checkoutReview.indexOf("export function CheckoutReview"));

assert.ok(cartRenderPath.length > 0, "CartSurface export must exist");
assert.ok(checkoutRenderPath.length > 0, "CheckoutReview export must exist");
assert.doesNotMatch(cartRenderPath, arabicText, "Cart render path must select localized copy instead of embedding Arabic text");
assert.doesNotMatch(checkoutRenderPath, arabicText, "Checkout render path must select localized copy instead of embedding Arabic text");

assert.match(cartSurface, /const copy = cartCopy\[locale\]/);
assert.match(cartSurface, /locale === "en" \? collectionDirectory\[line\.product\.collection\]\.subtitle/);
assert.match(cartSurface, /copy\.policyLabels\[link\.href\]/);
assert.match(cartProvider, /locale === "en"\s*\? "Unable to load the approved product catalog\."/);

assert.match(checkoutReview, /const copy = checkoutCopy\[locale\]/);
assert.match(checkoutReview, /shippingChoices\[locale\]\.map/);
assert.match(checkoutReview, /paymentLabels\[locale\]\[option\.id\]/);
assert.match(checkoutReview, /quoteErrorMessage\([^,]+, locale\)/);
assert.match(checkoutReview, /validateCheckoutSubmissionFields\([\s\S]*?locale,\s*\)/);
assert.match(checkoutReview, /new Intl\.NumberFormat\(locale === "en" \? "en-SA" : "ar-SA"/);
assert.match(checkoutReview, /role="alert"[\s\S]*?data-checkout-error/);
assert.match(checkoutReview, /setFieldErrors\(validation\.fieldErrors\)/);
assert.match(checkoutReview, /data-checkout-invalid="true"/);
assert.ok((checkoutReview.match(/aria-invalid=/g) ?? []).length >= 9, "Every validated checkout control must expose aria-invalid");
assert.ok((checkoutReview.match(/aria-describedby=/g) ?? []).length >= 9, "Every validated checkout control must reference its field error");

for (const errorId of [
  "checkout-full-name-error",
  "checkout-phone-error",
  "checkout-email-error",
  "checkout-city-error",
  "checkout-district-error",
  "checkout-address-error",
  "checkout-shipping-error",
  "checkout-payment-error",
  "checkout-policies-error",
]) {
  assert.ok(checkoutReview.includes(`id="${errorId}"`), `${errorId} must exist`);
  assert.ok(checkoutReview.includes(`"${errorId}" : undefined`), `${errorId} must be referenced conditionally`);
}

assert.match(checkoutValidation, /locale: "ar" \| "en" = "ar"/);
assert.match(checkoutValidation, /const messages = locale === "en" \?/);
assert.match(checkoutValidation, /summary: "Review the highlighted fields before placing your order\."/);
assert.match(checkoutValidation, /summary: "راجعي الحقول الموضحة قبل إنشاء الطلب\."/);
assert.match(checkoutValidation, /fieldErrors\.fullName = messages\.fullName/);
assert.match(checkoutValidation, /fieldErrors\.phone = messages\.phone/);
assert.match(checkoutValidation, /fieldErrors\.city = messages\.city/);
assert.match(checkoutValidation, /fieldErrors\.district = messages\.district/);
assert.match(checkoutValidation, /fieldErrors\.addressLine = messages\.address/);
assert.match(checkoutValidation, /fieldErrors\.email = messages\.email/);
assert.match(checkoutValidation, /fieldErrors\.acceptPolicies = messages\.policies/);
assert.match(checkoutValidation, /fieldErrors\.shippingMethodId = messages\.shipping/);
assert.match(checkoutValidation, /fieldErrors\.paymentMethodId = messages\.payment/);
assert.match(checkoutValidation, /export function validateCheckoutSubmission\(/, "Legacy summary validator must remain available");

console.log("Cart and checkout localization plus checkout field accessibility source checks passed.");
