# Delivery and Validation

Use this playbook after implementation or when preparing a phase handoff.

## Reporting Rule

Never claim work is complete without stating what was actually verified.

If a check was not run, say:

- what was not run
- why it was not run
- what still needs verification

## Validation Ladder

## 1. Discovery and Planning

Verify:

- the project type is correctly identified
- the current phase is explicit
- active skills are stated
- assumptions and exclusions are visible

## 2. Public Surface and UX

Verify:

- sitemap and page purpose are coherent
- section structure supports user intent
- CTA hierarchy is clear
- responsive and accessibility concerns are identified
- performance expectations are identified
- analytics and conversion requirements are explicit
- security/privacy expectations are explicit

## 3. Engineering

Run what applies:

- lint
- typecheck
- unit or integration tests
- end-to-end tests
- build

Prefer fixing failures before reporting completion.

## 4. Security, Privacy, Performance, and Analytics

Verify:

- input validation and abuse-risk considerations are covered where relevant
- auth, authorization, or form protection is addressed when applicable
- secrets handling and sensitive logging are not careless
- secure headers, upload rules, or rate limiting are considered when relevant
- performance and Core Web Vitals expectations are identified
- accessibility issues are not ignored on public flows
- analytics events and conversion tracking are defined intentionally
- monitoring and alerting expectations are explicit for production systems

## 5. SEO, Schema, and Editorial

Verify:

- metadata approach is defined
- schema inventory exists for public pages
- schema types match real page purpose
- internal linking and entity strategy are coherent
- public content state is explicitly `sample-based` or `provisional`
- public-facing copy is not marked final without samples when samples are required

## 6. Release

Verify:

- hosting or deployment target is explicit
- environment assumptions are called out
- monitoring or observability expectations are defined when relevant
- rollback or safe iteration path is understood for production changes

## Default Acceptance Criteria

For a public-facing project, the work is not truly ready unless it is:

- structurally coherent
- visually intentional
- technically validated
- schema-aware
- SEO/AEO/GEO aware
- security-aware
- privacy-aware
- analytics-aware
- performance-aware
- honest about content readiness
