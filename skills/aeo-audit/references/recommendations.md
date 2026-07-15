# AEO Audit — Recommendations Catalog

All recommendations sorted by ROI score (impact ÷ difficulty). Higher ROI = show first.

**ROI Score** = impact points / difficulty multiplier (easy=1, medium=2, hard=3)

---

## Trigger Logic

Only include a recommendation when its trigger condition is met. Never include a recommendation
that doesn't apply to the site being audited.

---

## AI Access Recommendations

### R01 — Unblock Critical AI Crawlers
- **Trigger:** Any of GPTBot, ClaudeBot, PerplexityBot, Google-Extended has access_level = "blocked"
- **Priority:** HIGH
- **Impact:** 15 pts | **Difficulty:** Easy | **ROI:** 10
- **Time:** 10 minutes
- **Description:** Critical AI bots are blocked in robots.txt. These bots are responsible for indexing
  your content for ChatGPT, Claude, and Perplexity. Blocking them means your content cannot be
  cited or referenced by these AI systems.
- **Code example:**
```
# Add to your robots.txt file:

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /
```

### R02 — Review Partial Bot Access
- **Trigger:** Any critical bot has access_level = "partial" or "limited"
- **Priority:** MEDIUM
- **Impact:** 8 pts | **Difficulty:** Easy | **ROI:** 6
- **Time:** 15 minutes
- **Description:** Some AI bots have restricted access to parts of your site. Review the blocked
  paths to ensure your most important content (blog, services, about) is accessible.
- **Code example:** None (site-specific, review manually)

### R03 — Add llms.txt
- **Trigger:** llms.txt NOT FOUND
- **Priority:** LOW
- **Impact:** 5 pts | **Difficulty:** Easy | **ROI:** 5
- **Time:** 15 minutes
- **Description:** llms.txt is an emerging standard that lets you provide structured context
  for AI crawlers — descriptions, key pages, and instructions. Early adopters may get
  preferential indexing as this standard matures.
- **Code example:**
```
# /llms.txt — AI Crawler Instructions
# See https://llmstxt.org/ for specification

# Site description
> Company Name — Brief description of what your company does
> Focus: [your main topics/services]

# Key pages for AI to understand your business
## Important Pages
- /about: About the company
- /services: Our services
- /blog: Articles and resources
- /contact: Contact information
```

---

## Structured Data Recommendations

### R04 — Add JSON-LD Structured Data
- **Trigger:** has_json_ld = false
- **Priority:** HIGH
- **Impact:** 20 pts | **Difficulty:** Medium | **ROI:** 8
- **Time:** 1-2 hours
- **Description:** Your site has no JSON-LD markup. Structured data is how AI systems understand
  what your site is about, who owns it, and how to attribute content. Without it, AI systems
  must guess your entity identity and may miscite or skip your content entirely.
- **Code example:**
```html
<!-- Add inside <head> tag -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company Name",
  "url": "https://yoursite.com",
  "logo": "https://yoursite.com/logo.png",
  "description": "Brief description of your organization",
  "sameAs": [
    "https://twitter.com/yourcompany",
    "https://linkedin.com/company/yourcompany"
  ]
}
</script>
```

### R05 — Add Organization Schema
- **Trigger:** has_json_ld = true AND "Organization" in recommended_missing
- **Priority:** HIGH
- **Impact:** 10 pts | **Difficulty:** Easy | **ROI:** 8
- **Time:** 30 minutes
- **Description:** Organization schema establishes your entity identity for AI systems. It helps
  ChatGPT, Claude, and Perplexity know who you are, what you do, and how to correctly attribute
  information to your brand. This is foundational for AEO.
- **Code example:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company Name",
  "url": "https://yoursite.com",
  "logo": "https://yoursite.com/logo.png",
  "description": "What your company does in 1-2 sentences",
  "foundingDate": "2020",
  "sameAs": [
    "https://twitter.com/yourcompany",
    "https://linkedin.com/company/yourcompany",
    "https://facebook.com/yourcompany"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "hello@yoursite.com"
  }
}
```

### R06 — Add FAQPage Schema
- **Trigger:** "FAQPage" in recommended_missing
- **Priority:** MEDIUM
- **Impact:** 12 pts | **Difficulty:** Medium | **ROI:** 7
- **Time:** 1-2 hours
- **Description:** FAQPage schema is the highest-value schema for AI citation. When AI systems
  answer user questions, they frequently pull from FAQ-structured content because it's already
  in Q&A format. Adding even 5-10 FAQ items can dramatically increase how often your content
  is cited by ChatGPT, Perplexity, and Claude.
- **Code example:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is [your main service/product]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Detailed answer that AI can cite directly..."
      }
    },
    {
      "@type": "Question",
      "name": "How does [your process/service] work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Step-by-step explanation..."
      }
    }
  ]
}
```

