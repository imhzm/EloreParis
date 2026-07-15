---
name: production-debugging
description: Investigate production bugs, incidents, outages, and hard-to-reproduce regressions with disciplined evidence gathering, blast-radius control, rollback awareness, and verification. Use when users report that something broke in production, logs are noisy, metrics regressed, or a fix must be found without guessing.
---

# Production Debugging

Use this skill to debug real incidents without storytelling or guesswork.

Prioritize containment and evidence before invasive code changes. Treat every claimed root cause as unproven until it matches observable facts.

Load [references/incident-loop.md](references/incident-loop.md) for non-trivial incidents, intermittent regressions, or production-only failures.

## Default Bundle

Use:

- `code-reviewer`
- `sentry`
- `backend-patterns`

Add when needed:

- `frontend-patterns`
- `playwright`
- `e2e-testing`
- `security-best-practices`
- `gh-fix-ci`

## First Response

State:

- symptom
- affected surface
- suspected blast radius
- current phase: `containment`, `reproduction`, `isolation`, `fix`, or `verification`
- evidence quality: `weak`, `partial`, or `strong`

## Investigation Workflow

### 1. Stabilize

Before fixing, determine whether to:

- roll back
- disable a feature
- gate traffic
- leave production unchanged while investigating

If the user did not ask for operational action, still state the safest containment option.

### 2. Build the Timeline

Collect:

- when it started
- what changed near that time
- whether the issue is global, tenant-specific, user-specific, or data-specific
- logs, traces, metrics, and screenshots that confirm the symptom

### 3. Reduce the Problem

Convert vague reports into a smallest reproducible statement:

- exact endpoint, screen, or job
- exact input or actor
- expected behavior
- actual behavior

### 4. Test Competing Hypotheses

Do not anchor on the first likely explanation. Prefer:

1. identify 2-3 plausible causes
2. eliminate them with evidence
3. keep only the one that matches the facts

### 5. Fix Safely

Prefer the smallest fix that:

- addresses the proven failure mode
- preserves existing behavior elsewhere
- adds verification around the regression

### 6. Verify and Close the Loop

Run all checks that matter:

- targeted tests
- broader regression checks
- build or deploy checks if relevant

Then report:

- confirmed root cause or best-supported inference
- exact fix
- residual uncertainty
- monitoring to watch after release

## Anti-Patterns

- guessing root cause from one log line
- shipping a refactor during an incident
- widening scope while the symptom is still not reproduced
- declaring success before verification
- hiding uncertainty when evidence is incomplete
