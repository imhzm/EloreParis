---
name: database-safety
description: Review and guide schema changes, migrations, backfills, data repairs, and query-impacting releases for safety, rollback awareness, and production stability. Use when changing tables, columns, indexes, constraints, relationships, seed data, or data-moving jobs that could affect live systems.
---

# Database Safety

Use this skill when a change can damage data, availability, or rollback ability.

Do not treat schema edits as normal code edits. Classify the migration type, production risk, data volume, and rollback path before implementing anything.

Load [references/migration-safety-checklist.md](references/migration-safety-checklist.md) for any non-trivial schema change, backfill, or data repair.

## Default Bundle

Use:

- `database-migrations`
- `database-safety`
- `backend-patterns`

Add when needed:

- `build-web-apps:supabase-postgres-best-practices`
- `code-reviewer`
- `tdd-workflow`
- `api-hardening`

## Workflow

### 1. Classify the Change

Determine whether it is:

- additive
- destructive
- data-moving
- index or performance-oriented
- consistency or constraint enforcement

### 2. Inspect Production Risk

Check:

- existing readers and writers
- expected data volume
- lock risk
- long-running migration risk
- compatibility during rollout

### 3. Plan the Safe Sequence

Prefer:

1. additive schema
2. code that supports old and new states
3. backfill or transition
4. cleanup only after the new path is proven

### 4. Make Rollback Explicit

State whether rollback is:

- direct
- partial
- forward-fix only

If the change is not safely reversible, say so directly.

### 5. Verify

Run what exists:

- migration generation or validation
- tests
- typecheck
- build

Add targeted verification for query plans, indexes, or backfill behavior when the risk is material.

## Anti-Patterns

- renaming or dropping columns before consumers migrate
- large blocking backfills inside one request path
- enforcing new constraints before bad legacy data is handled
- claiming rollback exists when the data change is destructive
- mixing unrelated schema cleanup into a live migration
