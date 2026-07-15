---
name: nextjs-patterns
description: Next.js 16 patterns including App Router, Server Components, Streaming, Caching, Middleware, and Deployment.
metadata:
  version: 1.0.0
---

# Next.js 16 Patterns

Production patterns for Next.js full-stack applications.

## App Router Structure

```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (main)/
│   ├── products/
│   ├── cart/
│   └── checkout/
├── api/
│   ├── auth/
│   ├── products/
│   └── webhooks/
├── layout.tsx
└── page.tsx
```

## Server Components

```tsx
// app/products/page.tsx - Server Component (default)
import { Suspense } from 'react'

export default async function ProductsPage() {
  const products = await db.product.findMany()
  
  return (
    <Suspense fallback={<Loading />}>
      <ProductList products={products} />
    </Suspense>
  )
}
```

## Route Handlers (API)

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const products = await db.product.findMany()
  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const product = await db.product.create({ data: body })
  return NextResponse.json(product, { status: 201 })
}
```

## Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  if (!token && request.nextUrl.pathname.startsWith('/protected')) {
    return NextResponse.redirect('/login')
  }
}

export const config = {
  matcher: ['/protected/:path*', '/api/:path*']
}
```

## Caching

```typescript
// Cache headers
export const revalidate = 300 // ISR

// Dynamic cache control
const res = NextResponse.next()
res.headers.set('Cache-Control', 'public, max-age=3600')
return res
```

## Deployment

```dockerfile
# Multi-stage Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```