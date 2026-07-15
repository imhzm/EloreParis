---
name: api-security
description: "API security hardening including authentication, rate limiting, input validation, and monitoring."
metadata:
  version: 1.0.0
---

# API Security Hardening

Secure REST/GraphQL APIs against common threats.

## Security Layers

### 1. Authentication
- JWT tokens with short expiration (15-30 min)
- Refresh token rotation
- API keys hashed in database
- OAuth 2.0 with PKCE for public clients

### 2. Rate Limiting
- 100 req/min per IP by default
- Stricter limits on sensitive endpoints
- Exponential backoff on repeated failures
- Global and per-endpoint limits

### 3. Input Validation
- JSON schema validation
- Type checking on all inputs
- SQL injection prevention via ORM/prepared statements
- XSS prevention with output encoding

### 4. Authorization
- Role-based access (RBAC)
- Resource ownership validation
- Scope claims in JWT
- Least privilege principle

### 5. Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'none'
```

### 6. Monitoring
- Log all failed authentication attempts
- Alert on rate limit violations
- Audit trail for sensitive operations
- Error responses without stack traces

### 7. Data Protection
- Encrypt at rest for PII
- No secrets in logs
- CORS whitelist only required origins
- Disable unused HTTP methods