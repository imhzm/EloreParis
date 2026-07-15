---
name: public-site-launch
description: Prepare public-facing websites and marketing surfaces for launch with quality gates across UX, accessibility, SEO, schema, analytics, performance, forms, security, deployment, and rollback readiness. Use when shipping a landing page, brochure site, marketing site, docs surface, or public SaaS site that must look polished and convert safely.
---

# Public Site Launch

Use this skill as the release gate for anything public on the web.

It is not a design replacement. It is the launch coordinator that checks whether the site is actually ready for traffic, search engines, and conversion measurement.

Load [references/launch-gates.md](references/launch-gates.md) when the task is close to release, involves a redesign, or includes SEO, analytics, forms, or deployment work.

## Default Bundle

Use:

- `frontend-design`
- `seo-plan`
- `security-best-practices`

Add when needed:

- `ux-designer`
- `build-web-apps:web-design-guidelines`
- `code-reviewer`
- `e2e-testing`
- `ai-regression-testing`
- `build-web-apps:deploy-to-vercel`
- `vercel-cli-with-tokens`
- `render-deploy`
- `netlify-deploy`
- `cloudflare-deploy`

## Content Rule

If real brand samples are missing, public-facing copy, metadata, FAQ text, and editorial surfaces remain `draft-only`.

Do not present generic AI copy as final launch-ready content.

## Workflow

### 1. Confirm Launch Surface

Define:

- which URLs or pages are in scope
- primary conversion action
- forms, chat, booking, checkout, or lead capture dependencies
- deployment target and rollback expectation

### 2. Run Launch Gates

Check:

- responsive UI quality
- accessibility basics
- metadata, indexing, and schema
- analytics and conversion events
- page speed and obvious Core Web Vitals risks
- form success, error, and abuse handling
- privacy and security basics

### 3. Fix the Highest-Risk Gaps

Prioritize in this order:

1. broken flows
2. security or privacy exposure
3. indexing or metadata mistakes
4. analytics blind spots
5. major UX or accessibility issues
6. performance issues that are obvious and material

### 4. Verify Before Release

Run what exists:

- lint
- typecheck
- tests
- build
- targeted browser or flow checks

### 5. Report Readiness Honestly

Use one of:

- `not ready`
- `ready with known risks`
- `launch ready`

Always include the exact remaining risks and what still needs manual verification, if any.

## Anti-Patterns

- launching with placeholder metadata
- shipping forms without success/error/abuse handling
- missing analytics on the main conversion path
- ignoring mobile quality on a public surface
- treating deployment success as proof of launch readiness
