# Skills Library

This folder is your local skill library.

Use `skywave` as the default entrypoint for any medium or large project, then let it route the active skill bundle by phase instead of manually loading everything.

## What Was Standardized

- Broken internal links were fixed across the installed skills.
- SkyWave references were completed so external skill-source discovery no longer points to missing files.
- A reusable validator was added at [scripts/validate-skills.mjs](D:\REDA\skills\scripts\validate-skills.mjs).

## Health Check

Run this any time you update or add skills:

```powershell
node D:\REDA\skills\scripts\validate-skills.mjs
```

Expected result:

```json
{
  "summary": {},
  "issues": []
}
```

## Default Operating Model

For most real projects, use this phase order:

1. `discovery`
2. `design and architecture`
3. `implementation`
4. `validation`
5. `release`
6. `growth and automation`

SkyWave should keep the active skill set focused, usually:

- 1 planning skill
- 1 or 2 implementation skills
- 1 validation skill

## How To Use This On Any Project

### Option 1: Let SkyWave route automatically

Say:

- `Use SkyWave in this project.`
- `استخدم SkyWave في المشروع ده`
- `use my skill`
- `اعملها بالكامل بس على مراحل`

This is the default for:

- websites
- SaaS products
- dashboards
- APIs
- automation workflows
- content + SEO projects

### Option 2: Ask for a specific phase

Examples:

- `Use SkyWave. We are in discovery.`
- `Use SkyWave and start with implementation only.`
- `استخدم SkyWave وابدأ بمرحلة QA`
- `Use SkyWave for release and deployment readiness.`

### Option 3: Force a specialist skill when you know the exact need

Examples:

- `Use SkyWave, but prioritize code-reviewer and production-debugging.`
- `Use SkyWave, and bring in webapp-testing for browser QA.`
- `Use SkyWave, and use llm-application-dev for the AI workflow.`

## Best Default Prompts

### New Website

```text
Use SkyWave in this project.
Classify it as a public-facing website.
Start with discovery only.
I want: brief, sitemap, user flow, section plan, active skills, and assumptions.
Do not start coding before inspecting the repo and requirements.
```

### Existing App / Feature Work

```text
Use SkyWave in this project.
Inspect the current codebase first.
Identify the current phase.
Choose only the relevant active skills.
Make the smallest correct production-grade change.
Then run validation.
```

### Bug / Incident

```text
Use SkyWave in this project.
Treat this as production debugging.
Start with repo inspection and likely root-cause analysis.
Use production-debugging, code-reviewer, and any necessary validation skills.
Do not claim a fix before verification.
```

### API / Backend Task

```text
Use SkyWave in this project.
Classify it as backend/API work.
Prioritize api-design, api-hardening, backend-patterns, and database-safety when relevant.
Inspect the real schema/routes/tests first, then implement and validate.
```

## Skill Routing Cheat Sheet

### Public Website

Start with:

- `client-intake-to-scope`
- `saas-delivery`
- `product-design`
- `ux-designer`
- `frontend-design`
- `seo-plan`

Validate with:

- `code-reviewer`
- `webapp-testing`
- `e2e-testing`
- `ai-regression-testing`
- `public-site-launch`

### SaaS / Product

Start with:

- `client-intake-to-scope`
- `saas-delivery`
- `fullstack-developer`
- `ux-designer`
- `seo-plan` when there is a marketing surface

Add as needed:

- `backend-development`
- `api-design`
- `api-hardening`
- `auth-patterns`
- `database-design`
- `database-safety`
- `analytics-instrumentation`

### Internal Tool / Dashboard

Start with:

- `client-intake-to-scope`
- `saas-delivery`
- `fullstack-developer`
- `ux-designer`

Add as needed:

- `frontend-patterns`
- `backend-patterns`
- `auth-patterns`
- `api-hardening`
- `database-safety`

### AI / Automation

Start with:

- `workflow-automation`
- `n8n-cli`
- `llm-application-dev`
- `mcp-builder` when MCP/server work exists

Validate with:

- `code-reviewer`
- `production-debugging`
- `release-train`

## When To Add New Skills

Do not add a new skill just because a topic exists.

Add a new skill only when all of these are true:

1. SkyWave cannot route the task cleanly with the current installed library.
2. The task repeats enough to justify maintenance.
3. The workflow is specialized, not just a one-off prompt.
4. The new skill would be reused across more than one project.

## Recommended New-Skill Policy

Before adding a new skill:

1. Search installed skills first.
2. Search SkyWave external sources only if installed coverage is weak.
3. Install or copy only the specific skill that fills the gap.
4. Run the validator after adding it.

## Repository Setup Template

If you want a repo to always behave correctly with SkyWave, use the template in:

[PROJECT_AGENTS_TEMPLATE.md](D:\REDA\skills\PROJECT_AGENTS_TEMPLATE.md)
