import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const baseUrl = process.env.OPS_TEST_BASE_URL ?? "http://127.0.0.1:3056";
const opsAccessCode = process.env.OPS_TEST_ACCESS_CODE?.trim();
const outputDirectory = "test-results/ops-dashboard";
const desktopRoutes = [
  ["overview", "/ops", "نظرة عامة"],
  ["orders", "/ops/orders", "الطلبات"],
  ["customers", "/ops/customers", "العملاء"],
  ["analytics", "/ops/analytics?period=30", "التحليلات"],
  ["catalog", "/ops/catalog", "الكتالوج والمخزون"],
  ["promotions", "/ops/promotions", "العروض والكوبونات"],
  ["fulfillment", "/ops/fulfillment", "التنفيذ والشحن"],
  ["content", "/ops/content", "المحتوى"],
  ["notifications", "/ops/notifications", "الإشعارات"],
  ["audit", "/ops/audit", "سجل النشاط"],
  ["release", "/ops/release", "جاهزية الإطلاق"],
  ["settings", "/ops/settings", "الإعدادات"],
];

function attachErrorCollectors(
  page,
  consoleErrors,
  pageErrors,
  failedRequests,
) {
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "unknown failure";
    const requestUrl = new URL(request.url());
    const isCancelledNextPrefetch =
      request.method() === "GET" &&
      requestUrl.searchParams.has("_rsc") &&
      failure.includes("ERR_ABORTED");

    if (isCancelledNextPrefetch) return;

    failedRequests.push(
      `${request.method()} ${request.url()}: ${failure}`,
    );
  });
}

async function assertNoDocumentOverflow(page, routeName) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  assert.ok(
    dimensions.scrollWidth <= dimensions.clientWidth + 2,
    `${routeName} has document-level horizontal overflow: ${JSON.stringify(dimensions)}`,
  );
}

async function assertVisible(locator, message) {
  await locator.waitFor({ state: "visible" });
  assert.ok(await locator.isVisible(), message);
}

async function navigate(page, pathname) {
  const response = await page.goto(`${baseUrl}${pathname}`, {
    waitUntil: "load",
  });

  try {
    await page.waitForLoadState("networkidle", { timeout: 5_000 });
  } catch {
    // Next.js can keep route prefetches in flight after the document is fully
    // interactive. The route-specific landmarks below remain the readiness gate.
  }

  return response;
}

async function authenticateContext(context) {
  if (!opsAccessCode) return;

  const response = await context.request.post(
    `${baseUrl}/api/ops-access/login`,
    {
      headers: { Origin: baseUrl },
      data: { accessCode: opsAccessCode, nextPath: "/ops" },
    },
  );
  assert.equal(
    response.status(),
    200,
    `Protected browser login returned ${response.status()}`,
  );
}

async function testDesktop(browser) {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: "ar-SA",
    colorScheme: "light",
  });
  await authenticateContext(context);
  const page = await context.newPage();
  attachErrorCollectors(page, consoleErrors, pageErrors, failedRequests);

  for (const [routeName, pathname, activeLabel] of desktopRoutes) {
    const response = await navigate(page, pathname);
    assert.equal(response?.status(), 200, `${pathname} did not return 200`);
    const navigation = page.getByRole("navigation", {
      name: "أقسام لوحة التحكم",
    });
    await assertVisible(navigation, `${pathname} has no operations navigation`);
    await assertVisible(
      navigation.getByText(activeLabel, { exact: true }),
      `${pathname} did not expose its active navigation item`,
    );
    await assertVisible(
      page.locator("main#main-content"),
      `${pathname} has no main landmark`,
    );
    await assertNoDocumentOverflow(page, routeName);

    if (["overview", "customers", "analytics", "settings"].includes(routeName)) {
      await page.screenshot({
        path: `${outputDirectory}/desktop-${routeName}.png`,
        fullPage: true,
      });
    }
  }

  await navigate(page, "/ops/customers");
  await page
    .getByRole("searchbox", { name: "البحث في العملاء والطلبات" })
    .fill("customer-that-does-not-exist");
  await Promise.all([
    page.waitForURL(/\/ops\/customers\?q=/),
    page.getByRole("button", { name: "بحث" }).click(),
  ]);
  await assertVisible(
    page.getByText("لا توجد نتائج مطابقة", { exact: true }),
    "Customer search did not render its empty state",
  );

  await navigate(page, "/ops/analytics");
  await page.getByLabel("الفترة").selectOption("7");
  await Promise.all([
    page.waitForURL(/\/ops\/analytics\?period=7/),
    page.getByRole("button", { name: "تحديث" }).click(),
  ]);
  assert.equal(await page.getByLabel("الفترة").inputValue(), "7");

  await navigate(page, "/ops/settings");
  const settingsText = await page.locator("main").innerText();
  assert.ok(!settingsText.includes("passwordHash"));
  assert.ok(!settingsText.includes("accessCode"));
  assert.ok(!settingsText.includes("OPS_ACCESS_SIGNING_SECRET="));

  await context.close();
  assert.deepEqual(consoleErrors, [], `Console errors: ${consoleErrors.join("\n")}`);
  assert.deepEqual(pageErrors, [], `Page errors: ${pageErrors.join("\n")}`);
  assert.deepEqual(
    failedRequests,
    [],
    `Failed requests: ${failedRequests.join("\n")}`,
  );
}

async function testMobile(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "ar-SA",
    colorScheme: "light",
  });
  await authenticateContext(context);
  const page = await context.newPage();
  await navigate(page, "/ops/customers");

  const menuButton = page.getByRole("button", {
    name: "فتح قائمة لوحة التحكم",
  });
  await assertVisible(menuButton, "Mobile menu button is not visible");
  await menuButton.click();
  const sidebar = page.locator("#ops-sidebar");
  const openBox = await sidebar.boundingBox();
  assert.ok(openBox && openBox.x < 390 && openBox.x + openBox.width > 0);
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "إغلاق قائمة لوحة التحكم",
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "فتح قائمة لوحة التحكم",
  );
  const closedBox = await sidebar.boundingBox();
  assert.ok(closedBox && (closedBox.x >= 390 || closedBox.x + closedBox.width <= 0));
  await assertNoDocumentOverflow(page, "mobile-customers");
  await page.screenshot({
    path: `${outputDirectory}/mobile-customers.png`,
    fullPage: true,
  });

  await context.close();
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  await testDesktop(browser);
  await testMobile(browser);
  console.log("Ops dashboard browser regression passed.");
} finally {
  await browser.close();
}
