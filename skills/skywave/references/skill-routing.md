# Skill Routing

Use this file when SkyWave needs explicit phase-by-phase routing.

Canonical phase order:

`discovery -> design and architecture -> implementation -> validation -> release -> growth and automation`

## Routing Rule

Use 3-6 skills per phase. Prefer:

- one planning skill
- one or two implementation skills
- one validation skill

Load [installed-skill-map.md](installed-skill-map.md) only when a niche or secondary skill is needed.

## Public Website or Brand Surface

### Discovery

- `client-intake-to-scope`
- `ask-questions-if-underspecified`
- `saas-delivery`
- `product-design`
- `ux-designer`
- `seo-plan`
- `security-best-practices`

### Design and Architecture

- `frontend-design`
- `ckm:ui-styling`
- `emil-design-eng`
- `brand-guidelines`
- `canvas-design`
- `tailwind-design-system`
- `build-web-apps:shadcn`
- `content-strategy`

### Implementation

- `fullstack-developer`
- `frontend-patterns`
- `build-web-apps:react-best-practices`
- `vercel-composition-patterns`
- `backend-patterns`
- `api-design`
- `security-best-practices`

Only add backend or API skills when the site actually needs forms, auth, dashboards, data flows, or CMS/API logic.

### Validation

- `code-reviewer`
- `webapp-testing`
- `e2e-testing`
- `ai-regression-testing`
- `build-web-apps:web-design-guidelines`
- `userinterface-wiki`
- `public-site-launch`
- `analytics-instrumentation`
- `coding-standards`
- `sentry`

### Growth and Automation

- `seo`
- `aeo-audit`
- `content-research-writer`
- `article-writing`
- `email-sequence`
- `social-content`

### Release and Monitoring

- `public-site-launch`
- `release-train`
- `deployment-patterns`
- `ci-cd`
- `github-actions-templates`
- `build-web-apps:deploy-to-vercel`
- `vercel-cli-with-tokens`
- `sentry`

## Internal Tool or Closed Dashboard

### Discovery

- `client-intake-to-scope`
- `saas-delivery`
- `ux-designer`

### Product and Workflow Design

- `product-design`
- `ux-designer`
- `frontend-design`

### Engineering

- `fullstack-developer`
- `frontend-patterns`
- `backend-patterns`
- `auth-patterns`
- `api-hardening`
- `database-safety`

Add `analytics-instrumentation` only when the product needs measurable workflow or adoption signals.

### Validation and Release

- `code-reviewer`
- `tdd-workflow`
- `e2e-testing`
- `production-debugging`
- `release-train`

## SaaS Product With Marketing Site

### Discovery

- `client-intake-to-scope`
- `saas-delivery`
- `product-design`
- `ux-designer`
- `seo-plan`

### Product and Marketing Surface

- `frontend-design`
- `emil-design-eng`
- `frontend-patterns`
- `build-web-apps:react-best-practices`
- `build-web-apps:shadcn`
- `content-strategy`
- `copywriting`
- `security-best-practices`
- `build-web-apps:web-design-guidelines`

### Product Engineering

- `saas-delivery`
- `fullstack-developer`
- `backend-patterns`
- `backend-development`
- `api-design`
- `api-hardening`
- `auth-patterns`
- `database-design`
- `database-migrations`
- `database-safety`
- `openapi-spec-generation`
- `vercel-composition-patterns`
- `build-web-apps:stripe-best-practices`
- `build-web-apps:supabase-postgres-best-practices`
- `analytics-instrumentation`

### Validation and Release

- `tdd-workflow`
- `code-reviewer`
- `webapp-testing`
- `build-web-apps:web-design-guidelines`
- `userinterface-wiki`
- `production-debugging`
- `release-train`
- `deployment-patterns`
- `ci-cd`

## Existing Website Improvement

### Audit

- `code-reviewer`
- `ux-designer`
- `seo`

### Improvement

- `frontend-design`
- `frontend-patterns`
- `build-web-apps:react-best-practices`
- `vercel-composition-patterns`
- `emil-design-eng`
- `brand-guidelines`
- `copywriting`
- `brand-review`
- `userinterface-wiki`
- `aeo-audit`

### Validation

- `e2e-testing`
- `ai-regression-testing`
- `build-web-apps:web-design-guidelines`
- `coding-standards`

## Backend and APIs

Use:

