---
name: backend-patterns
description: "Backend architecture patterns for Node.js, Go, Python APIs with PostgreSQL and Redis."
metadata:
  version: 1.0.0
---

# Backend Architecture Patterns

Patterns for scalable full-stack applications.

## Architecture Layers

### 1. Repository Pattern (Data Access)
- Separate data access logic
- Easy testing with mocks
- Clean business logic

### 2. Service Layer
- Business logic encapsulation
- Reusable across endpoints
- Clear error handling

### 3. Controller/Handler
- Request validation
- Response formatting
- Thin orchestration

### 4. Middleware Chain
- Auth middleware first
- Rate limiting
- Logging
- Error handling last

## WebSocket Patterns

### Connection Management
- User presence tracking
- Room-based broadcasting
- Graceful disconnect
- Heartbeat pings

### Message Patterns
- Acknowledgment for critical messages
- Event sourcing
- Replay capability
- Compression for large payloads

## Redis Patterns

### Caching Strategy
- Cache-aside for read-heavy
- Write-through for consistency
- TTL with jitter
- Cache warming on startup

### Session Storage
- JWT + Redis blacklist
- User presence online/offline
- Rate limiting counters
- Pub/Sub for real-time updates

## PostgreSQL + Redis Hybrid

### Read-Write Splitting
- Writes to PostgreSQL
- Reads from Redis cache
- Invalidate on update
- Fallback to DB on cache miss

## Error Handling
- Centralized error types
- HTTP status codes correct
- Sensitive data scrubbed
- Problem details format (RFC 7807)