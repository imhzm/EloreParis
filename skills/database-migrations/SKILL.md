---
name: database-migrations
description: "Database schema migrations and version control for PostgreSQL, MySQL, and other databases."
metadata:
  version: 1.0.0
---

# Database Migrations

Manage database schema changes safely across environments.

## Migration Strategy

### 1. Versioning
- Sequential numbering (001_, 002_, ...)
- Descriptive names
- Timestamp prefix optional
- Reversible when possible

### 2. Structure
```
migrations/
├── 001_create_users_table.sql
├── 002_add_user_profile_fields.sql
└── 003_create_orders_table.sql
```

### 3. Safe Practices
- Wrap in transactions
- Test rollback before apply
- Backup before migration
- Zero-downtime deployments

### 4. Testing
- Migration on copy of production data
- Verify constraints after apply
- Check for orphaned records
- Performance impact analysis

### 5. Deployment Order
1. Apply on staging
2. Test thoroughly  
3. Schedule production maintenance
4. Apply during low traffic
5. Rollback plan ready

## PostgreSQL Specific
```sql
-- Always in transaction
BEGIN;
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL
);
-- Verify then commit
COMMIT;
```