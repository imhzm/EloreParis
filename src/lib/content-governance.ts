export type ContentGovernanceArea =
  | "storefront"
  | "commerce"
  | "discovery"
  | "editorial"
  | "trust"
  | "support";

export type ContentGovernanceStatus =
  | "sample_based"
  | "awaiting_style_samples"
  | "awaiting_business_inputs";

export type ContentGovernanceEntry = {
  id: string;
  title: string;
  area: ContentGovernanceArea;
  status: ContentGovernanceStatus;
  owner: string;
  approver: string;
  routes: string[];
  freezeDecision: string;
  launchBlocker: string;
  nextApproval: string;
  requiredInputs: string[];
};

export type ContentGovernanceSummary = {
  totalSurfaces: number;
  totalRoutes: number;
  awaitingStyleSamples: number;
  sampleBased: number;
  awaitingBusinessInputs: number;
  ownersMapped: number;
  launchBlocked: number;
};

export const contentGovernanceEntries: ContentGovernanceEntry[] = [
  {
    id: "home-and-shop",
    title: "Home and shop atlas surfaces",
    area: "storefront",
    status: "sample_based",
    owner: "Founder / brand lead",
    approver: "Brand lead",
    // This register is exhaustive by construction — /ops/content reports
    // "named owners across N mapped public routes" and an operator signs off
    // against it — so a live route that appears in no entry is not merely
    // unlisted, it is reported green by omission. Perfumes was added as a
    // first-class category and leads the navigation; it belongs here with the
    // other editorial-mode collections.
    routes: ["/", "/shop", "/shop/perfumes", "/shop/haircare", "/shop/bodycare", "/shop/tools", "/shop/beauty-sets"],
    freezeDecision:
      "The IA, promise, copy, visual tokens, and motion direction are grounded in the 2026-07-14 ÉLORÉ PARIS handoff.",
    launchBlocker:
      "Concept imagery must be brand-approved and every product-facing scene must be replaced with approved SKU photography before commercial launch.",
    nextApproval:
      "Approve the concept campaign imagery and supply production product photography before launch.",
    requiredInputs: [
      "Brand approval for concept campaign imagery",
      "Production product and packaging photography",
      "Approved SKU data for every product-facing scene",
    ],
  },
  {
    id: "collections-and-products",
    title: "Collection, PDP, and conversion copy",
    area: "commerce",
    status: "awaiting_style_samples",
    owner: "Commerce owner",
    approver: "Commerce lead",
    // Locale-agnostic, like every other route here: /en/product/[slug] renders
    // from the same component as /ar and was covered by neither entry while the
    // path was baked to one locale.
    routes: ["/shop/skincare", "/shop/makeup", "/product/[slug]", "/cart", "/checkout"],
    freezeDecision:
      "Commerce structure, CRO blocks, and transactional UX are frozen. Product language remains intentionally safe and non-claim-heavy.",
    launchBlocker:
      "Needs approved product voice rules, benefits phrasing, and proof standards before public launch claims can be considered final.",
    nextApproval:
      "Approve PDP benefit phrasing, microcopy tone, and what qualifies as product proof versus editorial explanation.",
    requiredInputs: [
      "Three real PDP or product-description samples from the target brand style",
      "Approved rules for benefit claims versus clinical or regulatory claims",
      "Final merchant decisions on shipping, COD, and payment phrasing",
    ],
  },
  {
    id: "discovery-clusters",
    title: "Concern, routine, and ingredient discovery",
    area: "discovery",
    status: "awaiting_style_samples",
    owner: "SEO and content owner",
    approver: "Growth lead",
    routes: ["/concerns", "/concerns/pigmentation", "/routines", "/routines/morning-routine-oily-skin", "/ingredients", "/ingredients/vitamin-c"],
    freezeDecision:
      "The discovery graph and internal-linking logic are frozen. Answer-first content remains provisional until brand and SEO examples are approved together.",
    launchBlocker:
      "Needs sample-based tone plus approved SEO phrasing so cluster pages do not ship in a generic AI voice.",
    nextApproval:
      "Approve answer-first tone rules, topic depth, and the acceptable balance between conversion copy and educational intent.",
    requiredInputs: [
      "Two or three real Arabic educational or SEO-led beauty samples",
      "Approved keyword clusters that can become public copy",
      "Guidance on how assertive versus editorial the discovery pages should feel",
    ],
  },
  {
    id: "journal-and-editorial",
    title: "Journal, article, and educational storytelling",
    area: "editorial",
    status: "awaiting_style_samples",
    owner: "Editorial owner",
    approver: "Brand and content lead",
    routes: ["/journal", "/journal/niacinamide-vs-vitamin-c-which-fits-your-routine"],
    freezeDecision:
      "The article model, schema, and link graph are frozen. Editorial tone and evidence standards still need real examples before launch-ready publishing.",
    launchBlocker:
      "Needs sample-based editorial voice, proof expectations, and citation posture before scaling articles publicly.",
    nextApproval:
      "Approve article opening style, CTA restraint, and how expert the Arabic editorial voice should sound.",
    requiredInputs: [
      "Two or three approved editorial or blog samples",
      "Proof and citation standard for ingredient and skincare advice",
      "Decision on author identity, bylines, and editorial review ownership",
    ],
  },
  {
    id: "trust-and-legal",
    title: "Trust, legal, and compliance surfaces",
    area: "trust",
    status: "awaiting_business_inputs",
    owner: "Founder and legal owner",
    approver: "Legal reviewer",
    routes: ["/trust", "/trust/privacy", "/trust/shipping", "/trust/returns", "/trust/authenticity", "/terms"],
    freezeDecision:
      "The structure, linking, and policy shells are frozen. No page is final until real legal and operating data are supplied and reviewed.",
    launchBlocker:
      "Needs approved business details, policy language, and compliance signoff before any public launch claim is valid.",
    nextApproval:
      "Approve CR/VAT details, support channels, merchant policies, and the legal review pass for all trust surfaces.",
    requiredInputs: [
      "Approved company registration and VAT details",
      "Final shipping, return, and privacy policy language",
      "Named owner for legal review and last-mile compliance signoff",
    ],
  },
  {
    id: "support-and-brand",
    title: "About, FAQ, contact, and support guidance",
    area: "support",
    status: "awaiting_business_inputs",
    owner: "Support owner",
    approver: "Founder / operations lead",
    routes: ["/about", "/faq", "/contact", "/track-order"],
    freezeDecision:
      "The support architecture is frozen so users can find the right route quickly. Official channels and turnaround promises are still provisional.",
    launchBlocker:
      "Needs approved support channels, SLAs, escalation flow, and final company narrative inputs.",
    nextApproval:
      "Approve support-channel ownership, response expectations, and the final about-page narrative after business details are locked.",
    requiredInputs: [
      "Final support email, phone, WhatsApp, or contact method",
      "Named owner for reply windows and escalation handling",
      "Approved company story inputs and operating detail summary",
    ],
  },
];

