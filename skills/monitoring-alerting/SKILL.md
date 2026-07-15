---
name: monitoring-alerting
description: Application monitoring, logging, and alerting setup using Sentry, Logflare, and health checks.
metadata:
  version: 1.0.0
---

# Monitoring & Alerting

Production observability for full-stack applications.

## Logging Stack

### Structured Logging
```typescript
// lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname
    })
  }
})

// Usage
logger.info({ userId, action: 'login' }, 'User logged in')
logger.error({ error: err.message, stack: err.stack }, 'Database error')
```

### Request Tracing
```typescript
// middleware/logging.ts
app.use((req, res, next) => {
  const traceId = crypto.randomUUID()
  req.headers['x-trace-id'] = traceId
  logger.info({ traceId, path: req.path, method: req.method }, 'Request started')
  
  res.on('finish', () => {
    logger.info({ traceId, status: res.statusCode }, 'Request completed')
  })
  
  next()
})
```

## Error Tracking

### Sentry Setup
```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  ignoreErrors: ['ResizeObserver loop limit exceeded']
})
```

## Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    db.query('SELECT 1'),
    redis.ping(),
    fetch('http://localhost:3000'),
  ])
  
  const healthy = checks.every(c => c.status === 'fulfilled')
  
  return NextResponse.json(
    { status: healthy ? 'healthy' : 'unhealthy', timestamp: new Date() },
    { status: healthy ? 200 : 503 }
  )
}
```

## Alerting Rules
- 5xx errors > 1% in 5 minutes
- Response time > 2s for 95th percentile
- Database connection failures
- Auth failure spikes