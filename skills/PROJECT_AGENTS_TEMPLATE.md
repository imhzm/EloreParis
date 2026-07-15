# AGENTS.md Template For Any Repo

Copy this into a repository-level `AGENTS.md` when you want SkyWave to be the default orchestration layer for that repo.

```md
# Workspace Instructions

Use `$skywave` as the default entrypoint for every medium or large project in this workspace unless a closer repository-level `AGENTS.md` gives stronger instructions.

SkyWave must route work by phase:

- discovery
- design and architecture
- implementation
- validation
- release
- growth and automation

Keep the active skill set focused. Do not load or activate every installed or external skill at once.

For public-facing websites, landing pages, SaaS marketing surfaces, blogs, local-business sites, and brand websites, treat these layers as default:

- UI/UX
- SEO, AEO, GEO
- blog/content system when relevant
- schema/entity strategy
- human-content QA
- security and privacy
- performance and Core Web Vitals
- accessibility
- analytics and conversion tracking
- release, monitoring, and rollback readiness

Use external source skills only when installed skills are not enough or the user explicitly asks for skill-pack research.

Validation remains mandatory after code changes: run the relevant lint, typecheck, tests, build, or task-specific checks whenever available.
```

## Recommended User Prompt For New Repos

After adding the file, start with:

```text
Use SkyWave in this project.
Inspect the codebase first.
Identify the current phase.
Choose only the relevant skills for this phase.
Then do the smallest correct production-grade change and validate it.
```

## Recommended User Prompt For Brand-New Projects

```text
Use SkyWave in this project.
Treat it as a new project.
Start with discovery only.
I want a brief, sitemap, user flow, section plan, active skills, and assumptions before code.
```
