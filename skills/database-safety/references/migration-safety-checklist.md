# Migration Safety Checklist

## Before Editing

- What reads and writes this data today?
- Is the change additive, destructive, or data-moving?
- What is the estimated row count and lock risk?

## Safe Rollout

- Add new structures first.
- Keep old and new code paths compatible during rollout.
- Backfill separately from critical traffic where possible.
- Drop or tighten only after the new path is proven.

## Rollback

- Can code roll back without schema rollback?
- Can schema roll back without data loss?
- If not, is the plan a forward fix?

## Validation

- Migration applies cleanly
- Tests pass
- Performance impact is acceptable
- Backfill or repair script is idempotent when possible
