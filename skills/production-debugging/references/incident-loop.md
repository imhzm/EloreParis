# Incident Loop

Use this loop for production bugs, outages, and regressions.

## 1. Containment

- Is there a rollback, flag, or kill switch?
- Can damage continue while debugging?
- What user or business flow is at risk?

## 2. Evidence

- Logs
- Metrics
- Traces
- Error aggregation
- Recent deploys, migrations, config changes

## 3. Reproduction

- Identify the smallest reproducible path.
- Prefer real inputs with sensitive data removed.
- Distinguish environment-specific failures from deterministic code bugs.

## 4. Isolation

- Compare known-good vs failing path.
- Check config, dependency versions, data shape, and timing assumptions.
- Narrow to one subsystem before editing code.

## 5. Fix

- Choose the smallest reversible change.
- Add guards or tests around the proven failure mode.

## 6. Verification

- Re-run the failing path.
- Re-run nearby regression checks.
- State what remains unverified.
