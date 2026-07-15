---
name: owasp-protection
description: "OWASP Top 10 vulnerability protection. Use for any web application development, code review for security, or security hardening tasks."
metadata:
  version: 1.0.0
  author: "OWASP Foundation"
---

# OWASP Top 10 Protection

Apply OWASP security best practices to prevent common web vulnerabilities.

## The OWASP Top 10 (2021)

### 1. Broken Access Control
- Implement role-based access control (RBAC)
- Deny by default
- Validate permissions on every request
- Log access failures

### 2. Cryptographic Failures
- Use bcrypt/Argon2 for passwords
- TLS for all traffic
- Encrypt sensitive data at rest
- Never store secrets in code

### 3. Injection
- Parameterized queries for all SQL
- Escape all user input
- Use ORM when possible
- Validate input types

### 4. Insecure Design
- Threat modeling during design
- Security requirements in specs
- Defense in depth
- Secure by default

### 5. Security Misconfiguration
- Minimal privileges
- Disable debug mode in production
- Security headers (CSP, HSTS, X-Frame-Options)
- Regular security scanning

### 6. Vulnerable Components
- Update dependencies regularly
- Use `npm audit` or `snyk`
- Pin dependency versions
- Remove unused packages

### 7. Identification & Authentication
- Multi-factor authentication
- Session timeout
- Account lockout after failed attempts
- Secure password reset

### 8. Software & Data Integrity
- Code signing
- Immutable infrastructure
- CI/CD security
- Supply chain protection

### 9. Security Logging
- Log security events
- Don't log sensitive data
- Alert on anomalies
- Centralized logging

### 10. Server-Side Request Forgery
- Validate URLs
- Whitelist endpoints
- Network segmentation

## Security Checklist

- [ ] Input validation on all user data
- [ ] Output encoding for HTML/JS/SQL
- [ ] Authentication on every protected route
- [ ] Authorization checks before operations
- [ ] No secrets in environment variables
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Dependencies audited