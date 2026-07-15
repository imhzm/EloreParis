---
name: skywave
description: Personal master workflow for the user's digital product projects. Use when the user says `SkyWave`, `$skywave`, "use my skill", "استخدم skill الخاصة بيا", "استخدم SkyWave", "اشتغل بـ SkyWave", "اعملها بالكامل", "عاوز كل حاجة", or wants one default skill that chooses, sequences, and combines the right installed skills across UI/UX, public websites, apps, internal tools, SEO, AEO, GEO, blog systems, schema/entity strategy, human-content quality, security, privacy, performance, accessibility, analytics, engineering, validation, deployment, monitoring, and growth.
---

# SkyWave

SkyWave is the user's personal master skill and the default entrypoint for medium and large projects.

Do not treat SkyWave as a replacement for specialized skills. Treat it as the control layer that chooses, sequences, and validates the right installed skills for the current phase.

## Default Invocation Policy

When the user explicitly invokes `SkyWave` or `$skywave`, treat that as a request for **full-scope orchestration by default**:

- use all relevant installed skills across the full project lifecycle
- automatically expand coverage across discovery, design and architecture, implementation, validation, release, and growth when the task needs it
- keep the active execution set phase-based and focused rather than loading every skill in one step

Default assumption:

- `SkyWave` alone means: "coordinate all relevant skills for me automatically"
- the user does **not** need to separately say "use all skills" for this behavior
- if the user asks for a narrow phase or a specific specialist skill, narrow the active set only for that request

For detailed routing and policy, load only the references that match the task:

- [references/skill-routing.md](references/skill-routing.md) for phase-by-phase skill bundles
- [references/public-surface-playbook.md](references/public-surface-playbook.md) for public websites and marketing surfaces
- [references/internal-product-playbook.md](references/internal-product-playbook.md) for internal tools, admin surfaces, dashboards, and operations systems
- [references/seo-aeo-geo-playbook.md](references/seo-aeo-geo-playbook.md) for SEO, AEO, GEO, and schema/entity strategy
- [references/human-content-system.md](references/human-content-system.md) for human-content rules and style-sample gating
- [references/security-hardening.md](references/security-hardening.md) for secure-by-default public surfaces and application hardening
- [references/performance-and-cwv.md](references/performance-and-cwv.md) for Core Web Vitals, frontend performance, and responsive delivery quality
- [references/analytics-and-conversion.md](references/analytics-and-conversion.md) for analytics, event strategy, funnels, and conversion measurement
- [references/delivery-and-validation.md](references/delivery-and-validation.md) for checks, release criteria, and reporting
- [references/installed-skill-map.md](references/installed-skill-map.md) only when the task needs a niche skill outside the default bundles
- [references/world-class-skill-sources.md](references/world-class-skill-sources.md) when the task needs external skill libraries, GitHub skill packs, SkillsMP catalog coverage, or best-in-class skill discovery beyond currently installed skills
- [references/skillsmp-catalog-summary.md](references/skillsmp-catalog-summary.md) for SkillsMP export counts, files, API cap notes, and selective download policy

## First-Response Contract

For any medium or large task, the first substantial response must state:

- current phase
- project classification
- active skills
- expected output from this phase
- content status:
  - `sample-based` when real style samples are available
  - `provisional` when samples are missing; continue with a neutral voice and clearly mark brand-polish as pending
- protection status:
  - `audit-only` when risks are identified but not yet implemented
  - `implementation-ready` when the current phase is actively hardening or enforcing protection

## Quick Start Protocol

When SkyWave is invoked in a new project:

1. classify project type
2. set current phase to `discovery` unless the user explicitly requests a later phase
3. activate a focused bundle (planning + implementation + validation)
4. output only the phase deliverables before moving to the next phase

For website/product discovery phases, default deliverables are:

- brief
- sitemap
- user flow
- section plan
- active skills list for the phase

## Core Interpretation

Interpret requests like:

- "use all skills"
- "use the installed skills"
- "use SkyWave"
- "use my skill"
- "استخدم skill الخاصة بيا"
- "استخدم SkyWave"
- "اشتغل بـ SkyWave"
- "اعملها بالكامل"
- "عاوز كل حاجة"

as:

- use all relevant installed skills across the full lifecycle
- when `SkyWave` is invoked directly, assume full-coverage orchestration unless the user narrows the scope
- never load every installed skill into one execution step
- keep the active set focused, usually 3-6 skills per phase
- keep public-surface quality rules on by default unless the project is clearly non-public

## Imported Pack Coverage

SkyWave includes full coverage for imported skills from the `Ai-Agent-Skills` repository:

- `ask-questions-if-underspecified`
- `backend-development`
- `best-practices`
- `changelog-generator`
- `code-documentation`
- `content-research-writer`
- `database-design`
- `llm-application-dev`

