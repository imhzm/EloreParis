---
name: api-hardening
description: Harden existing or new API surfaces for correctness, security, abuse resistance, compatibility, and operational safety. Use when reviewing or implementing REST, RPC, webhook, auth, admin, or internal service endpoints that need stronger validation, authorization, idempotency, error handling, rate protection, or safer logging before release.
---

# API Hardening

Use this skill when an API must be safe to expose, maintain, and operate.

Do not jump straight to code. First classify the endpoint, caller trust level, data sensitivity, and compatibility risk.

Load [references/hardening-checklist.md](references/hardening-checklist.md) when the task involves public endpoints, auth, webhooks, billing, file upload, or any externally reachable API.

## Default Bundle

Use:

- `api-design`
- `backend-patterns`
- `security-best-practices`

Add when needed:

- `auth-patterns`
- `database-migrations`
- `openapi-spec-generation`
- `code-reviewer`
- `tdd-workflow`

## Workflow

### 1. Classify the Surface

Identify:

- endpoint type: public, authenticated, admin, internal, webhook
- sensitive operations: money, identity, permission changes, file handling, bulk actions
- contract risk: existing consumers, retries, ordering, backward compatibility

### 2. Inspect the Current Contract

Check:

- request shape and validation
- response shape and status codes
- existing authn and authz behavior
- rate or abuse controls
- logging and error exposure
- retry and idempotency behavior

### 3. Harden the Critical Paths

Apply the smallest correct changes in this order:

1. validate input and reject malformed data early
2. enforce authentication and authorization
3. prevent unsafe side effects on retries or duplicate requests
4. normalize error handling and response codes
5. remove sensitive data from logs and error payloads
6. add rate, replay, or abuse protections where appropriate

### 4. Check Operational Safety

Confirm:

- timeouts and retries are bounded
- external calls fail safely
- audit or diagnostic logging is useful but not sensitive
- expensive queries or loops are controlled

### 5. Verify

Run what exists and add tests when the gap is material:

- unit tests for validation and auth gates
- integration tests for real endpoint behavior
- typecheck
- build

## Threat Prompts

Ask these questions before finalizing:

- Can an untrusted caller send more than expected?
- Can a trusted caller do more than they should?
- Can the same request execute twice dangerously?
- Can the endpoint leak internal details or sensitive data?
- Can malformed or huge payloads degrade the service?

## Anti-Patterns

- trusting client-provided flags or identifiers without server checks
- returning raw internal errors
- logging tokens, secrets, or personal data
- adding breaking response changes without contract review
- skipping idempotency on retry-prone write paths
