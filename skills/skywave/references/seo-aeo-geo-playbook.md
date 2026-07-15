# SEO, AEO, and GEO Playbook

Use this playbook for public-facing websites, content systems, local-business surfaces, and product marketing pages.

## Definitions

- SEO: traditional search optimization for crawlability, relevance, structure, metadata, internal linking, and content depth
- AEO: answer engine optimization for direct-answer surfaces, FAQ extraction, featured snippets, and machine-readable answers
- GEO: use both meanings depending on project type
  - generative engine optimization for AI answer engines and LLM retrieval
  - local or geographic optimization for region, city, service area, and map intent

## Starting Questions

Determine:

- market and language
- global, regional, or local intent
- primary entity:
  - organization
  - local business
  - person
  - service
  - product
  - software application
- whether the site needs blog, FAQ, location pages, or author surfaces

## Page-to-Page Schema Matrix

Apply only the schema types the page genuinely supports.

| Surface | Default schema | Conditional additions |
| --- | --- | --- |
| Home | `WebSite`, `WebPage`, `Organization` or `LocalBusiness`, `BreadcrumbList` | `FAQPage` if there is a real FAQ block, `SearchAction` if site search exists |
| About | `AboutPage`, `Organization` or `Person`, `BreadcrumbList` | `FAQPage` only if real questions exist |
| Service page | `Service`, `WebPage`, `BreadcrumbList` | `FAQPage`, `Review` when reviews are real and attributable |
| Product page | `Product` or `SoftwareApplication`, `WebPage`, `BreadcrumbList` | `Offer`, `FAQPage`, `Review` when supported |
| Pricing page | `WebPage`, `BreadcrumbList` | `Offer`, `Product`, or `SoftwareApplication` when pricing is tied to a concrete offer |
| Blog index | `CollectionPage`, `BreadcrumbList` | `WebSite` only if relevant at site level, not per-page duplication |
| Blog article | `Article` or `BlogPosting`, `Person`, `BreadcrumbList` | `FAQPage` if there is a real FAQ section |
| FAQ page | `FAQPage`, `WebPage`, `BreadcrumbList` | none unless another entity is clearly central |
| Contact page | `ContactPage`, `Organization` or `LocalBusiness`, `BreadcrumbList` | local contact details when applicable |
| Local landing page | `LocalBusiness` or `Service`, `WebPage`, `BreadcrumbList` | location data, service area details, local reviews when real |

## Entity Strategy

Define the site's core entities clearly:

- primary organization or brand
- people or authors
- products or services
- locations or service areas
- supporting topics and problem spaces

Keep naming consistent across:

- page titles
- H1s
- metadata
- schema entities
- body copy
- internal links

## AEO and Generative Optimization

Prefer:

- answer-first sections under explicit headings
- concise definitions early in pages
- FAQ blocks only when grounded in real user intent
- direct, quotable statements
- strong entity repetition without spam
- clean tables, lists, and comparisons when useful
- author or brand credibility where relevant

Avoid:

- fluffy intros before the answer
- vague marketing language instead of specific claims
- FAQ padding just to force schema

## Local and Geographic Signals

For local or regional projects, strengthen:

- consistent name, address, phone details when real
- city and service area language
- local proof and location specificity
- local landing pages only when each page has distinct value
- alignment between visible content and structured data

## Default Deliverables

For public-facing projects, produce:

- keyword and intent map
- entity map
- schema inventory by page type
- metadata approach
- internal linking direction
- FAQ logic only where justified
- local signal plan when geographic intent exists
