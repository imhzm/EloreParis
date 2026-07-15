---
name: redis-patterns
description: "Redis caching, session management, pub/sub, and performance optimization patterns."
metadata:
  version: 1.0.0
---

# Redis Patterns

Production patterns for Redis in full-stack applications.

## Core Patterns

### 1. Session Store
```javascript
// Express + Redis sessions
import session from 'express-session'
import connectRedis from 'connect-redis'

app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}))
```

### 2. Caching Strategy
```javascript
const cacheKey = `products:${categoryId}:page:${page}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

const data = await db.query(...)
await redis.setex(cacheKey, 300, JSON.stringify(data)) // 5min cache
```

### 3. Rate Limiting
```javascript
const rateLimit = async (req, res, next) => {
  const key = `rate:${req.ip}:${req.path}`
  const current = await redis.incr(key)
  if (current === 1) await redis.expire(key, 60)
  if (current > 100) return res.status(429).json({ error: 'Rate limited' })
  next()
}
```

### 4. Pub/Sub for WebSocket
```javascript
// Publish
await redis.publish('order_updates', JSON.stringify({ orderId, status }))

// Subscribe
redis.subscribe('order_updates', (message) => {
  io.to(`order_${orderId}`).emit('status_update', JSON.parse(message))
})
```

## Redis Configuration
- Maxmemory-policy: allkeys-lru
- Persistence: RDB every 5min
- Connection pooling
- TTL on all keys