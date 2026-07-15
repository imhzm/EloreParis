# API Hardening Checklist

## Contract

- Validate body, params, query, headers, and content type.
- Return stable response shapes.
- Use explicit status codes for validation, auth, not found, conflict, and rate issues.

## Auth and Permissions

- Authenticate before business logic.
- Authorize against server-owned facts, not client assertions.
- Check tenant, role, ownership, and scope boundaries.

## Safety

- Add idempotency for retryable writes where needed.
- Bound pagination, batch size, and upload size.
- Limit expensive filters and unindexed queries.
- Handle external provider failures explicitly.

## Errors and Logging

- Do not leak stack traces or provider secrets.
- Log enough context to debug request paths safely.
- Avoid logging raw credentials, tokens, cookies, or sensitive payloads.

## Verification

- Happy path
- Invalid input
- Missing auth
- Forbidden access
- Duplicate or retried request
- Failure from dependencies
