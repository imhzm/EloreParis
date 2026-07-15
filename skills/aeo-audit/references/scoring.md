# AEO Audit — Scoring Reference

Exact scoring formulas derived from the ICODA AI Visibility microservice.

---

## Final Score Formula

```
overall_score = round(
  ai_access_score    × 0.20 +   # AI Bot Access
  technical_score    × 0.20 +   # Technical
  structured_data_score × 0.25 + # Structured Data
  content_score      × 0.35      # Content Structure (most weight)
)
```

**Rationale for weights:**
- Content Structure (35%) — most differentiating factor; varies widely between sites
- Structured Data (25%) — critical for AI comprehension and citation
- AI Access (20%) — important but most sites allow bots (less variance)
- Technical (20%) — performance and discoverability

---

## 1. AI Access Score (robots.txt analysis)

### Bot Weights (must sum to 100)

| Bot Name       | Importance | Weight |
|----------------|-----------|--------|
| GPTBot         | critical  | 25     |
| ClaudeBot      | critical  | 25     |
| PerplexityBot  | high      | 20     |
| Google-Extended| high      | 15     |
| CCBot          | medium    | 10     |
| anthropic-ai   | low       | 3      |
| Bytespider     | low       | 1      |
| cohere-ai      | low       | 1      |

### Access Level → Score Mapping

| Access Level | Score | Condition |
|--------------|-------|-----------|
| full         | 100   | No disallow rules, OR empty `Disallow:` |
| full         | 95    | Only non-critical paths blocked (admin, wp-*, feeds, search, cgi-bin, login, etc.) |
| partial      | 70    | Some paths blocked, but they're not critical content |
| limited      | 40    | Critical content paths blocked (/, /blog, /about, /services, /faq, /pricing, etc.) |
| blocked      | 0     | `Disallow: /` without `Allow: /` override |

### Critical Paths (blocking these = "limited" access)
```
/, /*, /blog, /articles, /posts, /news,
/services, /products, /solutions,
/about, /company, /team,
/faq, /help, /support,
/pricing, /features
```

### Non-Critical Paths (blocking these is OK → stays "full" with 95pts)
```
/wp-admin, /wp-includes, /wp-json, /wp-login, /wp-*
/admin, /administrator, /cgi-bin, /private
/feed, /rss, /trackback, /embed, /comments
/xmlrpc, /login, /logout, /register
/cart, /checkout, /account, /my-account
/search, /tag, /author, /category
/tmp, /temp, /cache, /backup
/?* (query strings), paths ending in .xml, .txt, .log
```

### Crawl-Delay Penalty

| Crawl-Delay value | Penalty |
|-------------------|---------|
| ≥ 10 seconds      | −15 pts |
| 5–9 seconds       | −10 pts |
| 1–4 seconds       | −5 pts  |
| Not set           | 0 pts   |

### Parsing Rules

- **No robots.txt file** → All bots get full access (100 pts each) → Final score: 100
- `Disallow:` (empty) = allow all (same as no rule)
- `Disallow: /` = blocked, unless there's also `Allow: /` in the same block
- Bot matching: exact name (case-insensitive) first, then `User-agent: *` as fallback
- Score for each bot is capped at 0 minimum

### Final Score Calculation
```
weighted_sum = sum(bot_score × bot_weight for each bot)
ai_access_score = round(weighted_sum / 100)
```

---

## 2. Technical Score

| Check | Points | Condition |
|-------|--------|-----------|
| HTTPS | +25 | URL starts with `https://` |
| HTTP Status 200 | +25 | Page returns 200 OK |
| HTTP Status 3xx | +15 | Page returns redirect (instead of 200) |
| Response Time <500ms | +20 | Very fast |
| Response Time 500-999ms | +15 | Fast |
| Response Time 1000-1999ms | +10 | Acceptable |
| Response Time 2000-2999ms | +5 | Slow |
| Response Time ≥3000ms | +0 | Very slow |
| Redirects = 0 | +10 | No redirects |
| Redirects = 1 | +7 | One redirect |
| Redirects = 2 | +4 | Two redirects |
| Redirects ≥ 3 | +0 | Too many redirects |
| Sitemap found + valid XML | +15 | sitemap.xml or sitemap_index.xml |
| Sitemap found but invalid | +8 | Found but not valid XML |
| No sitemap | +0 | |
| llms.txt found | +5 | Bonus points |

