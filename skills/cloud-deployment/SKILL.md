---
name: cloud-deployment
description: Cloud deployment across Vercel, Netlify, Cloudflare, Railway, Render, and AWS for full-stack applications.
metadata:
  version: 1.0.0
---

# Cloud Deployment

Multi-platform deployment strategies.

## Platform Comparison

### Vercel (Recommended for Next.js)
- Zero-config deployments
- Edge network
- Serverless functions
- Automatic HTTPS

### Docker Deployment (Any VPS)
- Full control
- Custom configurations
- Cost optimization
- Nginx reverse proxy

## Docker Production Setup

```yaml
# docker-compose.prod.yml
services:
  app:
    build:
      context: .
      target: production
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/sites:/etc/nginx/sites
    depends_on:
      - app

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"

volumes:
  postgres_data:
  redis_data:
```

## Nginx Configuration

```nginx
# nginx/sites/app.conf
upstream app {
    server app:3000;
}

server {
    listen 80;
    server_name market-alzaeem.com;
    
    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /ws {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Environment Variables
- DATABASE_URL
- REDIS_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- API keys (encrypted)