- `backend-patterns`
- `api-design`
- `api-hardening`
- `auth-patterns`
- `database-migrations`
- `database-safety`
- `openapi-spec-generation`

Add:

- `aspnet-core` for .NET stacks
- `security-best-practices` for explicit secure-by-default work
- `build-web-apps:react-best-practices` for React-heavy product surfaces
- `vercel-composition-patterns` for component API cleanup and reusable UI architecture

## Deployment and Operations

Use:

- `saas-delivery`
- `release-train`
- `docker-patterns`
- `deployment-patterns`
- `ci-cd`
- `github-actions-templates`
- `github-workflow-automation`
- `changelog-generator`
- `sentry`

Choose one hosting skill:

- `build-web-apps:deploy-to-vercel`
- `vercel-deploy`
- `render-deploy`
- `netlify-deploy`
- `cloudflare-deploy`

Add `vercel-cli-with-tokens` when the environment is already token-based or the deploy flow must stay non-interactive.
Add `public-site-launch` as the final gate for public sites or marketing surfaces.

Add infrastructure skills only when clearly needed:

- `terraform-module-library`
- `k8s-manifest-generator`
- `gitops-workflow`
- `sentry`

## SEO, AEO, GEO, and Editorial

Use:

- `analytics-instrumentation`
- `seo-plan`
- `seo`
- `aeo-audit`
- `content-strategy`
- `copywriting`
- `content-research-writer`
- `article-writing`
- `code-documentation`
- `brand-review`

Add distribution when requested:

- `content-engine`
- `content-marketer`
- `email-sequence`
- `email-writer`
- `social-content`

Remember to define analytics and conversion events even when no dedicated analytics skill exists. Implement those requirements through the engineering and review skills active in the phase.

## Figma and Design Systems

Use:

- `figma`
- `figma-use`
- `figma-generate-design`
- `figma-implement-design`
- `figma-generate-library`
- `figma-create-design-system-rules`
- `figma-code-connect-components`

## Mobile and Cross-Platform Apps

### Discovery

- `ux-designer`
- `product-design`
- `vercel-react-native-skills`

### Implementation

- `vercel-react-native-skills`
- `fullstack-developer`
- `frontend-patterns`
- `security-best-practices`

### Validation

- `e2e-testing`
- `code-reviewer`
- `ai-regression-testing`

### Release

- `saas-delivery`
- `release-train`
- `deployment-patterns`
- `ci-cd`
- `sentry`
- `vercel-cli-with-tokens`

## Desktop and Cross-Platform Clients

### Discovery

- `product-design`
- `ux-designer`
- `fullstack-developer`

### Implementation

- `desktop`
- `electron-development`
- `electron`
- `tauri`
- `winui-app`
- `security-best-practices`

### Validation and Release

- `code-reviewer`
- `e2e-testing`
- `production-debugging`
- `release-train`

## Automation Workflows, n8n, and AI Agents

### Discovery

- `client-intake-to-scope`
- `ask-questions-if-underspecified`
- `workflow-automation`
- `n8n-cli`
- `openai-docs`

### Implementation

- `workflow-automation`
- `n8n-cli`
- `best-practices`
- `llm-application-dev`
- `api-hardening`
- `mcp-builder`
- `analytics-instrumentation`

### Validation and Release

- `code-reviewer`
- `production-debugging`
- `release-train`

## Production Debugging and Incident Response

Use:

- `production-debugging`
- `code-reviewer`
- `sentry`

Add when needed:

- `backend-patterns`
- `frontend-patterns`
- `playwright`
- `e2e-testing`
- `security-best-practices`
- `gh-fix-ci`

## Discovery and Scoping

Use:

- `client-intake-to-scope`
- `product-design`
- `ux-designer`

Add when needed:

- `ask-questions-if-underspecified`
- `seo-plan`
- `saas-delivery`
- `public-site-launch`
- `release-train`

## Specialist Skills

Use only when the task actually needs them:

- `workflow-automation`
- `ask-questions-if-underspecified`
- `best-practices`
- `backend-development`
- `database-design`
- `changelog-generator`
- `code-documentation`
- `mcp-builder`
- `llm-application-dev`
- `browser-automation`
- `n8n-cli`
- `data-scraper-agent`
- `playwright`
- `playwright-interactive`
- `desktop`
- `electron`
- `doc`
- `pdf`
- `slides`
- `spreadsheet`
- `jupyter-notebook`
- `imagegen`
- `speech`
- `transcribe`
- `sora`