### R07 — Add Article Schema to Blog
- **Trigger:** "Article" in recommended_missing
- **Priority:** MEDIUM
- **Impact:** 8 pts | **Difficulty:** Medium | **ROI:** 6
- **Time:** 30-60 minutes (template-based)
- **Description:** Article schema helps AI systems properly attribute your blog content when
  citing it. Without it, AI may cite your content but won't know the author, publication date,
  or organization — reducing the credibility and frequency of citations.
- **Code example:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your Article Title Here",
  "description": "Article summary (1-2 sentences)",
  "author": {
    "@type": "Person",
    "name": "Author Name",
    "url": "https://yoursite.com/author/name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Your Company",
    "logo": "https://yoursite.com/logo.png"
  },
  "datePublished": "2025-01-15",
  "dateModified": "2025-01-15",
  "image": "https://yoursite.com/article-image.jpg"
}
```

### R08 — Add WebSite Schema
- **Trigger:** "WebSite" in recommended_missing
- **Priority:** MEDIUM
- **Impact:** 6 pts | **Difficulty:** Easy | **ROI:** 5
- **Time:** 15 minutes
- **Description:** WebSite schema helps AI understand your site's overall purpose and enables
  sitelinks search box in Google. Simple but high-value for establishing site identity.
- **Code example:**
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Your Site Name",
  "url": "https://yoursite.com",
  "description": "What visitors find on your site",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://yoursite.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

---

## Content Structure Recommendations

### R09 — Add H1 Heading
- **Trigger:** has_h1 = false
- **Priority:** HIGH
- **Impact:** 15 pts | **Difficulty:** Easy | **ROI:** 10
- **Time:** 5 minutes
- **Description:** The page has no H1 heading. The H1 is the primary signal AI systems use to
  understand what a page is about. Without it, AI cannot reliably determine the page's topic,
  reducing the chance of accurate citation or indexing.
- **Code example:**
```html
<h1>Your Main Page Headline</h1>
<!-- Should describe the page's main topic clearly -->
<!-- Should appear once, near the top of the content area -->
```

### R10 — Add Meta Description
- **Trigger:** has_meta_description = false
- **Priority:** HIGH
- **Impact:** 10 pts | **Difficulty:** Easy | **ROI:** 10
- **Time:** 5 minutes
- **Description:** Missing meta description. AI systems use the meta description to quickly
  understand what a page is about without reading all the content. It's also shown in
  AI-generated summaries and search results.
- **Code example:**
```html
<meta name="description" content="
  Clear description of this page (70-160 characters).
  Include your main keyword and what the user will find here.
">
```

### R11 — Fix Meta Description Length
- **Trigger:** has_meta_description = true AND (length < 70 OR length > 160)
- **Priority:** MEDIUM
- **Impact:** 5 pts | **Difficulty:** Easy | **ROI:** 5
- **Time:** 5 minutes
- **Description:** Meta description is outside the optimal range (70-160 characters). Too short
  doesn't provide enough context; too long gets truncated by AI systems and search engines.

### R12 — Fix Title Tag Length
- **Trigger:** has_title = true AND (title_length < 30 OR title_length > 60)
- **Priority:** MEDIUM
- **Impact:** 5 pts | **Difficulty:** Easy | **ROI:** 5
- **Time:** 5 minutes
- **Description:** Title tag is outside the optimal range (30-60 characters). AI systems use
  the title to understand the page's main topic. Current length affects how it displays.

### R13 — Add Alt Text to Images
- **Trigger:** images_without_alt > 0
- **Priority:** MEDIUM
- **Impact:** 5-15 pts | **Difficulty:** Easy-Medium | **ROI:** 5
- **Time:** ~2 minutes per image
- **Description:** Images are missing alt text. Alt text helps AI understand visual content
  on your page and contributes to overall content structure scoring. Also critical for accessibility.
- **Code example:**
```html
<!-- Before (missing alt): -->
<img src="team-photo.jpg">

