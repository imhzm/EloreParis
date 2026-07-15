# SaaS Delivery Checklist

Use this checklist when the task spans multiple layers or is close to release.

## Scope

- Define one releasable slice.
- Record explicit non-goals.
- Confirm who is affected: anonymous, authenticated, admin, operator, background jobs.

## Design and Contracts

- Verify existing routes, actions, jobs, and events.
- Check schema impact and migration needs.
- Check authn/authz impact.
- Check analytics, billing, or notification side effects.

## Implementation

- Prefer existing abstractions before adding new ones.
- Keep changes incremental and reviewable.
- Handle loading, empty, success, and error states on user-facing flows.
- Avoid silent failures and hidden partial success paths.

## Validation

- Lint
- Typecheck
- Tests
- Build
- Migration safety
- Manual flow check if automation is unavailable

## Release

- List environment or secret dependencies.
- Note monitoring signals to watch after release.
- Define rollback or disable path.
