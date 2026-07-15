import type { Metadata } from "next";
import { localeConfig, type Locale } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/site-content";

export const searchPageCopy = {
  ar: {
    eyebrow: "SEARCH · WITH INTENT",
    title: "ابحثي عن السؤال.\nلا عن الضجيج.",
    intro: "بحث ثنائي اللغة يقودك إلى الفئة أو الروتين أو المكوّن أو الدليل الأقرب، من دون إظهار منتجات وأسعار قبل اعتمادها.",
    begin: "ابدئي البحث",
    concept: "النتائج الحالية تعليمية واستكشافية؛ الكتالوج التجاري ما زال خلف بوابة الاعتماد.",
    popularEyebrow: "STARTING POINTS",
    popularTitle: "مداخل قليلة.\nونتائج أوضح.",
    popularBody: "اختاري مدخلًا شائعًا أو اكتبي احتياجك بلغتك. لا نسجل نص الاستعلام داخل القياس.",
    mapEyebrow: "WHAT SEARCH READS",
    mapTitle: "ثلاث طبقات\nللقرار.",
    map: [
      ["01", "الفئة", "ابدئي من عالم الجمال والقوام وطريقة الاختيار."],
      ["02", "المسار", "انتقلي حسب الاحتياج أو الروتين أو المكوّن."],
      ["03", "المجلة", "اقرئي دليلًا مختصرًا قبل أي قرار تجاري."],
    ],
    resultsEyebrow: "SEARCH RESULTS",
    resultsTitle: "النتائج،\nمرتبة حسب النية.",
    startTitle: "اكتبي كلمة أو سؤالًا لتظهر المسارات المناسبة.",
    startBody: "جرّبي اسم فئة أو روتين أو مكوّن. البحث لا يعرض منتجات تجريبية أو روابط متوقفة.",
    zeroTitle: "لا توجد نتيجة واضحة لهذا الاستعلام.",
    zeroBody: "جرّبي عبارة أقصر أو أحد المداخل الشائعة. لن نخترع نتيجة فقط لملء الصفحة.",
    resultCount: "نتيجة",
    groupLabels: { collection: "الفئات", product: "المنتجات", concern: "حسب الاحتياج", ingredient: "المكوّنات", routine: "الروتينات", article: "المجلة" },
    closeEyebrow: "CATALOGUE GATE",
    closeTitle: "المعرفة الآن.\nالمنتج بعد الاعتماد.",
    closeBody: "تُضاف أسماء المنتجات والأسعار والمخزون فقط بعد اعتماد بيانات SKU والصور والسياسات التشغيلية.",
    closeCta: "استكشفي المتجر",
  },
  en: {
    eyebrow: "SEARCH · WITH INTENT",
    title: "Search the question.\nNot the noise.",
    intro: "A bilingual search that leads to the closest category, ritual, ingredient or guide without exposing products or prices before approval.",
    begin: "Begin searching",
    concept: "Current results are educational and exploratory; the commercial catalogue remains approval-gated.",
    popularEyebrow: "STARTING POINTS",
    popularTitle: "Fewer entries.\nClearer results.",
    popularBody: "Choose a common starting point or describe your need in your own language. Analytics never stores the query text.",
    mapEyebrow: "WHAT SEARCH READS",
    mapTitle: "Three layers\nof decision.",
    map: [
      ["01", "Category", "Begin with a beauty world, texture and way of choosing."],
      ["02", "Route", "Continue by concern, ritual or ingredient."],
      ["03", "Journal", "Read a concise guide before any commercial decision."],
    ],
    resultsEyebrow: "SEARCH RESULTS",
    resultsTitle: "Results,\nordered by intent.",
    startTitle: "Enter a word or question to reveal the relevant routes.",
    startBody: "Try a category, ritual or ingredient. Search excludes prototype products and retired links.",
    zeroTitle: "There is no clear result for this query.",
    zeroBody: "Try a shorter phrase or one of the starting points. We will not invent a result to fill the page.",
    resultCount: "results",
    groupLabels: { collection: "Categories", product: "Products", concern: "By concern", ingredient: "Ingredients", routine: "Rituals", article: "Journal" },
    closeEyebrow: "CATALOGUE GATE",
    closeTitle: "Knowledge now.\nProducts after approval.",
    closeBody: "Product names, prices and stock appear only after SKU data, imagery and operating policies are approved.",
    closeCta: "Explore the shop",
  },
} as const;

export function buildSearchMetadata(locale: Locale): Metadata {
  const copy = searchPageCopy[locale];
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/${locale}/search`;
  return {
    title: locale === "ar" ? "البحث داخل ÉLORÉ PARIS" : "Search ÉLORÉ PARIS",
    description: copy.intro,
    alternates: { canonical: url },
    robots: { index: false, follow: true },
    openGraph: { title: copy.title.replace("\n", " "), description: copy.intro, url, locale: localeConfig[locale].ogLocale, type: "website" },
    twitter: { card: "summary_large_image", title: copy.title.replace("\n", " "), description: copy.intro },
  };
}

export function buildSearchSchema(locale: Locale) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/${locale}/search`;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#page`,
    url,
    name: locale === "ar" ? "البحث داخل ÉLORÉ PARIS" : "Search ÉLORÉ PARIS",
    description: searchPageCopy[locale].intro,
    inLanguage: localeConfig[locale].htmlLang,
    isPartOf: { "@id": `${siteUrl}/#website` },
  };
}
