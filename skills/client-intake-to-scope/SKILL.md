---
name: client-intake-to-scope
description: Turn messy client requests, briefs, chats, and partial requirements into a scoped engineering plan with assumptions, risks, phases, and acceptance criteria. Use when a request is underspecified, commercially vague, or mixes product, design, content, and engineering needs into one unclear ask.
---

# Client Intake to Scope

Use this skill before implementation when the brief is real but the scope is not.

The goal is to reduce ambiguity fast without bloating the project. Convert the input into a buildable scope with explicit assumptions and a safe first phase.

Load [references/scoping-checklist.md](references/scoping-checklist.md) when the request comes from a client brief, sales handoff, WhatsApp-style notes, discovery call notes, or a vague multi-part request.

## Default Bundle

Use:

- `client-intake-to-scope`
- `product-design`
- `ux-designer`

Add when needed:

- `seo-plan`
- `content-strategy`
- `saas-delivery`
- `public-site-launch`
- `api-hardening`

## Workflow

### 1. Normalize the Brief

Extract:

- business goal
- target users
- primary action or conversion
- required surfaces: public site, dashboard, mobile app, API, automation
- explicit deliverables

### 2. Separate Facts from Assumptions

Create two lists:

- confirmed requirements
- assumptions required to move forward

Do not present assumptions as facts.

### 3. Shrink to the First Safe Phase

If the ask is broad, define:

- phase 1
- later phases
- out-of-scope items

### 4. Define Acceptance

For each major deliverable, state what "done" means in observable terms.

### 5. Surface Risks Early

Call out:

- unclear integrations
- content dependencies
- missing brand inputs
- auth, payment, or migration risk
- timeline risk from scope coupling

## Output Shape

When using this skill, prefer output in this order:

1. problem understanding
2. scoped objective
3. assumptions
4. sitemap or system surface
5. phased plan
6. risks and open questions

## Anti-Patterns

- turning one vague request into a huge build commitment
- mixing confirmed requirements with inferred ones
- starting code before phase boundaries are clear
- hiding missing inputs that will block delivery later
