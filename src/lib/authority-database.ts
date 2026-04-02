import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { resolveProjectPath } from "@/lib/runtime-paths";

const authorityTableDirectory = {
  orders: "authority_orders",
  notifications: "authority_notifications",
  audit: "authority_ops_audit",
} as const;

type AuthorityTable = keyof typeof authorityTableDirectory;

type GlobalAuthorityState = typeof globalThis & {
  __cozmateksAuthorityDatabase?: DatabaseSync;
  __cozmateksAuthorityDatabasePath?: string;
};

function initializeAuthorityDatabase(database: DatabaseSync) {
  database.exec(`
    PRAGMA busy_timeout = 5000;

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
  `);
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