<!-- After (descriptive alt): -->
<img src="team-photo.jpg" alt="ICODA marketing team at their Moscow office, 2024">
<!-- Make alt text descriptive and meaningful, not just the filename -->
```

### R14 — Improve Semantic HTML Structure
- **Trigger:** uses_semantic_html = false (fewer than 3 semantic elements)
- **Priority:** LOW
- **Impact:** 10 pts | **Difficulty:** Medium | **ROI:** 4
- **Time:** 2-4 hours
- **Description:** The page uses few or no semantic HTML5 elements. Semantic tags help AI
  understand which parts of your content are navigation, main content, sidebars, and footers —
  making it easier to extract the meaningful content for citation.
- **Code example:**
```html
<body>
  <header><!-- site header, logo, nav --></header>
  <nav><!-- navigation menu --></nav>
  <main>
    <article>
      <section><!-- content section --></section>
    </article>
    <aside><!-- sidebar content --></aside>
  </main>
  <footer><!-- footer content --></footer>
</body>
```

### R15 — Add Open Graph Tags
- **Trigger:** has_og_tags = false
- **Priority:** LOW
- **Impact:** 5 pts | **Difficulty:** Easy | **ROI:** 5
- **Time:** 15 minutes
- **Description:** Add Open Graph meta tags for better representation when your content is
  shared and referenced. These tags also help AI systems understand your content's context.
- **Code example:**
```html
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description (same or similar to meta description)">
<meta property="og:image" content="https://yoursite.com/social-image.jpg">
<meta property="og:url" content="https://yoursite.com/page-url">
<meta property="og:type" content="website">
```

### R16 — Fix Heading Hierarchy
- **Trigger:** heading_hierarchy_valid = false AND has_h1 = true
- **Priority:** MEDIUM
- **Impact:** 10 pts | **Difficulty:** Medium | **ROI:** 4
- **Time:** 30-60 minutes
- **Description:** Heading levels are skipped (e.g., jumping from H1 to H3). AI systems use
  heading hierarchy to understand content structure and relationships between topics.
  A broken hierarchy makes it harder for AI to parse your content tree.
- **Code example:**
```html
<!-- Invalid (skips H2): -->
<h1>Main Title</h1>
  <h3>Subsection</h3>

<!-- Valid (sequential): -->
<h1>Main Title</h1>
  <h2>Section</h2>
    <h3>Subsection</h3>
```

---

## Technical Recommendations

### R17 — Enable HTTPS
- **Trigger:** is_https = false
- **Priority:** HIGH
- **Impact:** 25 pts | **Difficulty:** Medium | **ROI:** 8
- **Time:** 1-2 hours
- **Description:** Your site is not using HTTPS. All major AI crawlers prefer secure connections
  and may deprioritize HTTP sites. HTTPS is also a trust signal that affects citation frequency.
  Get an SSL certificate (Let's Encrypt is free) and configure your server to redirect HTTP to HTTPS.

### R18 — Add XML Sitemap
- **Trigger:** has_sitemap = false
- **Priority:** MEDIUM
- **Impact:** 15 pts | **Difficulty:** Easy | **ROI:** 7
- **Time:** 30 minutes
- **Description:** No sitemap.xml found. A sitemap tells AI crawlers which pages exist on your
  site and when they were last updated. Without it, crawlers may miss important content,
  especially new pages. Most CMS platforms (WordPress, Shopify, Webflow) can generate sitemaps automatically.
- **Code example:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yoursite.com/</loc>
    <lastmod>2025-01-01</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yoursite.com/about</loc>
    <lastmod>2025-01-01</lastmod>
    <priority>0.8</priority>
  </url>
</urlset>
```

### R19 — Improve Page Speed
- **Trigger:** response_time_ms > 2000 (or estimated slow)
- **Priority:** MEDIUM
- **Impact:** 10-20 pts | **Difficulty:** Hard | **ROI:** 3
- **Time:** Varies (days/weeks)
- **Description:** Slow page load time affects how frequently AI crawlers visit your site.
  Crawlers allocate limited time per domain — a slow site means fewer pages indexed per crawl.
  Target under 1 second. Consider: image optimization, CDN, caching, and server upgrades.

### R20 — Fix HTTP Status / Redirects
- **Trigger:** status_code != 200 OR redirect_count > 2
- **Priority:** HIGH (for 4xx/5xx) / MEDIUM (for redirect chains)
- **Impact:** 10-25 pts | **Difficulty:** Medium | **ROI:** 7
- **Time:** 30 minutes - 2 hours
- **Description:** The page returns a non-200 status or has too many redirects. AI crawlers
  follow redirects but penalize chains. More than 2 redirects can cause crawlers to give up.

---

## Recommendation Sorting Logic

When building the report's recommendation list:

1. Sort by ROI score descending (highest ROI first)
2. Among equal ROI, sort by priority: high > medium > low
3. Show maximum 8 recommendations in the report
4. Always put HIGH priority recommendations before MEDIUM even if ROI is slightly lower

**Priority override:** If a site has a HTTPS failure or bot blocking, always put those first
regardless of ROI score — they are critical blockers.
