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

/**
 * Mail clients strip <style> and do not resolve CSS custom properties, so the
 * email templates cannot use the site's tokens — they inline raw hex. That is
 * the whole reason this check exists: a palette change lands in globals.css and
 * the mail silently keeps the old brand.
 *
 * Read the expected values OUT of globals.css rather than pinning them here.
 * Pinned literals are what let this rot: it asserted #491723 and #c9a67f for
 * however long the site had already moved on.
 */
function brandTokenFromGlobals(token) {
  const css = readFileSync("src/app/globals.css", "utf8");
  const value = new RegExp(`--elore-${token}:\\s*(#[0-9a-fA-F]{3,8})`).exec(css)?.[1];
  assert.ok(value, `--elore-${token} is not defined in src/app/globals.css`);
  return value;
}

const siteBurgundy = brandTokenFromGlobals("burgundy");
const siteChampagne = brandTokenFromGlobals("champagne");
const siteCocoa = brandTokenFromGlobals("cocoa");

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
  for (const [role, value] of [
    ["burgundy", siteBurgundy],
    ["champagne", siteChampagne],
    ["cocoa", siteCocoa],
  ]) {
    assert.ok(
      new RegExp(value, "iu").test(rendered.html),
      `The ${role} in this email does not match the site. globals.css says ` +
        `--elore-${role} is ${value}, and the rendered mail never uses it. ` +
        `Update BRAND in src/lib/lifecycle-email-templates.ts — mail clients ` +
        `cannot read CSS variables, so the value has to be inlined by hand and ` +
        `will not follow a palette change on its own.`,
    );
  }
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
