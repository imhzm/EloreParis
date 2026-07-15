---
name: websocket-patterns
description: "WebSocket server patterns, real-time communication, scaling strategies, and Redis integration."
metadata:
  version: 1.0.0
---

# WebSocket Patterns

Real-time communication for full-stack applications.

## Architecture Patterns

### 1. Socket.io Server Setup
```javascript
// server.js
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'

const io = new Server({
  cors: { origin: process.env.FRONTEND_URL },
  transports: ['websocket']
})

// Redis adapter for scaling
const pubClient = redis.createClient({ host: 'redis' })
const subClient = pubClient.duplicate()
io.adapter(createAdapter(pubClient, subClient))
```

### 2. Room-Based Communication
```javascript
io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId)
  })
  
  socket.on('message', ({ roomId, text }) => {
    io.to(roomId).emit('message', { text, sender: socket.id })
  })
})
```

### 3. PostgreSQL Integration
```javascript
// Publish events to Redis for other instances
import { createServer } from 'http'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ noServer: true })
wss.on('connection', (ws) => {
  const channel = `order_updates:${userId}`
  redis.subscribe(channel, (message) => {
    ws.send(JSON.stringify(JSON.parse(message)))
  })
})
```

## Scaling with Redis

```
Instance 1 ──┐
             ├── Redis Pub/Sub ── All Instances
Instance N ──┘
```

## Security
- JWT authentication on connection
- Rate limiting per socket
- Message validation
- CORS origin whitelist