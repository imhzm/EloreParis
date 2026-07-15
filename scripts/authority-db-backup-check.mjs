import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  createAuthorityBackup,
  restoreAuthorityBackup,
  verifyAuthorityBackup,
} from "./authority-db-backup.mjs";

const workspace = mkdtempSync(path.join(os.tmpdir(), "elore-authority-backup-"));
try {
  const sourcePath = path.join(workspace, "source.sqlite");
  const outputDirectory = path.join(workspace, "backups");
  const source = new DatabaseSync(sourcePath);
  source.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE authority_schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE verification_rows (id INTEGER PRIMARY KEY, value TEXT NOT NULL);
    INSERT INTO authority_schema_migrations VALUES ('isolated-test-v1', '2026-07-15T00:00:00.000Z');
    INSERT INTO verification_rows (value) VALUES ('captured-from-live-wal');
  `);

  const created = await createAuthorityBackup({
    sourcePath,
    outputDirectory,
    backupName: "isolated-authority",
  });
  const verified = verifyAuthorityBackup(created);
  assert.equal(verified.manifest.integrityCheck, "ok");
  assert.equal(verified.manifest.foreignKeyViolationCount, 0);
  assert.equal(verified.manifest.migrations[0].id, "isolated-test-v1");

  const restoredPath = path.join(workspace, "restored.sqlite");
  await restoreAuthorityBackup({ ...created, targetPath: restoredPath });
  const restored = new DatabaseSync(restoredPath, { readOnly: true });
  assert.equal(
    restored.prepare("SELECT value FROM verification_rows WHERE id = 1").get().value,
    "captured-from-live-wal",
  );
  restored.close();

  await assert.rejects(
    restoreAuthorityBackup({ ...created, targetPath: restoredPath }),
    /exists/,
  );

  const corruptedPath = path.join(workspace, "corrupted.sqlite");
  cpSync(created.backupPath, corruptedPath);
  const corrupted = Buffer.from(readFileSync(corruptedPath));
  corrupted[corrupted.length - 1] ^= 0xff;
  writeFileSync(corruptedPath, corrupted);
  assert.throws(
    () => verifyAuthorityBackup({ backupPath: corruptedPath, manifestPath: created.manifestPath }),
    /checksum|size/,
  );

  source.close();
  console.log("Isolated SQLite backup, checksum, restore, and overwrite-safety checks passed.");
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
