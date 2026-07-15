---
name: performance-web
description: Web performance optimization including Core Web Vitals, image optimization, caching, and database query tuning.
metadata:
  version: 1.0.0
---

# Performance Optimization

Optimization patterns for full-stack applications.

## Frontend Performance

### Image Optimization
- Next.js Image component for automatic optimization
- WebP format preferred
- Lazy loading for below-fold images
- Responsive images with srcSet

### Code Splitting
```javascript
// Dynamic imports for large components
const ProductCatalog = dynamic(() => import('./ProductCatalog'), {
  loading: () => <Loading />,
  ssr: false
})
```

### Caching Strategies
- SWR for client-side data fetching
- Redis caching for API routes
- CDN for static assets

## Backend Performance

### Database Query Optimization
```sql
-- Indexes on frequently queried columns
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);
```

### Connection Pooling
```javascript
// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000
})
```

### Response Compression
```javascript
// Express compression
app.use(compression({
  level: 6,
  threshold: 1024
}))
```

## Core Web Vitals Targets
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1