export const contentSamplePackChecklist = [
  "Provide two or three real product-description or PDP samples that show how benefits should be phrased.",
  "Provide two or three real editorial or educational samples that define article tone and proof depth.",
  "Provide one support or service-response sample so FAQ and contact language can match the operating voice.",
];

export const contentApprovalRules = [
  "No public route is promoted from provisional to final without a named owner and approver.",
  "Style samples and business inputs are treated as separate launch gates. One does not replace the other.",
  "Trust, shipping, privacy, returns, contact, and company details remain non-final until the operating business data is approved.",
  "Editorial and commerce copy may be structurally complete but still blocked from launch if the brand voice has not been grounded in real samples.",
];

const areaLabels: Record<ContentGovernanceArea, string> = {
  storefront: "Storefront",
  commerce: "Commerce",
  discovery: "Discovery",
  editorial: "Editorial",
  trust: "Trust",
  support: "Support",
};

const statusLabels: Record<ContentGovernanceStatus, string> = {
  sample_based: "Sample-based",
  awaiting_style_samples: "Awaiting style samples",
  awaiting_business_inputs: "Awaiting business inputs",
};

export function getContentGovernanceAreaLabel(area: ContentGovernanceArea) {
  return areaLabels[area];
}

export function getContentGovernanceStatusLabel(status: ContentGovernanceStatus) {
  return statusLabels[status];
}

export function getContentGovernanceSummary() {
  const owners = new Set(contentGovernanceEntries.map((entry) => entry.owner));

  return {
    totalSurfaces: contentGovernanceEntries.length,
    totalRoutes: contentGovernanceEntries.reduce(
      (count, entry) => count + entry.routes.length,
      0,
    ),
    awaitingStyleSamples: contentGovernanceEntries.filter(
      (entry) => entry.status === "awaiting_style_samples",
    ).length,
    sampleBased: contentGovernanceEntries.filter(
      (entry) => entry.status === "sample_based",
    ).length,
    awaitingBusinessInputs: contentGovernanceEntries.filter(
      (entry) => entry.status === "awaiting_business_inputs",
    ).length,
    ownersMapped: owners.size,
    launchBlocked: contentGovernanceEntries.length,
  } satisfies ContentGovernanceSummary;
}
