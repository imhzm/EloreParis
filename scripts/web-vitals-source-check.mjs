import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");

const analytics = read("src/lib/analytics.ts");
const reporter = read("src/components/web-vitals-reporter.tsx");
const storefrontLayout = read("src/app/(storefront)/[locale]/layout.tsx");
const systemLayout = read("src/app/(system)/layout.tsx");

assert.match(analytics, /\| "web_vital"/);
assert.match(analytics, /export type WebVitalEventProperties = \{[\s\S]*?name: WebVitalName;[\s\S]*?id: string;[\s\S]*?value: number;[\s\S]*?delta: number;[\s\S]*?rating: WebVitalRating;[\s\S]*?navigationType\?: WebVitalNavigationType;[\s\S]*?\};/);
assert.match(analytics, /WEB_VITAL_PROPERTY_KEYS = new Set\(\[[\s\S]*?"name"[\s\S]*?"id"[\s\S]*?"value"[\s\S]*?"delta"[\s\S]*?"rating"[\s\S]*?"navigationType"[\s\S]*?\]\)/);
assert.match(analytics, /typeof window === "undefined" \|\| !hasAnalyticsConsent\(\)/);
assert.match(analytics, /eventName === "web_vital"[\s\S]*?!isWebVitalEventProperties/);
assert.match(analytics, /typeof properties\.navigationType === "string" &&[\s\S]*?isWebVitalNavigationType\(properties\.navigationType\)/);

assert.match(reporter, /import \{ useReportWebVitals \} from "next\/web-vitals"/);
assert.match(reporter, /const reportedWebVitalIds = new Set<string>\(\)/);
assert.match(reporter, /function reportWebVital\([\s\S]*?reportedWebVitalIds\.has\(properties\.id\)[\s\S]*?trackAnalyticsEvent\("web_vital", properties\)[\s\S]*?reportedWebVitalIds\.add\(properties\.id\)/);
assert.match(reporter, /useReportWebVitals\(reportWebVital\)/);
assert.doesNotMatch(reporter, /fetch\(|sendBeacon|XMLHttpRequest|axios|email|phone|userId/i);

assert.equal((storefrontLayout.match(/<WebVitalsReporter \/>/g) ?? []).length, 1);
assert.doesNotMatch(systemLayout, /WebVitalsReporter/);

console.log("Consent-aware storefront Web Vitals source contract passed.");
