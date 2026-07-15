import "server-only";

export type LifecycleEmailLocale = "ar" | "en";
export type LifecycleEmailDeliveryType =
  | "newsletter_confirmation"
  | "back_in_stock_available";

type LifecycleEmailBaseInput = {
  locale: LifecycleEmailLocale;
  siteUrl: string;
  unsubscribeUrl: string;
};

export type LifecycleEmailTemplateInput =
  | (LifecycleEmailBaseInput & {
      deliveryType: "newsletter_confirmation";
    })
  | (LifecycleEmailBaseInput & {
      deliveryType: "back_in_stock_available";
      productUrl: string;
    });

export type RenderedLifecycleEmail = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

type ValidatedLifecycleEmailInput =
  | {
      deliveryType: "newsletter_confirmation";
      locale: LifecycleEmailLocale;
      siteUrl: URL;
      unsubscribeUrl: URL;
    }
  | {
      deliveryType: "back_in_stock_available";
      locale: LifecycleEmailLocale;
      siteUrl: URL;
      unsubscribeUrl: URL;
      productUrl: URL;
    };

export class LifecycleEmailTemplateError extends Error {
  code: string;

  constructor(message: string, code = "lifecycle_email_template_invalid") {
    super(message);
    this.name = "LifecycleEmailTemplateError";
    this.code = code;
  }
}

const BRAND = {
  burgundy: "#491723",
  champagne: "#c9a67f",
  ivory: "#fffdfc",
  ink: "#21151a",
  muted: "#725b60",
} as const;

const copy = {
  ar: {
    newsletter_confirmation: {
      subject: "تم تأكيد اشتراكك في رسائل ÉLORÉ PARIS",
      preheader: "تم تسجيل اختيارك، ويمكنك إلغاء الاشتراك في أي وقت.",
      eyebrow: "تأكيد الاشتراك",
      title: "أهلًا بكِ في رسائل ÉLORÉ PARIS.",
      body: "تم تسجيل اختيارك لاستلام رسائلنا عبر البريد الإلكتروني.",
      detail: "سنرسل فقط تحديثات ÉLORÉ PARIS المرتبطة بهذا الاشتراك.",
      action: "زيارة ÉLORÉ PARIS",
    },
    back_in_stock_available: {
      subject: "المنتج الذي تتابعينه متاح الآن",
      preheader: "راجعي حالة المنتج الذي طلبتِ إشعارًا بعودته.",
      eyebrow: "العودة للمخزون",
      title: "المنتج الذي تتابعينه متاح للمراجعة.",
      body: "وصلنا تحديث بأن المنتج الذي طلبتِ إشعارًا بعودته متاح الآن.",
      detail: "قد تتغير حالة المخزون قبل إتمام الطلب.",
      action: "مراجعة المنتج",
    },
    unsubscribeLead: "لا ترغبين في استلام هذه الرسائل؟",
    unsubscribeAction: "إلغاء الاشتراك",
    unsubscribeNote: "يمكنك إلغاء الاشتراك مجانًا في أي وقت.",
    footer: "رسالة تشغيلية من ÉLORÉ PARIS.",
  },
  en: {
    newsletter_confirmation: {
      subject: "Your ÉLORÉ PARIS email subscription is confirmed",
      preheader: "Your choice has been recorded. You can unsubscribe at any time.",
      eyebrow: "Subscription confirmed",
      title: "Welcome to ÉLORÉ PARIS emails.",
      body: "Your choice to receive our emails has been recorded.",
      detail: "We will only send ÉLORÉ PARIS updates connected to this subscription.",
      action: "Visit ÉLORÉ PARIS",
    },
    back_in_stock_available: {
      subject: "The item you requested is available",
      preheader: "Review the availability of the item you asked us to monitor.",
      eyebrow: "Back in stock",
      title: "The item you requested is available to review.",
      body: "We received an update that the item you asked us to monitor is available.",
      detail: "Availability may change before an order is completed.",
      action: "Review the item",
    },
    unsubscribeLead: "Prefer not to receive these emails?",
    unsubscribeAction: "Unsubscribe",
    unsubscribeNote: "You can unsubscribe free of charge at any time.",
    footer: "An operational message from ÉLORÉ PARIS.",
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertExactKeys(value: Record<string, unknown>, allowedKeys: string[]) {
  const allowed = new Set(allowedKeys);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new LifecycleEmailTemplateError(
      "Lifecycle email input contains unsupported fields.",
      "lifecycle_email_fields_invalid",
    );
  }
}

function readAbsoluteHttpsUrl(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim() || value.length > 2_048) {
    throw new LifecycleEmailTemplateError(
      `${field} must be an absolute verified URL.`,
      "lifecycle_email_url_invalid",
    );
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new LifecycleEmailTemplateError(
      `${field} must be an absolute verified URL.`,
      "lifecycle_email_url_invalid",
    );
  }

  if (url.protocol !== "https:" || url.username || url.password) {
    throw new LifecycleEmailTemplateError(
      `${field} must use HTTPS without embedded credentials.`,
      "lifecycle_email_url_unverified",
    );
  }
  return url;
}

