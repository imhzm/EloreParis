# Security Hardening

Use this playbook for any public-facing website, app surface, authenticated flow, form, upload, API, or production release recommendation.

## Default Rule

Security and privacy are default quality layers, not optional extras.

For public-facing projects, always consider:

- input validation
- auth and authorization when relevant
- rate limiting or abuse control
- spam protection for forms
- XSS, CSRF, injection, and unsafe redirects when relevant
- secure headers and cookie posture
- secrets handling
- file upload safety
- logging without sensitive data leakage
- dependency and release hygiene
- privacy and consent expectations when tracking or user data exists

## Public Surface Checklist

Review whether the project needs:

- CAPTCHA or alternative anti-spam controls
- honeypot or server-side abuse filtering
- request throttling or rate limiting
- upload MIME and extension validation
- server-side validation even when client validation exists
- restrictive CORS and cookie settings when applicable
- security headers such as CSP, HSTS, X-Frame-Options, Referrer-Policy, and related modern equivalents

Do not force every control onto every project. Match the controls to the real attack surface.

## App and API Checklist

For authenticated or data-handling systems, consider:

- session or token strategy
- RBAC or authorization boundaries
- password handling and reset flows
- auditability for sensitive actions
- least-privilege environment configuration
- secret storage outside source code
- safe error handling
- secure defaults for public endpoints

## Privacy Checklist

When the project is public-facing or uses tracking, define:

- whether consent is required
- what data is collected
- which third parties receive data
- what legal pages or notices are needed
- whether forms or analytics introduce privacy-sensitive processing

## Reporting Rule

In the first substantive response for a public-facing or sensitive project, state protection status:

- `audit-only` if you are still assessing risks
- `implementation-ready` if the phase includes concrete hardening work