**Max: 100 pts** (capped if sum exceeds 100)

**Note on response time estimation:** When WebFetch doesn't report exact timing,
use these heuristics:
- Major platforms (Stripe, Google, large e-commerce): likely <500ms → assume 20pts
- SMB sites on shared hosting: likely 500-1500ms → assume 10-15pts
- Sites with known issues: be conservative

---

## 3. Structured Data Score (JSON-LD / Schema.org)

| Check | Points | Notes |
|-------|--------|-------|
| JSON-LD present | +40 | Base: any `<script type="application/ld+json">` tag |
| Each high-priority schema | +10 each | Max 30 pts total |
| Each medium-priority schema | +5 each | Max 15 pts total |
| Schema variety bonus | +2 per unique @type | Max 10 pts total |
| Microdata OR RDFa present | +5 | Bonus (itemscope or typeof attributes) |

**Max: 100 pts**

### High-Priority Schemas (10pts each, max 4 = 40pts → capped at 30)

| Schema | Reason |
|--------|--------|
| Organization | Establishes entity identity for AI systems |
| WebSite | Helps AI understand site-wide structure |
| Article | Essential for blog/news attribution when AI cites content |
| FAQPage | Directly usable by AI for Q&A responses — highest citation value |

### Medium-Priority Schemas (5pts each, max 3 = 15pts)

| Schema | Reason |
|--------|--------|
| HowTo | Step-by-step instructions AI can extract |
| Product | Powers AI shopping recommendations |
| Service | Describes service offerings for AI matching |
| LocalBusiness | Local business info for AI assistants |

### Low-Priority Schemas (not counted in score)

BreadcrumbList, Person (improve context but don't add points)

### Recommended Missing

When generating recommendations, highlight high-priority schemas that are absent.
A site with JSON-LD but missing Organization schema should be flagged.

---

## 4. Content Structure Score

| Check | Points | Notes |
|-------|--------|-------|
| H1 tag present | +15 | Page must have at least one H1 |
| Valid heading hierarchy | +10 | No skipped levels (H1→H3 is invalid) |
| Title tag present | +10 | |
| Title 30-60 chars (bonus) | +5 | Good length for AI understanding |
| Meta description present | +10 | |
| Meta description 70-160 chars (bonus) | +5 | Optimal length |
| Image alt coverage ≥90% | +15 | of all img tags |
| Image alt coverage ≥70% | +10 | |
| Image alt coverage ≥50% | +5 | |
| No images on page | +15 | Not penalized for having no images |
| Semantic HTML (3+ elements) | +10 | article/section/nav/header/footer/main/aside |
| Open Graph tags | +5 | Bonus: og:title, og:description, etc. |
| Twitter Cards | +5 | Bonus: twitter:card, etc. |
| Internal links ≥5 | +5 | Bonus: good internal link structure |

**Max: 100 pts**

### Heading Hierarchy Validity

Valid: H1 → H2 → H3 (sequential levels)
Invalid: H1 → H3 (skipped H2), H2 → H4 (skipped H3)
If no H1 present → hierarchy_valid = false (−10 pts)
Multiple H1s → flag as issue but don't penalize score additionally

---

## Score Interpretation

| Range | Label | Color |
|-------|-------|-------|
| 80-100 | Excellent AI visibility | #22c55e (green) |
| 65-79 | Good, minor improvements needed | #eab308 (yellow) |
| 50-64 | Needs significant work | #f97316 (orange) |
| 0-49 | Critical issues — poor AI visibility | #ef4444 (red) |

---

## Edge Cases

- **Page returns error (4xx/5xx):** Technical score loses status points; other categories
  may return "unable to verify" — note this in the report
- **robots.txt returns HTML page:** Treat as "NOT FOUND" → score 100
- **Sitemap is a sitemap index (not direct URLs):** Count `<sitemap>` entries instead of `<url>`
- **JSON-LD with @graph:** Expand the @graph array and count each nested type
- **Multiple JSON-LD scripts:** Count all @types across all script tags
