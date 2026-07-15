---
name: clean-architecture
description: Clean Architecture and Domain-Driven Design implementation for full-stack applications.
metadata:
  version: 1.0.0
---

# Clean Architecture

Full-stack architecture with separation of concerns.

## Layers

### 1. Domain Layer (Core)
- Entities
- Repository interfaces
- Business rules

### 2. Application Layer
- Use cases
- DTOs
- Service interfaces

### 3. Infrastructure Layer
- Database implementations
- External APIs
- Framework adapters

### 4. Presentation Layer
- API routes
- Controllers
- UI components

## TypeScript Structure
```
src/
├── domain/
│   ├── entities/
│   └── repositories/
├── application/
│   └── use-cases/
├── infrastructure/
│   ├── database/
│   └── services/
└── presentation/
    ├── api/
    └── web/
```

## Benefits
- Testable without frameworks
- Framework independent
- Database agnostic
- Easy to refactor