Use these through phase routing and selection rules, not as a single always-on bundle.

## External Source Library

SkyWave also maintains a local external skill source library for discovery and selective routing. Treat these sources as reference libraries, not as always-active installed skills.

Use external source libraries only when installed Codex skills do not cover the task deeply enough, or when the user explicitly asks to search, compare, download, or upgrade skill coverage.

Default external source priority:

1. official Codex skills and system skills
2. user's installed skills
3. vetted external GitHub skill packs in `D:\REDA\skywave\source-repos`
4. SkillsMP catalog exports in `D:\REDA\skywave\exports`

Never load every external skill at once. Search the catalog, pick the best matching 1-3 external `SKILL.md` files for the current phase, inspect them before using any script, and keep the active set focused.

## Operating Doctrine

1. Inspect the request, repo, brief, and current state before choosing skills.
2. Classify the project before acting:
   - public-facing website or brand surface
   - SaaS or product with public marketing surfaces
   - internal tool or closed dashboard
   - mobile or React Native / Expo app
   - desktop or cross-platform client
   - app or backend system
   - automation, docs, or media task
3. Identify the current phase:
   - discovery
   - design and architecture
   - implementation
   - validation
   - release
   - growth and automation
4. Activate a focused bundle:
   - one planning or architecture skill
   - one or two implementation skills
   - one validation skill
   - optional supporting skills only if the task truly needs them
5. Finish the current phase cleanly before expanding scope.
6. Validate what changed before reporting completion.

## Execution Discipline

Always run work in this order unless the task is explicitly read-only:

1. inspect actual files and current behavior
2. plan the smallest correct change
3. implement in small, reversible steps
4. run relevant validation (lint, typecheck, tests, build, or task-specific checks)
5. fix failures before claiming completion
6. report what was verified and what was not

## Public-Surface Default Stack

For any public-facing website, landing page, marketing surface, content site, local-business site, or public SaaS presence, treat these as default layers:

- UI/UX
- SEO + AEO + GEO
- blog/content system unless explicitly excluded
- schema/entity strategy
- security + privacy
- performance + Core Web Vitals
- accessibility
- analytics + conversion tracking
- deployment + monitoring + rollback readiness
- human-content QA

Start public-facing work in this order:

1. brief, audience, intent
2. information architecture
3. UX/UI direction
4. page plan
5. content surface plan
6. schema inventory
7. SEO/AEO/GEO plan
8. security/privacy plan
9. analytics/conversion plan
10. performance/accessibility expectations

Do not skip these layers just because the user asked for code quickly. Only relax them when the project is clearly internal, closed, or non-public.

## Internal Product Default Stack

For internal tools, closed dashboards, admin panels, operations systems, or employee-facing products, treat these as default layers:

- scoped workflows and permissions
- authn and authz boundaries
- API and data safety
- empty, error, loading, and degraded states
- auditability and operational visibility
- release and rollback readiness

Add analytics intentionally when the product needs measurable workflow, adoption, or operational outcomes. Do not force blog, editorial, or public-surface SEO layers onto clearly internal systems.

## Human Content Rule

Public-facing copy, blog posts, metadata, FAQ answers, author bios, and other public editorial content are not final unless they are grounded in real style samples from the user, the brand, or trusted existing assets.

If 2-3 real samples or links are available:

- set content status to `sample-based`
- derive the voice from those samples
- write and edit against that voice

If samples are not available:

- set content status to `provisional`
- produce structured, useful copy in a neutral voice with explicit assumptions
- ask once for 2-3 samples before final brand polish
- do not claim strict brand-voice match until samples are provided
- content can still be published when the user explicitly approves neutral voice and factual claims

Infer language from the brief, domain, target market, or existing content when possible. If the intended public language is still unclear, ask once before finalizing public-facing content.

## Default Bundles

### Public Website or Brand Surface

Start with:

- `client-intake-to-scope`
- `saas-delivery`
- `product-design`
- `ux-designer`
- `frontend-design`
- `seo-plan`

Pull in as needed:

- `ckm:ui-styling`
- `emil-design-eng`
- `brand-guidelines`
- `canvas-design`
- `tailwind-design-system`
- `build-web-apps:shadcn`
- `fullstack-developer`
- `frontend-patterns`
- `build-web-apps:react-best-practices`
- `vercel-composition-patterns`
- `seo`
- `aeo-audit`
- `content-strategy`
- `copywriting`
- `article-writing`
- `brand-review`
- `security-best-practices`
- `build-web-apps:web-design-guidelines`
- `userinterface-wiki`
- `public-site-launch`
- `analytics-instrumentation`

Validate with:

- `code-reviewer`
- `webapp-testing`
- `e2e-testing`
- `ai-regression-testing`
- `build-web-apps:web-design-guidelines`
- `userinterface-wiki`

### SaaS Product With Marketing Surface

