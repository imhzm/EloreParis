---
name: release-train
description: Coordinate release readiness, change windows, verification gates, rollback planning, and post-release watchpoints for software changes. Use when preparing a feature, hotfix, migration, public-site launch, or multi-part deployment for staging or production release.
---

# Release Train

Use this skill when the question is no longer just "does the code work?" but "can this change ship safely now?"

This skill is the coordination layer for release readiness, rollback clarity, and post-release observation.

Load [references/release-gates.md](references/release-gates.md) when a task is close to deploy, spans multiple repos or services, or includes migrations, flags, or public launch dependencies.

## Default Bundle

Use:

- `release-train`
- `deployment-patterns`
- `ci-cd`

Add when needed:

- `saas-delivery`
- `public-site-launch`
- `database-safety`
- `sentry`
- `gh-fix-ci`

## Workflow

### 1. Define the Release Unit

Capture:

- what is shipping
- environments affected
- dependent migrations, flags, env vars, or external services
- whether this is standard, risky, or emergency

### 2. Check Gates

Verify:

- code validation status
- deploy prerequisites
- monitoring visibility
- rollback path
- owner handoff or watch expectations

### 3. Sequence the Release

Order matters. Prefer:

1. prerequisites and config
2. additive infra or schema
3. application deploy
4. feature enablement
5. smoke checks

### 4. State Rollback Clearly

List:

- what can be rolled back directly
- what needs forward-fix instead
- which steps are irreversible once executed

### 5. Watch the Right Signals

Define:

- the errors to watch
- the funnel or business metrics to watch
- the time window for active observation

## Anti-Patterns

- deploying without a known rollback path
- treating green CI as the whole release bar
- enabling a flag without smoke-checking the path
- shipping migrations and app changes with no sequencing plan
- closing the task before post-release signals are checked
