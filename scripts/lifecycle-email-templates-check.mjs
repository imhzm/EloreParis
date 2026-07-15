import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function compileModule(source) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

const source = readFileSync("src/lib/lifecycle-email-templates.ts", "utf8");
const templates = await compileModule(source.replace('import "server-only";', ""));
const token = "signed-unsubscribe-token-1234567890";

const cases = [
  {
    input: {
      deliveryType: "newsletter_confirmation",
      locale: "ar",
      siteUrl: "https://elore.example/ar",
      unsubscribeUrl: `https://elore.example/ar/unsubscribe#token=${token}`,
    },
    snapshot: {
      subject: "تم تأكيد اشتراكك في رسائل ÉLORÉ PARIS",
      direction: "rtl",
      action: "زيارة ÉLORÉ PARIS",
    },
  },
  {
    input: {
      deliveryType: "newsletter_confirmation",
      locale: "en",
      siteUrl: "https://elore.example/en",
      unsubscribeUrl: `https://elore.example/en/unsubscribe#token=${token}`,
    },
    snapshot: {
      subject: "Your ÉLORÉ PARIS email subscription is confirmed",
      direction: "ltr",
      action: "Visit ÉLORÉ PARIS",
    },
  },
  {
    input: {
      deliveryType: "back_in_stock_available",
      locale: "ar",
      siteUrl: "https://elore.example/ar",
      unsubscribeUrl: `https://elore.example/ar/unsubscribe#token=${token}`,
      productUrl: "https://elore.example/ar/product/verified-product",
    },
    snapshot: {
      subject: "المنتج الذي تتابعينه متاح الآن",
      direction: "rtl",
      action: "مراجعة المنتج",
    },
  },
  {
    input: {
      deliveryType: "back_in_stock_available",
      locale: "en",
      siteUrl: "https://elore.example/en",
      unsubscribeUrl: `https://elore.example/en/unsubscribe#token=${token}`,
      productUrl: "https://elore.example/en/product/verified-product",
    },
    snapshot: {
      subject: "The item you requested is available",
      direction: "ltr",
      action: "Review the item",
    },
  },
];

for (const { input, snapshot } of cases) {
  const rendered = templates.renderLifecycleEmail(input);
  assert.deepEqual(
    {
      subject: rendered.subject,
      direction: /<html[^>]+dir="([^"]+)"/u.exec(rendered.html)?.[1],
      action: new RegExp(`>${snapshot.action}<`, "u").test(rendered.html)
        ? snapshot.action
        : null,
    },
    snapshot,
  );
  assert.match(rendered.html, /^<!doctype html>/u);
  assert.match(rendered.html, /<(?:header|main|footer)\b/gu);
  assert.match(rendered.html, /#491723/iu);
  assert.match(rendered.html, /#c9a67f/iu);
  assert.ok(rendered.text.includes(input.unsubscribeUrl));
  assert.ok(rendered.text.includes(input.productUrl ?? input.siteUrl));

  const links = [...rendered.html.matchAll(/href="([^"]+)"/gu)].map((match) => match[1]);
  assert.equal(links.length, 2);
  for (const link of links) {
    const url = new URL(link.replaceAll("&amp;", "&"));
    assert.equal(url.protocol, "https:");
    assert.equal(url.origin, "https://elore.example");
  }
  assert.doesNotMatch(
    `${rendered.subject}\n${rendered.preheader}\n${rendered.html}\n${rendered.text}`,
    /\b(?:SAR|USD)\b|\bريال\b|ر(?:\.|\s)س|guarantee|clinically proven/iu,
  );
}

assert.throws(
  () =>
    templates.renderLifecycleEmail({
      ...cases[0].input,
      siteUrl: "http://elore.example/ar",
    }),
  (error) => error.code === "lifecycle_email_url_unverified",
);
assert.throws(
  () =>
    templates.renderLifecycleEmail({
      ...cases[1].input,
      unsubscribeUrl: `https://attacker.example/en/unsubscribe#token=${token}`,
    }),
  (error) => error.code === "lifecycle_email_origin_invalid",
);
assert.throws(
  () =>
    templates.renderLifecycleEmail({
      ...cases[2].input,
      productUrl: "https://elore.example/ar/shop/verified-product",
    }),
  (error) => error.code === "lifecycle_email_product_url_invalid",
);
assert.throws(
  () => templates.renderLifecycleEmail({ ...cases[3].input, price: "99 SAR" }),
  (error) => error.code === "lifecycle_email_fields_invalid",
);

assert.doesNotMatch(source, /provider-gateway|fetch\s*\(|nodemailer|resend|sendgrid/iu);
console.log("Lifecycle email AR/EN semantic HTML, text, URL, and copy snapshots passed.");
