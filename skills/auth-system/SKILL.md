---
name: auth-system
description: "Authentication and authorization system design and implementation. Use for JWT, OAuth, session management, and role-based access."
metadata:
  version: 1.0.0
---

# Authentication System

Full-stack authentication patterns for Next.js applications.

## JWT + Refresh Token Pattern

```javascript
// auth.config.ts
export const authConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '15m',
  refreshExpiresIn: '7d'
}

// middleware.ts (Next.js 13+)
import { verifyToken } from '@/lib/auth'
export async function middleware(req) {
  const token = req.cookies.get('token')
  if (!token || !(await verifyToken(token))) {
    return NextResponse.redirect('/login')
  }
}
```

## Role-Based Access Control

```typescript
// middleware/rbac.ts
const roles = {
  ADMIN: ['create', 'read', 'update', 'delete'],
  MANAGER: ['read', 'update'],
  CUSTOMER: ['read']
}

export function checkPermission(userRole: string, action: string) {
  return roles[userRole as keyof typeof roles]?.includes(action)
}
```

## Session Management with Redis

- HttpOnly cookies for tokens
- Session cleanup on logout
- Concurrent session limits
- Email verification flow