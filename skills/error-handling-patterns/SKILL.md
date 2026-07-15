---
name: error-handling-patterns
description: Error handling and logging patterns for production full-stack applications.
metadata:
  version: 1.0.0
---

# Error Handling Patterns

Production error handling for full-stack applications.

## API Error Structure

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 500,
    public code?: string
  ) {
    super(message)
  }
}

export const handleError = (err: Error, req: Request, res: Response) => {
  console.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  })
  
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code })
  }
  return res.status(500).json({ error: 'Internal server error' })
}
```

## Frontend Error Boundaries

```tsx
// components/ErrorBoundary.tsx
export class ErrorBoundary extends Component {
  state = { hasError: false }
  
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo)
    // Send to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorPage />
    }
    return this.props.children
  }
}
```

## Logging Strategy
- Request/response logging
- Error level differentiation (info, warn, error, fatal)
- Correlation IDs for request tracing
- Structured JSON logs for ELK/Cloud logging