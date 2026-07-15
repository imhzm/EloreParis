---
name: deployment-checklist
description: "Production deployment checklist covering security, performance, monitoring, and rollback procedures."
metadata:
  version: 1.0.0
---

# Deployment Checklist

Production readiness checklist for full-stack applications.

## Pre-Deployment

### 1. Security
- [ ] SSL/TLS configured
- [ ] Security headers set (CSP, HSTS, X-Frame-Options)
- [ ] Secrets in environment variables only
- [ ] Database connection encrypted
- [ ] Rate limiting enabled

### 2. Performance
- [ ] Compression enabled (gzip/brotli)
- [ ] Database indexes verified
- [ ] Redis caching configured
- [ ] Static assets CDN-ready
- [ ] Images optimized

### 3. Monitoring
- [ ] Health check endpoints (/health, /ready)
- [ ] Error tracking (Sentry, Logflare)
- [ ] Performance metrics (Lighthouse >90)
- [ ] Uptime monitoring configured
- [ ] Log aggregation (ELK, Papertrail)

### 4. Database
- [ ] Migrations run
- [ ] Backups scheduled
- [ ] Connection pooling configured
- [ ] Read replicas if needed

### 5. Rollback Plan
- [ ] Previous version tagged
- [ ] Database rollback procedure
- [ ] Feature flags ready
- [ ] Emergency contact list

## Post-Deployment

- [ ] Smoke tests pass
- [ ] Monitoring alerts verified
- [ ] SSL certificate valid
- [ ] CDN cache warmed
- [ ] Team notified