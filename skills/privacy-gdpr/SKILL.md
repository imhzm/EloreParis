---
name: privacy-gdpr
description: "GDPR and privacy compliance implementation including consent, data handling, and user rights."
metadata:
  version: 1.0.0
---

# Privacy & GDPR Compliance

Implement privacy controls for websites and applications.

## Core Requirements

### 1. Consent Management
- Clear consent for cookies/tracking
- Opt-in for marketing communications
- Granular consent for different purposes
- Easy withdrawal of consent

### 2. Data Minimization
- Collect only necessary data
- Regular data purging schedules
- Clear data retention policy
- Purpose limitation

### 3. User Rights
- Right to access personal data
- Right to erasure (delete account)
- Right to data portability (export)
- Right to rectification (edit profile)

### 4. Privacy by Design
- Privacy impact assessments
- Data protection defaults
- Encryption of personal data
- Pseudonymization where possible

### 5. Documentation
- Privacy policy updated regularly
- Cookie policy with categories
- Data processing agreement
- Third-party processor list

### 6. Technical Measures
- HTTPOnly, Secure, SameSite cookies
- CSP + XSS protection
- Data breach notification process
- Regular security audits

## Implementation Checklist
- [ ] Cookie consent banner
- [ ] Privacy policy page
- [ ] Account deletion endpoint
- [ ] Data export feature
- [ ] Contact form for privacy requests