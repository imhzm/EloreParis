---
name: saas-delivery
description: Coordinate production-grade delivery for SaaS features that span product scope, frontend, backend, auth, data, validation, release, and monitoring. Use when building or changing account flows, billing, dashboards, onboarding, admin tools, feature launches, or any multi-layer SaaS slice that must ship safely without over-scoping.
---

# SaaS Delivery

Use this skill as the control layer for shipping one SaaS slice at a time.

Do not treat it as a replacement for implementation skills. Use it to frame the work, choose the right specialist skills, keep scope tight, and hold the release bar.

Load [references/delivery-checklist.md](references/delivery-checklist.md) when the request is medium or large, touches multiple layers, or needs a release-ready checklist.

## Operating Rules

1. Define the product slice before writing code.
2. Prefer one user-visible outcome per cycle.
3. Inspect existing contracts, data flow, auth, and failure modes before changing anything.
4. Keep the smallest change that solves the target slice correctly.
5. Separate delivery into phases: scope -> design -> implementation -> validation -> release.
6. Do not claim readiness without real checks.

## First Response

For medium or large work, state:

- delivery slice
- current phase
- active skills
- expected output
- release risk level: `low`, `medium`, or `high`

## Routing

### Product and UX Shape

Use:

- `product-design`
- `ux-designer`
- `frontend-design`

Add `content-strategy` or `copywriting` only when the slice changes user-facing messaging.

### Product Engineering

Use:

- `fullstack-developer`
- `frontend-patterns`
- `backend-patterns`
- `api-design`

Add when needed:

- `auth-patterns`
- `database-migrations`
- `openapi-spec-generation`
- `build-web-apps:react-best-practices`
- `composition-patterns`
- `build-web-apps:stripe-best-practices`
- `build-web-apps:supabase-postgres-best-practices`

### Validation

Use:

- `tdd-workflow`
- `code-reviewer`
- `e2e-testing`

Add `ai-regression-testing` when the change touches generated content, prompts, or automation logic.

### Release

Use:

- `deployment-patterns`
- `ci-cd`
- `sentry`

Choose the actual hosting skill only if deployment work is in scope.

## Delivery Workflow

### 1. Frame the Slice

Capture only what matters:

- user or operator outcome
- in-scope pages, routes, jobs, tables, events, and permissions
- explicit non-goals
- rollback or fallback expectation

If the request is broad, shrink it into the smallest releasable slice.

### 2. Map the Change Surface

Inspect:

- entrypoints and user flows
- server endpoints and jobs
- schemas, migrations, and contracts
- auth and authorization boundaries
- analytics and business-critical events

### 3. Choose the Active Bundle

Keep the bundle focused, usually:

- one planning skill
- one or two implementation skills
- one validation skill

Add specialist skills only for real dependencies such as billing, auth, or deployment.

### 4. Implement in Safe Order

Preferred order:

1. contract or data foundation
2. backend behavior
3. frontend integration
4. validation and edge states
5. release-specific wiring

### 5. Hold the Release Bar

Before calling the slice ready, verify what is available:

- lint
- typecheck
- unit or integration tests
- e2e or flow verification
- build
- migration safety if applicable

### 6. Ship with Operational Awareness

State:

- what changed
- how it was validated
- known residual risks
- rollback or containment path

## Anti-Patterns

- shipping a whole roadmap in one pass
- mixing feature work with unrelated refactors
- adding infra or dependencies without necessity
- changing contracts without checking consumers
- claiming release readiness without actual verification
