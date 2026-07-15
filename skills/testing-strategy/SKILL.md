---
name: testing-strategy
description: Comprehensive testing strategy covering unit, integration, E2E, and performance testing for full-stack applications.
metadata:
  version: 1.0.0
---

# Testing Strategy

Full-stack testing patterns for production applications.

## Testing Pyramid

### Unit Tests (70%)
- Test business logic isolated
- Mock external dependencies
- Fast execution (<100ms each)
- Vitest or Jest

### Integration Tests (20%)
- Database + API integration
- Real database in Docker
- Test critical user flows
- Supertest for HTTP endpoints

### E2E Tests (10%)
- Full user journeys
- Browser automation
- Visual regression testing
- Playwright or Cypress

## Test Setup

### Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:ci": "vitest run && playwright test"
  }
}
```

### Vitest Config
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/*.e2e.ts', '**/*.spec.ts']
    }
  }
})
```

### Playwright Config
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run dev',
    port: 3000
  },
  use: {
    baseURL: 'http://localhost:3000'
  }
})
```

## Testing Patterns

### Repository Tests
```typescript
describe('ProductRepository', () => {
  beforeAll(async () => {
    await setupTestDB()
  })
  
  it('creates product with valid data', async () => {
    const product = await repo.create({
      name: 'Test',
      price: 100
    })
    expect(product.id).toBeDefined()
  })
})
```

### API Route Tests
```typescript
describe('GET /api/products', () => {
  it('returns products list', async () => {
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('length')
  })
})
```

### E2E User Flow
```typescript
test('user can checkout', async ({ page }) => {
  await page.goto('/products')
  await page.click('[data-testid="add-to-cart"]')
  await page.click('[data-testid="checkout"]')
  await page.fill('[name="email"]', 'test@test.com')
  await page.click('[type="submit"]')
  await expect(page).toHaveURL('/order-confirmation')
})
```