import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { resolveProjectPath } from "@/lib/runtime-paths";

const authorityTableDirectory = {
  orders: "authority_orders",
  notifications: "authority_notifications",
  audit: "authority_ops_audit",
  releasePackages: "authority_release_packages",
  releaseHandoffs: "authority_release_handoffs",
  releaseDecisions: "authority_release_decisions",
  catalogImports: "authority_catalog_imports",
  catalogProducts: "authority_catalog_products",
  catalogVariants: "authority_catalog_variants",
  lifecycleSubscriptions: "authority_lifecycle_subscriptions",
  lifecycleDeliveryOutbox: "authority_lifecycle_delivery_outbox",
} as const;

type AuthorityTable = keyof typeof authorityTableDirectory;

type GlobalAuthorityState = typeof globalThis & {
  __cozmateksAuthorityDatabase?: DatabaseSync;
  __cozmateksAuthorityDatabasePath?: string;
};

function initializeAuthorityDatabase(database: DatabaseSync) {
  database.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    PRAGMA wal_autocheckpoint = 1000;

    CREATE TABLE IF NOT EXISTS authority_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS authority_orders (
      order_number TEXT PRIMARY KEY,
      phone_last_four TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_authority_orders_phone_last_four
      ON authority_orders (phone_last_four);

    CREATE INDEX IF NOT EXISTS idx_authority_orders_status_created_at
      ON authority_orders (status, created_at DESC);

    CREATE TABLE IF NOT EXISTS authority_notifications (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL,
      template_key TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_authority_notifications_order_number
      ON authority_notifications (order_number);

    CREATE INDEX IF NOT EXISTS idx_authority_notifications_status_updated_at
      ON authority_notifications (status, updated_at DESC);

    CREATE TABLE IF NOT EXISTS authority_ops_audit (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_authority_ops_audit_created_at
      ON authority_ops_audit (created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_authority_ops_audit_entity
      ON authority_ops_audit (entity_type, entity_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS authority_release_packages (
      id TEXT PRIMARY KEY,
      published_at TEXT NOT NULL,
      overall_status TEXT NOT NULL,
      verification_mode TEXT NOT NULL,
      target_base_url TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_authority_release_packages_published_at
      ON authority_release_packages (published_at DESC);

    CREATE INDEX IF NOT EXISTS idx_authority_release_packages_verification_mode
      ON authority_release_packages (verification_mode, published_at DESC);

    CREATE TABLE IF NOT EXISTS authority_release_decisions (
      id TEXT PRIMARY KEY,
      decided_at TEXT NOT NULL,
      verdict TEXT NOT NULL,
      release_package_record_id TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_authority_release_decisions_decided_at
      ON authority_release_decisions (decided_at DESC);

    CREATE INDEX IF NOT EXISTS idx_authority_release_decisions_package_record
      ON authority_release_decisions (release_package_record_id, decided_at DESC);

    CREATE TABLE IF NOT EXISTS authority_release_handoffs (
      id TEXT PRIMARY KEY,
      handed_off_at TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_authority_release_handoffs_handed_off_at
      ON authority_release_handoffs (handed_off_at DESC);

    CREATE TABLE IF NOT EXISTS authority_ops_login_throttle (
      throttle_key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      failed_count INTEGER NOT NULL,
      first_failed_at TEXT NOT NULL,
      last_failed_at TEXT NOT NULL,
      blocked_until TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_authority_ops_login_throttle_blocked_until
      ON authority_ops_login_throttle (blocked_until);

    CREATE TABLE IF NOT EXISTS authority_schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  applyAuthorityMigrations(database);
}

const authorityMigrations = [
  {
    id: "2026-07-15-catalog-authority-v1",
    sql: `
      CREATE TABLE authority_catalog_imports (
        id TEXT PRIMARY KEY,
        source_ref TEXT NOT NULL,
        source_hash TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL CHECK (status IN ('validated', 'active', 'retired')),
        product_count INTEGER NOT NULL CHECK (product_count >= 0),
        variant_count INTEGER NOT NULL CHECK (variant_count >= 0),
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        activated_at TEXT,
        payload_json TEXT NOT NULL
      );

      CREATE INDEX idx_authority_catalog_imports_status_created_at
        ON authority_catalog_imports (status, created_at DESC);

      CREATE TABLE authority_tax_profiles (
        id TEXT PRIMARY KEY,
        import_id TEXT NOT NULL,
        jurisdiction_code TEXT NOT NULL CHECK (jurisdiction_code = 'SA'),
        rate_bps INTEGER NOT NULL CHECK (rate_bps >= 0 AND rate_bps <= 10000),
        prices_include_tax INTEGER NOT NULL CHECK (prices_include_tax = 1),
        evidence_ref TEXT NOT NULL,
        approved_by TEXT NOT NULL,
        approved_at TEXT NOT NULL,
        FOREIGN KEY (import_id) REFERENCES authority_catalog_imports(id) ON DELETE RESTRICT
      );

      CREATE TABLE authority_catalog_products (
        import_id TEXT NOT NULL,
        slug TEXT NOT NULL COLLATE NOCASE,
        collection TEXT NOT NULL,
        brand TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'retired')),
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        PRIMARY KEY (import_id, slug),
        FOREIGN KEY (import_id) REFERENCES authority_catalog_imports(id) ON DELETE RESTRICT
      );

      CREATE TABLE authority_catalog_variants (
        import_id TEXT NOT NULL,
        sku TEXT NOT NULL COLLATE NOCASE,
        product_slug TEXT NOT NULL COLLATE NOCASE,
        barcode TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'retired')),
        payload_json TEXT NOT NULL,
        PRIMARY KEY (import_id, sku),
        UNIQUE (import_id, barcode),
        FOREIGN KEY (import_id, product_slug)
          REFERENCES authority_catalog_products(import_id, slug) ON DELETE RESTRICT
      );

      CREATE TABLE authority_catalog_prices (
        import_id TEXT NOT NULL,
        sku TEXT NOT NULL COLLATE NOCASE,
        currency TEXT NOT NULL CHECK (currency = 'SAR'),
        gross_halalas INTEGER NOT NULL CHECK (gross_halalas >= 0),
        compare_at_halalas INTEGER CHECK (
          compare_at_halalas IS NULL OR compare_at_halalas >= gross_halalas
        ),
        tax_profile_id TEXT NOT NULL,
        PRIMARY KEY (import_id, sku),
        FOREIGN KEY (import_id, sku)
          REFERENCES authority_catalog_variants(import_id, sku) ON DELETE RESTRICT,
        FOREIGN KEY (tax_profile_id)
          REFERENCES authority_tax_profiles(id) ON DELETE RESTRICT
      );

      CREATE TABLE authority_inventory_locations (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive'))
      );

      CREATE TABLE authority_inventory_balances (
        import_id TEXT NOT NULL,
        sku TEXT NOT NULL COLLATE NOCASE,
        location_id TEXT NOT NULL,
        on_hand INTEGER NOT NULL CHECK (on_hand >= 0),
        reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0 AND reserved <= on_hand),
        safety_stock INTEGER NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
        version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
        updated_at TEXT NOT NULL,
        PRIMARY KEY (import_id, sku, location_id),
        FOREIGN KEY (import_id, sku)
          REFERENCES authority_catalog_variants(import_id, sku) ON DELETE RESTRICT,
        FOREIGN KEY (location_id)
          REFERENCES authority_inventory_locations(id) ON DELETE RESTRICT
      );

      CREATE TABLE authority_catalog_approvals (
        id TEXT PRIMARY KEY,
        import_id TEXT NOT NULL,
        subject_type TEXT NOT NULL CHECK (subject_type IN ('catalog', 'product', 'variant')),
        subject_id TEXT NOT NULL,
        approval_type TEXT NOT NULL CHECK (
          approval_type IN ('data', 'media', 'claims', 'compliance', 'price', 'publication')
        ),
        status TEXT NOT NULL CHECK (status IN ('approved', 'rejected')),
        evidence_ref TEXT NOT NULL,
        approved_by TEXT NOT NULL,
        decided_at TEXT NOT NULL,
        FOREIGN KEY (import_id) REFERENCES authority_catalog_imports(id) ON DELETE RESTRICT
      );

      CREATE INDEX idx_authority_catalog_approvals_subject
        ON authority_catalog_approvals (import_id, subject_type, subject_id, approval_type);

      CREATE TABLE authority_catalog_publications (
        id TEXT PRIMARY KEY,
        import_id TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL CHECK (status IN ('active', 'retired')),
        content_hash TEXT NOT NULL,
        approved_by TEXT NOT NULL,
        approved_at TEXT NOT NULL,
        activated_at TEXT NOT NULL,
        FOREIGN KEY (import_id) REFERENCES authority_catalog_imports(id) ON DELETE RESTRICT
      );

      CREATE UNIQUE INDEX idx_authority_catalog_one_active_publication
        ON authority_catalog_publications(status) WHERE status = 'active';
    `,
  },
  {
    id: "2026-07-15-checkout-quote-v1",
    sql: `
      CREATE TABLE authority_checkout_quotes (
        id TEXT PRIMARY KEY,
        checkout_session_id TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        catalog_import_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'consumed', 'expired')),
        currency TEXT NOT NULL CHECK (currency = 'SAR'),
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        FOREIGN KEY (catalog_import_id)
          REFERENCES authority_catalog_imports(id) ON DELETE RESTRICT
      );

      CREATE INDEX idx_authority_checkout_quotes_session_created_at
        ON authority_checkout_quotes (checkout_session_id, created_at DESC);

      CREATE INDEX idx_authority_checkout_quotes_status_expires_at
        ON authority_checkout_quotes (status, expires_at);
    `,
  },
  {
    id: "2026-07-15-idempotent-order-v1",
    sql: `
      CREATE TABLE authority_order_idempotency (
        checkout_session_id TEXT NOT NULL,
        idempotency_key TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('in_progress', 'completed')),
        order_number TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (checkout_session_id, idempotency_key),
        FOREIGN KEY (order_number) REFERENCES authority_orders(order_number) ON DELETE RESTRICT
      );

      CREATE TABLE authority_inventory_reservations (
        id TEXT PRIMARY KEY,
        reservation_key TEXT NOT NULL UNIQUE,
        quote_id TEXT NOT NULL,
        order_number TEXT NOT NULL,
        catalog_import_id TEXT NOT NULL,
        sku TEXT NOT NULL COLLATE NOCASE,
        location_id TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        state TEXT NOT NULL CHECK (state IN ('active', 'committed', 'released', 'expired')),
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (order_number, sku),
        FOREIGN KEY (quote_id) REFERENCES authority_checkout_quotes(id) ON DELETE RESTRICT,
        FOREIGN KEY (order_number) REFERENCES authority_orders(order_number) ON DELETE RESTRICT,
        FOREIGN KEY (catalog_import_id, sku)
          REFERENCES authority_catalog_variants(import_id, sku) ON DELETE RESTRICT,
        FOREIGN KEY (location_id)
          REFERENCES authority_inventory_locations(id) ON DELETE RESTRICT
      );

      CREATE INDEX idx_authority_inventory_reservations_state_expires_at
        ON authority_inventory_reservations (state, expires_at);

      CREATE TABLE authority_outbox (
        id TEXT PRIMARY KEY,
        aggregate_type TEXT NOT NULL,
        aggregate_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        dedupe_key TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')),
        attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
        next_attempt_at TEXT NOT NULL,
        last_error TEXT,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX idx_authority_outbox_status_next_attempt
        ON authority_outbox (status, next_attempt_at);

      CREATE TABLE authority_provider_events (
        provider TEXT NOT NULL,
        event_id TEXT NOT NULL,
        order_number TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        processed_at TEXT NOT NULL,
        PRIMARY KEY (provider, event_id),
        FOREIGN KEY (order_number) REFERENCES authority_orders(order_number) ON DELETE RESTRICT
      );
    `,
  },
  {
    id: "2026-07-15-outbox-lease-v1",
    sql: `
      ALTER TABLE authority_outbox ADD COLUMN lease_token TEXT;
      ALTER TABLE authority_outbox ADD COLUMN lease_expires_at TEXT;
      ALTER TABLE authority_outbox ADD COLUMN completed_at TEXT;

      ALTER TABLE authority_inventory_reservations ADD COLUMN terminal_reason TEXT;
      ALTER TABLE authority_inventory_reservations ADD COLUMN terminal_at TEXT;

      ALTER TABLE authority_orders ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;

      CREATE INDEX idx_authority_outbox_processing_lease
        ON authority_outbox (status, lease_expires_at);
    `,
  },
  {
    id: "2026-07-15-active-quote-reuse-v1",
    sql: `
      UPDATE authority_checkout_quotes
      SET status = 'expired'
      WHERE status = 'active'
        AND expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now');

      UPDATE authority_checkout_quotes
      SET status = 'expired'
      WHERE id IN (
        SELECT id
        FROM (
          SELECT
            id,
            ROW_NUMBER() OVER (
              PARTITION BY checkout_session_id, request_hash, catalog_import_id
              ORDER BY created_at DESC, id DESC
            ) AS duplicate_rank
          FROM authority_checkout_quotes
          WHERE status = 'active'
        )
        WHERE duplicate_rank > 1
      );

      CREATE UNIQUE INDEX idx_authority_checkout_quotes_one_active_request
        ON authority_checkout_quotes (
          checkout_session_id,
          request_hash,
          catalog_import_id
        )
        WHERE status = 'active';
    `,
  },
  {
    id: "2026-07-15-customer-provider-identity-v1",
    sql: `
      CREATE TABLE authority_customer_identities (
        issuer TEXT NOT NULL,
        subject TEXT NOT NULL,
        customer_key TEXT NOT NULL,
        provider_label TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (issuer, subject),
        UNIQUE (customer_key, issuer)
      );

      CREATE INDEX idx_authority_customer_identities_customer_key
        ON authority_customer_identities (customer_key);

      CREATE TABLE authority_customer_auth_states (
        state_hash TEXT PRIMARY KEY,
        customer_key TEXT NOT NULL,
        order_number TEXT NOT NULL,
        return_to TEXT NOT NULL,
        nonce TEXT NOT NULL,
        code_verifier TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        consumed_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (order_number) REFERENCES authority_orders(order_number) ON DELETE CASCADE
      );

      CREATE INDEX idx_authority_customer_auth_states_expires_at
        ON authority_customer_auth_states (expires_at);
    `,
  },
  {
    id: "2026-07-15-lifecycle-consent-v1",
    sql: `
      CREATE TABLE authority_lifecycle_subscriptions (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL CHECK (kind IN ('newsletter', 'back_in_stock')),
        contact_email TEXT NOT NULL COLLATE NOCASE,
        contact_hash TEXT NOT NULL,
        scope_key TEXT NOT NULL,
        product_slug TEXT COLLATE NOCASE,
        sku TEXT COLLATE NOCASE,
        source TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('subscribed', 'unsubscribed', 'fulfilled')),
        consent_policy_version TEXT NOT NULL,
        locale TEXT NOT NULL CHECK (locale IN ('ar', 'en')),
        consent_action TEXT NOT NULL,
        consent_granted_at TEXT NOT NULL,
        consent_withdrawn_at TEXT,
        fulfilled_at TEXT,
        unsubscribe_token_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (kind, contact_hash, scope_key),
        CHECK (
          (kind = 'newsletter' AND product_slug IS NULL AND sku IS NULL) OR
          (kind = 'back_in_stock' AND product_slug IS NOT NULL AND sku IS NOT NULL)
        ),
        CHECK (status != 'fulfilled' OR kind = 'back_in_stock')
      );

      CREATE INDEX idx_authority_lifecycle_status_updated_at
        ON authority_lifecycle_subscriptions (status, updated_at DESC);

      CREATE INDEX idx_authority_lifecycle_kind_status
        ON authority_lifecycle_subscriptions (kind, status, updated_at DESC);
    `,
  },
  {
    id: "2026-07-15-lifecycle-delivery-outbox-v1",
    sql: `
      ALTER TABLE authority_lifecycle_subscriptions
        ADD COLUMN consent_revision INTEGER NOT NULL DEFAULT 1 CHECK (consent_revision >= 1);

      CREATE TABLE authority_lifecycle_delivery_outbox (
        id TEXT PRIMARY KEY,
        subscription_id TEXT NOT NULL,
        consent_revision INTEGER NOT NULL CHECK (consent_revision >= 1),
        delivery_type TEXT NOT NULL CHECK (
          delivery_type IN ('newsletter_confirmation', 'back_in_stock_available')
        ),
        dispatch_key TEXT NOT NULL,
        dedupe_key TEXT NOT NULL UNIQUE,
        provider_key TEXT,
        status TEXT NOT NULL CHECK (
          status IN ('pending', 'processing', 'delivered', 'failed', 'dead_letter')
        ),
        attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
        next_attempt_at TEXT NOT NULL,
        lease_token TEXT,
        lease_expires_at TEXT,
        last_error_code TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        delivered_at TEXT,
        FOREIGN KEY (subscription_id)
          REFERENCES authority_lifecycle_subscriptions(id) ON DELETE RESTRICT
      );

      CREATE INDEX idx_authority_lifecycle_delivery_claim
        ON authority_lifecycle_delivery_outbox (status, next_attempt_at, lease_expires_at);

      CREATE INDEX idx_authority_lifecycle_delivery_subscription
        ON authority_lifecycle_delivery_outbox (subscription_id, created_at DESC);
    `,
  },
  {
    id: "2026-07-15-lifecycle-email-provider-v1",
    sql: `
      ALTER TABLE authority_lifecycle_delivery_outbox
        RENAME TO authority_lifecycle_delivery_outbox_legacy;

      CREATE TABLE authority_lifecycle_delivery_outbox (
        id TEXT PRIMARY KEY,
        subscription_id TEXT NOT NULL,
        consent_revision INTEGER NOT NULL CHECK (consent_revision >= 1),
        delivery_type TEXT NOT NULL CHECK (
          delivery_type IN ('newsletter_confirmation', 'back_in_stock_available')
        ),
        dispatch_key TEXT NOT NULL,
        dedupe_key TEXT NOT NULL UNIQUE,
        provider_key TEXT,
        provider_message_id TEXT,
        status TEXT NOT NULL CHECK (
          status IN ('pending', 'processing', 'accepted', 'failed', 'dead_letter')
        ),
        attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
        next_attempt_at TEXT NOT NULL,
        lease_token TEXT,
        lease_expires_at TEXT,
        last_error_code TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        accepted_at TEXT,
        FOREIGN KEY (subscription_id)
          REFERENCES authority_lifecycle_subscriptions(id) ON DELETE RESTRICT,
        UNIQUE (provider_key, provider_message_id)
      );

      INSERT INTO authority_lifecycle_delivery_outbox (
        id, subscription_id, consent_revision, delivery_type, dispatch_key,
        dedupe_key, provider_key, provider_message_id, status, attempts,
        next_attempt_at, lease_token, lease_expires_at, last_error_code,
        created_at, updated_at, accepted_at
      )
      SELECT
        id, subscription_id, consent_revision, delivery_type, dispatch_key,
        dedupe_key, provider_key, NULL,
        CASE WHEN status = 'delivered' THEN 'accepted' ELSE status END,
        attempts, next_attempt_at, lease_token, lease_expires_at,
        last_error_code, created_at, updated_at, delivered_at
      FROM authority_lifecycle_delivery_outbox_legacy;

      DROP TABLE authority_lifecycle_delivery_outbox_legacy;

      CREATE INDEX idx_authority_lifecycle_delivery_claim
        ON authority_lifecycle_delivery_outbox (status, next_attempt_at, lease_expires_at);

      CREATE INDEX idx_authority_lifecycle_delivery_subscription
        ON authority_lifecycle_delivery_outbox (subscription_id, created_at DESC);

      CREATE TABLE authority_lifecycle_provider_events (
        provider_key TEXT NOT NULL,
        event_id TEXT NOT NULL,
        delivery_id TEXT NOT NULL,
        provider_message_id TEXT NOT NULL,
        event_type TEXT NOT NULL CHECK (
          event_type IN ('delivered', 'bounced', 'complained')
        ),
        payload_hash TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        processed_at TEXT NOT NULL,
        PRIMARY KEY (provider_key, event_id),
        FOREIGN KEY (delivery_id)
          REFERENCES authority_lifecycle_delivery_outbox(id) ON DELETE RESTRICT
      );

      CREATE INDEX idx_authority_lifecycle_provider_message
        ON authority_lifecycle_provider_events (
          provider_key, provider_message_id, processed_at DESC
        );
    `,
  },
  {
    id: "2026-07-15-lifecycle-sns-callback-v1",
    sql: `
      CREATE TABLE authority_lifecycle_sns_messages (
        topic_arn TEXT NOT NULL,
        message_id TEXT NOT NULL,
        message_type TEXT NOT NULL CHECK (
          message_type IN (
            'Notification',
            'SubscriptionConfirmation',
            'UnsubscribeConfirmation'
          )
        ),
        payload_hash TEXT NOT NULL,
        received_at TEXT NOT NULL,
        PRIMARY KEY (topic_arn, message_id)
      );

      CREATE INDEX idx_authority_lifecycle_sns_received
        ON authority_lifecycle_sns_messages (received_at DESC);
    `,
  },
  {
    id: "2026-07-16-public-request-throttle-v1",
    sql: `
      CREATE TABLE authority_public_request_throttle (
        throttle_key TEXT PRIMARY KEY,
        scope TEXT NOT NULL,
        label TEXT NOT NULL,
        request_count INTEGER NOT NULL CHECK (request_count >= 0),
        window_started_at TEXT NOT NULL,
        last_request_at TEXT NOT NULL,
        blocked_until TEXT
      );

      CREATE INDEX idx_authority_public_request_throttle_last_request
        ON authority_public_request_throttle (last_request_at);
    `,
  },
] as const;

function applyAuthorityMigrations(database: DatabaseSync) {
  const hasMigration = database.prepare(
    "SELECT 1 FROM authority_schema_migrations WHERE id = ?",
  );
  const recordMigration = database.prepare(
    "INSERT INTO authority_schema_migrations (id, applied_at) VALUES (?, ?)",
  );

  for (const migration of authorityMigrations) {
    if (hasMigration.get(migration.id)) continue;

    database.exec("BEGIN IMMEDIATE");
    try {
      database.exec(migration.sql);
      recordMigration.run(migration.id, new Date().toISOString());
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }
}

export function getAuthorityDatabasePath() {
  const configuredPath = process.env.AUTHORITY_DB_PATH?.trim();
  const relativePath =
    configuredPath && configuredPath.length > 0
      ? configuredPath
      : ".data/authority.sqlite";

  return resolveProjectPath(relativePath);
}

export function getAuthorityDatabase() {
  const globalState = globalThis as GlobalAuthorityState;
  const databasePath = getAuthorityDatabasePath();

  if (
    globalState.__cozmateksAuthorityDatabase &&
    globalState.__cozmateksAuthorityDatabasePath === databasePath
  ) {
    return globalState.__cozmateksAuthorityDatabase;
  }

  if (
    globalState.__cozmateksAuthorityDatabase &&
    globalState.__cozmateksAuthorityDatabasePath !== databasePath
  ) {
    globalState.__cozmateksAuthorityDatabase.close();
  }

  mkdirSync(path.dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  initializeAuthorityDatabase(database);
  globalState.__cozmateksAuthorityDatabase = database;
  globalState.__cozmateksAuthorityDatabasePath = databasePath;

  return database;
}

export function runAuthorityTransaction<T>(
  callback: (database: DatabaseSync) => T,
) {
  const database = getAuthorityDatabase();
  database.exec("BEGIN IMMEDIATE");

  try {
    const result = callback(database);
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function getAuthorityMetaValue(key: string) {
  const row = getAuthorityDatabase()
    .prepare("SELECT value FROM authority_meta WHERE key = ?")
    .get(key) as { value: string } | undefined;

  return row?.value ?? null;
}

export function setAuthorityMetaValue(key: string, value: string) {
  getAuthorityDatabase()
    .prepare(`
      INSERT INTO authority_meta (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `)
    .run(key, value);
}

export function getAuthorityTableCount(table: AuthorityTable) {
  const tableName = authorityTableDirectory[table];
  const row = getAuthorityDatabase()
    .prepare(`SELECT COUNT(*) AS count FROM ${tableName}`)
    .get() as { count: number };

  return row.count;
}

export function getAuthorityStorageInfo() {
  return {
    engine: "sqlite",
    durability: "sqlite_file",
    path: getAuthorityDatabasePath(),
  };
}
