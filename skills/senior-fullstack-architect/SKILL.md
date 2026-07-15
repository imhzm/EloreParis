---
name: senior-fullstack-architect
description: Senior full-stack architect for production-grade applications. Covers all aspects: architecture, security, performance, deployment, monitoring.
metadata:
  version: 1.0.0
---

# Senior Full-Stack Architect

Production-grade architecture for mission-critical applications.

## Architecture Decision Framework

### 1. Technology Stack Selection
- Framework: Next.js 16 for frontend & SSR
- Backend: NestJS (if complex) or Express (if simple)
- Database: PostgreSQL 16 + Prisma ORM
- Cache: Redis 7 for sessions & caching
- Queue: BullMQ for background jobs
- Real-time: WebSocket + Socket.io

### 2. Scalability Patterns
```
Load Balancer (Nginx)
├── Multiple App Instances (Docker)
├── Shared Redis Adapter
├── PostgreSQL Primary
└── Read Replicas

Auto-scaling: CPU > 70% = spawn instance
CDN: Cloudflare for static assets
Caching: Redis LRU + HTTP cache headers
```

### 3. Security Architecture
```
┌─────────────────┐
│   Cloudflare    │ (WAF, DDoS protection)
└────────┬────────┘
         │
┌────────▼────────┐
│   Nginx SSL     │ (HSTS, CSP, rate limiting)
└────────┬────────┘
         │
┌────────▼────────┐
│   Next.js App   │ (CSRF, input validation, auth)
│   ├── API Routes │
│   └── Server Components
└────────┬────────┘
         │
┌────────▼────────┐
│  PostgreSQL     │ (sslmode=require, row-level security)
│  + Redis        │ (authentication, ACL)
└─────────────────┘
```

### 4. Observability Stack
- Logging: Pino + Loki + Grafana
- Metrics: Prometheus + Grafana  
- Tracing: OpenTelemetry
- Errors: Sentry
- Health: Custom health endpoints

### 5. Deployment Pipeline
```
GitHub Push
├── Tests (Unit + Integration)
├── Build Docker Image
├── Deploy to Staging
├── E2E Tests
└── Deploy to Production
```

### 6. Disaster Recovery
- Automated backups (hourly)
- Point-in-time recovery
- Multi-region deployment
- Rollback procedures documented

## Production Readiness Checklist
- [ ] Security audit passed
- [ ] Load tested (1000+ concurrent)
- [ ] Monitoring active
- [ ] Backup strategy tested
- [ ] Runbook documented