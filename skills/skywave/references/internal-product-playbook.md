# Internal Product Playbook

Use this playbook for internal tools, admin panels, dashboards, ops systems, and employee-facing applications.

## Default Layers

- workflow clarity
- role and permission boundaries
- API and data safety
- operational visibility
- validation and release readiness

Add analytics only when it helps measure adoption, workflow throughput, or operational outcomes.

## Start Order

1. actors, roles, and permissions
2. core workflows and module map
3. data and API contracts
4. degraded states, error handling, and operational visibility
5. validation, release, and rollback expectations

## Scope Rules

- Prefer the smallest safe workflow slice.
- Separate employee-facing requirements from admin-only requirements.
- Do not import public-site defaults like blog, editorial copy, or schema-first SEO unless the surface is actually public.

## Quality Expectations

Verify:

- authn and authz are explicit
- workflows are traceable and recoverable
- data mutations are validated and reversible where possible
- empty, loading, and error states exist for key screens
- monitoring, logs, or audit signals are not omitted on business-critical flows
- release and rollback expectations are known