Start with:

- `client-intake-to-scope`
- `saas-delivery`
- `product-design`
- `ux-designer`
- `fullstack-developer`
- `seo-plan`

Pull in as needed:

- `frontend-design`
- `emil-design-eng`
- `frontend-patterns`
- `build-web-apps:react-best-practices`
- `vercel-composition-patterns`
- `build-web-apps:shadcn`
- `backend-patterns`
- `backend-development`
- `api-design`
- `auth-patterns`
- `database-migrations`
- `database-design`
- `database-safety`
- `openapi-spec-generation`
- `build-web-apps:stripe-best-practices`
- `build-web-apps:supabase-postgres-best-practices`
- `content-strategy`
- `security-best-practices`
- `build-web-apps:web-design-guidelines`
- `api-hardening`
- `analytics-instrumentation`

Validate with:

- `code-reviewer`
- `tdd-workflow`
- `webapp-testing`
- `e2e-testing`
- `production-debugging`
- `release-train`

### Existing Website Improvement

Start with:

- `code-reviewer`
- `frontend-design`
- `ux-designer`
- `seo`

Pull in as needed:

- `frontend-patterns`
- `build-web-apps:react-best-practices`
- `vercel-composition-patterns`
- `emil-design-eng`
- `brand-guidelines`
- `copywriting`
- `brand-review`
- `aeo-audit`
- `build-web-apps:web-design-guidelines`
- `userinterface-wiki`
- `e2e-testing`
- `coding-standards`

### Internal Tool or Closed Dashboard

Start with:

- `client-intake-to-scope`
- `saas-delivery`
- `fullstack-developer`
- `ux-designer`

Pull in as needed:

- `frontend-patterns`
- `backend-patterns`
- `backend-development`
- `auth-patterns`
- `api-hardening`
- `database-design`
- `database-safety`
- `analytics-instrumentation`
- `security-best-practices`
- `product-design`

Validate with:

- `code-reviewer`
- `tdd-workflow`
- `e2e-testing`
- `production-debugging`
- `release-train`

### Backend, APIs, and Data

Use:

- `backend-patterns`
- `backend-development`
- `api-design`
- `api-hardening`
- `auth-patterns`
- `database-design`
- `database-migrations`
- `database-safety`
- `openapi-spec-generation`
- `security-best-practices`

If the stack is .NET, prefer:

- `aspnet-core`

For React-heavy frontends or component-library work, also consider:

- `build-web-apps:react-best-practices`
- `vercel-composition-patterns`

### Deploy, Delivery, and Operations

Use:

- `saas-delivery`
- `release-train`
- `docker-patterns`
- `deployment-patterns`
- `ci-cd`
- `github-actions-templates`
- `github-workflow-automation`
- `cicd-automation-workflow-automate`
- `changelog-generator`
- `sentry`

Choose only the primary hosting platform the project actually needs:

- `build-web-apps:deploy-to-vercel`
- `vercel-deploy`
- `render-deploy`
- `netlify-deploy`
- `cloudflare-deploy`

Use `vercel-cli-with-tokens` when the deploy flow is token-based, non-interactive, CI-driven, or must avoid `vercel login`.
Use `public-site-launch` as the final release gate for public-facing websites and marketing surfaces.

### Growth, Editorial, and Distribution

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
- `content-engine`
- `content-marketer`
- `draft-content`
- `brand-review`
- `email-sequence`
- `email-writer`
- `social-content`

### Mobile and Cross-Platform Apps

Start with:

- `ux-designer`
- `fullstack-developer`
- `vercel-react-native-skills`

Pull in as needed:

- `saas-delivery`
- `product-design`
- `frontend-patterns`
- `e2e-testing`
- `security-best-practices`
- `release-train`
- `tauri`
- `electron-development`
- `electron`
- `winui-app`

### Desktop and Cross-Platform Clients

Start with:

- `product-design`
- `ux-designer`
- `fullstack-developer`

Pull in as needed:

- `desktop`
- `electron-development`
- `electron`
- `tauri`
- `winui-app`
- `security-best-practices`
- `production-debugging`
- `release-train`

Validate with:

- `code-reviewer`
- `e2e-testing`
- `production-debugging`

### Automation Workflows, n8n, and AI Agents

Start with:

- `client-intake-to-scope`
- `workflow-automation`
- `n8n-cli`
- `ask-questions-if-underspecified`

Pull in as needed:

- `best-practices`
- `llm-application-dev`
- `openai-docs`
- `mcp-builder`
- `api-hardening`
- `analytics-instrumentation`
- `production-debugging`
- `release-train`

Validate with:

- `code-reviewer`
- `production-debugging`
- `release-train`

### Production Debugging and Incident Response

Start with:

- `production-debugging`
- `code-reviewer`
- `sentry`

Pull in as needed:

