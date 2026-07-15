---
name: fullstack-project
description: Full-stack project scaffolding from zero to deployed. Creates Next.js frontend, Node.js backend, PostgreSQL, Docker, CI/CD.
metadata:
  version: 1.0.0
---

# Full-Stack Project Scaffolding

End-to-end project setup for production.

## Stack
- Frontend: Next.js 16 (React 19)
- Backend: Node.js/Express or NestJS
- Database: PostgreSQL 16 (Docker)
- Cache: Redis 7
- Auth: JWT + Refresh tokens
- Deployment: Docker + Nginx

## Project Structure
```
project/
├── apps/
│   ├── web/          # Next.js app
│   └── api/          # Express/NestJS server
├── packages/
│   ├── db/          # Prisma/Drizzle schema
│   └── ui/          # Shared components
├── docker-compose.yml
└── turbo.json       # Monorepo orchestration
```

## Quick Start
```bash
npx create-next-app@latest --example https://github.com/Kilo-Org/fullstack-template
docker compose up -d
npm run db:migrate
npm run dev
```

Covers: auth, CRUD, real-time, deployment, testing.