function assertSameOrigin(url: URL, siteUrl: URL, field: string) {
  if (url.origin !== siteUrl.origin) {
    throw new LifecycleEmailTemplateError(
      `${field} must use the verified site origin.`,
      "lifecycle_email_origin_invalid",
    );
  }
}

function validateInput(input: LifecycleEmailTemplateInput): ValidatedLifecycleEmailInput {
  if (!isRecord(input)) {
    throw new LifecycleEmailTemplateError("Lifecycle email input must be an object.");
  }
  if (input.locale !== "ar" && input.locale !== "en") {
    throw new LifecycleEmailTemplateError("Lifecycle email locale is invalid.");
  }
  if (
    input.deliveryType !== "newsletter_confirmation" &&
    input.deliveryType !== "back_in_stock_available"
  ) {
    throw new LifecycleEmailTemplateError("Lifecycle email delivery type is invalid.");
  }

  const isBackInStock = input.deliveryType === "back_in_stock_available";
  assertExactKeys(input, [
    "deliveryType",
    "locale",
    "siteUrl",
    "unsubscribeUrl",
    ...(isBackInStock ? ["productUrl"] : []),
  ]);

  const siteUrl = readAbsoluteHttpsUrl(input.siteUrl, "siteUrl");
  const expectedSitePath = `/${input.locale}`;
  if (
    siteUrl.search ||
    siteUrl.hash ||
    ![expectedSitePath, `${expectedSitePath}/`].includes(siteUrl.pathname)
  ) {
    throw new LifecycleEmailTemplateError(
      "siteUrl must target the verified localized home page.",
      "lifecycle_email_site_url_invalid",
    );
  }

  const unsubscribeUrl = readAbsoluteHttpsUrl(input.unsubscribeUrl, "unsubscribeUrl");
  assertSameOrigin(unsubscribeUrl, siteUrl, "unsubscribeUrl");
  if (
    unsubscribeUrl.pathname !== `/${input.locale}/unsubscribe` ||
    unsubscribeUrl.search ||
    !/^#token=[A-Za-z0-9._~%-]{16,}$/u.test(unsubscribeUrl.hash)
  ) {
    throw new LifecycleEmailTemplateError(
      "unsubscribeUrl must be the verified localized unsubscribe link.",
      "lifecycle_email_unsubscribe_url_invalid",
    );
  }

  if (!isBackInStock) {
    return {
      deliveryType: input.deliveryType,
      locale: input.locale,
      siteUrl,
      unsubscribeUrl,
    };
  }

  const productUrl = readAbsoluteHttpsUrl(input.productUrl, "productUrl");
  assertSameOrigin(productUrl, siteUrl, "productUrl");
  if (
    productUrl.search ||
    productUrl.hash ||
    !new RegExp(`^/${input.locale}/product/[a-z0-9][a-z0-9-]{0,159}$`, "u").test(
      productUrl.pathname,
    )
  ) {
    throw new LifecycleEmailTemplateError(
      "productUrl must target a verified localized product page.",
      "lifecycle_email_product_url_invalid",
    );
  }

  return {
    deliveryType: input.deliveryType,
    locale: input.locale,
    siteUrl,
    unsubscribeUrl,
    productUrl,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function renderLifecycleEmail(
  input: LifecycleEmailTemplateInput,
): RenderedLifecycleEmail {
  const validated = validateInput(input);
  const localeCopy = copy[validated.locale];
  const message = localeCopy[validated.deliveryType];
  const isArabic = validated.locale === "ar";
  const direction = isArabic ? "rtl" : "ltr";
  const actionUrl =
    validated.deliveryType === "back_in_stock_available"
      ? validated.productUrl
      : validated.siteUrl;
  const safeActionUrl = escapeHtml(actionUrl.toString());
  const safeUnsubscribeUrl = escapeHtml(validated.unsubscribeUrl.toString());

  const html = `<!doctype html>
<html lang="${validated.locale}" dir="${direction}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(message.subject)}</title>
  </head>
  <body style="margin:0;background:${BRAND.ivory};color:${BRAND.ink};font-family:Georgia,'Times New Roman',serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(message.preheader)}</div>
    <div role="article" aria-label="${escapeHtml(message.subject)}" lang="${validated.locale}" dir="${direction}" style="max-width:640px;margin:0 auto;padding:32px 20px;">
      <header style="padding:24px;background:${BRAND.burgundy};color:${BRAND.ivory};text-align:${isArabic ? "right" : "left"};">
        <p style="margin:0;color:${BRAND.champagne};font-size:13px;letter-spacing:0.16em;">ÉLORÉ PARIS</p>
      </header>
      <main style="padding:40px 28px;background:#ffffff;text-align:${isArabic ? "right" : "left"};">
        <p style="margin:0 0 12px;color:${BRAND.muted};font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(message.eyebrow)}</p>
        <h1 style="margin:0 0 20px;color:${BRAND.burgundy};font-size:32px;line-height:1.25;">${escapeHtml(message.title)}</h1>
        <p style="margin:0 0 12px;font-size:17px;line-height:1.75;">${escapeHtml(message.body)}</p>
        <p style="margin:0 0 28px;color:${BRAND.muted};font-size:15px;line-height:1.7;">${escapeHtml(message.detail)}</p>
        <p style="margin:0;">
          <a href="${safeActionUrl}" style="display:inline-block;padding:13px 20px;background:${BRAND.burgundy};color:${BRAND.ivory};font-weight:700;text-decoration:none;">${escapeHtml(message.action)}</a>
        </p>
      </main>
      <footer style="padding:24px 28px;border-top:3px solid ${BRAND.champagne};background:#f3f0ea;color:${BRAND.muted};text-align:${isArabic ? "right" : "left"};font-family:Arial,sans-serif;font-size:13px;line-height:1.7;">
        <p style="margin:0 0 8px;">${escapeHtml(localeCopy.unsubscribeLead)} <a href="${safeUnsubscribeUrl}" style="color:${BRAND.burgundy};font-weight:700;">${escapeHtml(localeCopy.unsubscribeAction)}</a></p>
        <p style="margin:0 0 8px;">${escapeHtml(localeCopy.unsubscribeNote)}</p>
        <p style="margin:0;">${escapeHtml(localeCopy.footer)}</p>
      </footer>
    </div>
  </body>
</html>`;

  const text = [
    "ÉLORÉ PARIS",
    message.title,
    "",
    message.body,
    message.detail,
    "",
    `${message.action}: ${actionUrl.toString()}`,
    "",
    `${localeCopy.unsubscribeLead} ${localeCopy.unsubscribeAction}: ${validated.unsubscribeUrl.toString()}`,
    localeCopy.unsubscribeNote,
    localeCopy.footer,
  ].join("\n");

  return {
    subject: message.subject,
    preheader: message.preheader,
    html,
    text,
  };
}