- `backend-patterns`
- `frontend-patterns`
- `playwright`
- `e2e-testing`
- `security-best-practices`
- `gh-fix-ci`

### Design Systems and Figma

Use:

- `figma`
- `figma-use`
- `figma-generate-design`
- `figma-implement-design`
- `figma-generate-library`
- `figma-create-design-system-rules`
- `figma-code-connect-components`

### Automation and Specialist Work

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
- `electron-development`
- `electron`
- `tauri`
- `winui-app`
- `doc`
- `pdf`
- `slides`
- `spreadsheet`
- `jupyter-notebook`
- `imagegen`
- `speech`
- `transcribe`
- `sora`
- `openai-docs`

## Selection Rules

- Prefer the most specialized skill that directly matches the current task.
- Prefer plugin-provided skills when a plugin offers stronger task-specific coverage than a generic skill.
- Prefer one planning skill, one implementation skill, and one validation skill as the default bundle.
- Keep content, deployment, backend, and design work in separate phases unless the deliverable is explicitly cross-functional.
- Treat blog/content system as default for public websites unless the user excludes it or the project is internal.
- Treat schema/entity strategy as default for public-facing pages and content surfaces.
- Treat security, privacy, accessibility, performance, and analytics as default non-optional quality layers on public surfaces.
- Use the public-surface and human-content references before finalizing copy, schema, or editorial recommendations.
- Use the internal-product and delivery references before finalizing internal-tool scope, permissions, release guidance, or operating assumptions.
- Use the security, performance, and analytics references before finalizing a public-facing implementation or release recommendation.
- When the user asks for review, lead with findings using `code-reviewer`.
- When the user asks about OpenAI products, prefer `openai-docs`.
- Prefer `vercel-react-native-skills` for React Native / Expo work before falling back to generic frontend skills.
- Prefer `emil-design-eng` when the task is specifically about UI polish, motion judgment, spacing quality, or design-engineering taste.
- Prefer `brand-guidelines` when work must match an established visual system, brand palette, typography, and brand-consistency constraints.
- Prefer `canvas-design` for static visual design deliverables (campaign visuals, posters, and image-first concept exploration).
- Prefer `userinterface-wiki` when the user wants a UI/UX audit, animation critique, typography review, or interface-polish pass.
- Prefer `webapp-testing` when the task needs reproducible browser-based QA flows or concrete regression coverage for a local web app.
- Prefer `mcp-builder` when building or reviewing MCP servers, tools, and local integrations.
- Prefer `workflow-automation` and `n8n-cli` for n8n or workflow-orchestration tasks; add `llm-application-dev` when the flow uses AI models, RAG, prompt logic, or agent behavior.
- Prefer `desktop`, `electron-development`, `electron`, `tauri`, or `winui-app` based on the actual desktop stack instead of forcing web or mobile bundles onto desktop clients.
- Prefer `ask-questions-if-underspecified` when requirements are incomplete and implementation risk is high.
- Prefer `best-practices` when prompts, specs, or execution instructions are weak and need stronger constraints before execution.
- Prefer `backend-development` for backend service architecture, API boundary design, and implementation structure decisions.
- Prefer `database-design` for schema modeling, indexing strategy, query-shape planning, or migration-first data decisions.
- Prefer `code-documentation` for API docs, READMEs, handoff notes, and implementation rationale documentation.
- Prefer `changelog-generator` in release phases when user-facing release notes or commit-to-change summaries are required.
- Prefer `vercel-cli-with-tokens` when the environment already uses `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, or `VERCEL_ORG_ID`.
- Prefer `saas-delivery` when the task spans product, backend, frontend, and release concerns in one SaaS slice.
- Prefer `api-hardening` when APIs are public, sensitive, retry-prone, or close to release.
- Prefer `production-debugging` when the issue is already happening in production or cannot be explained confidently.
- Prefer `public-site-launch` when a website is close to launch and needs real readiness gates.
- Prefer `client-intake-to-scope` when the brief is vague, commercial, or mixes requirements before scope is stable.
- Prefer `analytics-instrumentation` when funnels, activation, conversion, or event visibility are part of the outcome.
- Prefer `database-safety` when schema changes, backfills, or irreversible data risks are involved.
- Prefer `release-train` when the work is close to staging or production release and sequencing matters.

## Anti-Patterns

- loading every installed skill just because it exists
- using "all skills" to justify one giant messy step
- skipping IA, page planning, schema planning, or content planning on a public website
- skipping security, privacy, analytics, or performance planning on a public website
- treating internal tools like public sites and forcing irrelevant content layers onto them
- skipping roles, permissions, or data safety on internal products because they are "not public"
- presenting generic AI-sounding copy as final public content
- finalizing public-facing content without style samples when samples are required
- mixing strategy, coding, deployment, and marketing without phase boundaries
- claiming completion without validation
