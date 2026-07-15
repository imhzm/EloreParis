# Release Gates

## Readiness

- Code checks passed or exceptions documented
- Required env vars and secrets exist
- Feature flags and config dependencies are known

## Sequencing

- Schema and app rollout order is explicit
- Irreversible steps are called out
- Smoke tests are identified

## Rollback

- Direct rollback path exists, or forward-fix is documented
- Owner knows when to stop rollout

## Observation

- Error monitoring is available
- Main funnel or critical metric is identified
- Watch window is agreed
