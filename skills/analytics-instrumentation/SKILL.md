---
name: analytics-instrumentation
description: Design and verify analytics instrumentation for user journeys, funnels, conversions, and operational events without creating blind spots or noisy telemetry. Use when adding or auditing tracking for websites, SaaS flows, onboarding, forms, checkout, dashboards, feature adoption, or experiments that need measurable outcomes.
---

# Analytics Instrumentation

Use this skill to make product behavior measurable in a way that is useful for decisions, not just easy to implement.

Do not start with random event names. Start with business questions, conversion points, and the minimum event set that can answer them.

Load [references/event-design-checklist.md](references/event-design-checklist.md) when the task changes public-site funnels, onboarding, billing, product adoption, or lifecycle reporting.

## Default Bundle

Use:

- `analytics-instrumentation`
- `frontend-patterns`
- `backend-patterns`

Add when needed:

- `public-site-launch`
- `saas-delivery`
- `code-reviewer`
- `e2e-testing`

## Workflow

### 1. Start from Decisions

Define:

- what question the team wants to answer
- primary conversion or activation action
- secondary supporting steps
- which actors matter: anonymous, signed-in, admin, operator

### 2. Map the Journey

Identify:

- entrypoint
- key step transitions
- success condition
- failure and abandonment points

### 3. Design the Event Set

Prefer a small clean set:

- page or screen view only when it is meaningful
- intent event for key CTA
- submit or start event
- success event
- failure event when useful for debugging or conversion analysis

Avoid duplicate or redundant events across client and server unless both are intentionally needed.

### 4. Define Properties Carefully

Keep properties:

- stable
- non-sensitive
- useful for segmentation or debugging

Do not track raw secrets, personal content, or unnecessary identifiers.

### 5. Verify the Instrumentation

Check:

- event fires exactly where expected
- no duplicate firing on rerender or retries
- success and failure paths are both measurable
- naming is consistent with the existing event taxonomy

## Anti-Patterns

- event naming based on UI copy
- tracking everything instead of key decisions
- sending PII or secrets in properties
- counting both client and server events as the same metric without a plan
- shipping conversion flows with no measurement for drop-off
