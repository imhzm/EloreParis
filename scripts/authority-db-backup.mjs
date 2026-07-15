import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { backup, DatabaseSync } from "node:sqlite";

const MANIFEST_FORMAT = "elore-authority-sqlite-backup";
const MANIFEST_VERSION = 1;

function resolvePath(value, label) {
  if (!value || typeof value !== "string") throw new Error(`${label} is required.`);
  return path.resolve(value);
}

function checksum(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function inspectDatabase(databasePath, { checkpoint = false } = {}) {
  const database = new DatabaseSync(databasePath);
  try {
    database.exec("PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
    const journalMode = database.prepare("PRAGMA journal_mode").get().journal_mode;
    const checkpointResult =
      checkpoint && journalMode === "wal"
        ? database.prepare("PRAGMA wal_checkpoint(PASSIVE)").get()
        : null;
    const integrity = database.prepare("PRAGMA integrity_check").get().integrity_check;
    const foreignKeyViolations = database.prepare("PRAGMA foreign_key_check").all();
    const hasMigrations = database.prepare(`
      SELECT 1 AS present FROM sqlite_master
      WHERE type = 'table' AND name = 'authority_schema_migrations'
    `).get();
    const migrations = hasMigrations
      ? database.prepare(`
          SELECT id, applied_at FROM authority_schema_migrations ORDER BY applied_at, id
        `).all()
      : [];
    return { journalMode, checkpointResult, integrity, foreignKeyViolations, migrations };
  } finally {
    database.close();
  }
}

function readManifest(manifestPath) {
  const value = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (
    value?.format !== MANIFEST_FORMAT ||
    value?.version !== MANIFEST_VERSION ||
    typeof value?.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.sha256) ||
    !Number.isSafeInteger(value?.sizeBytes) ||
    value.sizeBytes < 1
  ) {
    throw new Error("Backup manifest is invalid or unsupported.");
  }
  return value;
}

export function verifyAuthorityBackup({ backupPath, manifestPath }) {
  const resolvedBackup = resolvePath(backupPath, "backupPath");
  const resolvedManifest = resolvePath(
    manifestPath ?? `${resolvedBackup}.manifest.json`,
    "manifestPath",
  );
  if (!existsSync(resolvedBackup) || !existsSync(resolvedManifest)) {
    throw new Error("Backup database and manifest must both exist.");
  }
  const manifest = readManifest(resolvedManifest);
  const actualSize = statSync(resolvedBackup).size;
  const actualChecksum = checksum(resolvedBackup);
  if (actualSize !== manifest.sizeBytes || actualChecksum !== manifest.sha256) {
    throw new Error("Backup checksum or size does not match its manifest.");
  }
  const inspection = inspectDatabase(resolvedBackup);
  if (inspection.integrity !== "ok" || inspection.foreignKeyViolations.length > 0) {
    throw new Error("Backup database failed SQLite integrity verification.");
  }
  return { backupPath: resolvedBackup, manifestPath: resolvedManifest, manifest, inspection };
}

export async function createAuthorityBackup({ sourcePath, outputDirectory, backupName }) {
  const source = resolvePath(sourcePath, "sourcePath");
  const output = resolvePath(outputDirectory, "outputDirectory");
  if (!existsSync(source)) throw new Error("Authority database does not exist.");
  const safeName = backupName ?? `authority-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(safeName)) {
    throw new Error("backupName contains unsupported characters.");
  }
  mkdirSync(output, { recursive: true });
  const backupPath = path.join(output, `${safeName}.sqlite`);
  const manifestPath = `${backupPath}.manifest.json`;
  const temporaryPath = `${backupPath}.tmp-${randomUUID()}`;
  if (existsSync(backupPath) || existsSync(manifestPath)) {
    throw new Error("Backup output already exists; refusing to overwrite it.");
  }

  const sourceInspection = inspectDatabase(source, { checkpoint: true });
  if (
    sourceInspection.integrity !== "ok" ||
    sourceInspection.foreignKeyViolations.length > 0
  ) {
    throw new Error("Source database failed SQLite integrity verification.");
  }

  const sourceDatabase = new DatabaseSync(source);
  try {
    await backup(sourceDatabase, temporaryPath);
  } finally {
    sourceDatabase.close();
  }

  try {
    const snapshotInspection = inspectDatabase(temporaryPath);
    if (
      snapshotInspection.integrity !== "ok" ||
      snapshotInspection.foreignKeyViolations.length > 0
    ) {
      throw new Error("Created snapshot failed SQLite integrity verification.");
    }
    renameSync(temporaryPath, backupPath);
    const manifest = {
      format: MANIFEST_FORMAT,
      version: MANIFEST_VERSION,
      createdAt: new Date().toISOString(),
      sourceFile: path.basename(source),
      backupFile: path.basename(backupPath),
      sizeBytes: statSync(backupPath).size,
      sha256: checksum(backupPath),
      journalMode: sourceInspection.journalMode,
      checkpoint: sourceInspection.checkpointResult,
      integrityCheck: snapshotInspection.integrity,
      foreignKeyViolationCount: snapshotInspection.foreignKeyViolations.length,
      migrations: snapshotInspection.migrations,
    };
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o640,
    });
    return { backupPath, manifestPath, manifest };
  } catch (error) {
    rmSync(temporaryPath, { force: true });
    if (existsSync(backupPath) && !existsSync(manifestPath)) rmSync(backupPath, { force: true });
    throw error;
  }
}

export async function restoreAuthorityBackup({
  backupPath,
  manifestPath,
  targetPath,
  overwrite = false,
}) {
  const verified = verifyAuthorityBackup({ backupPath, manifestPath });
  const target = resolvePath(targetPath, "targetPath");
  if (target === verified.backupPath) throw new Error("Restore target cannot be the backup file.");
  if (existsSync(target) && !overwrite) {
    throw new Error("Restore target exists; pass overwrite explicitly after stopping the service.");
  }
  if (existsSync(`${target}-wal`) || existsSync(`${target}-shm`)) {
    throw new Error("Restore target has active SQLite sidecars; stop the service before restoring.");
  }

  mkdirSync(path.dirname(target), { recursive: true });
  const temporaryTarget = `${target}.restore-${randomUUID()}`;
  const backupDatabase = new DatabaseSync(verified.backupPath, { readOnly: true });
  try {
    await backup(backupDatabase, temporaryTarget);
  } finally {
    backupDatabase.close();
  }

  let displacedPath = null;
  try {
    const restoredInspection = inspectDatabase(temporaryTarget);
    if (
      restoredInspection.integrity !== "ok" ||
      restoredInspection.foreignKeyViolations.length > 0
    ) {
      throw new Error("Restored database failed SQLite integrity verification.");
    }
    if (existsSync(target)) {
      displacedPath = `${target}.pre-restore-${new Date().toISOString().replace(/[:.]/g, "-")}`;
      renameSync(target, displacedPath);
    }
    renameSync(temporaryTarget, target);
    const descriptor = openSync(target, "r");
    closeSync(descriptor);
    return { targetPath: target, displacedPath, inspection: restoredInspection };
  } catch (error) {
    rmSync(temporaryTarget, { force: true });
    if (displacedPath && !existsSync(target) && existsSync(displacedPath)) {
      renameSync(displacedPath, target);
    }
    throw error;
  }
}

function parseCliArguments(argv) {
  const [command, ...values] = argv;
  const options = {};
  for (let index = 0; index < values.length; index += 1) {
    const token = values[index];
    if (token === "--overwrite") {
      options.overwrite = true;
      continue;
    }
    if (!token.startsWith("--") || index + 1 >= values.length) {
      throw new Error(`Invalid argument: ${token}`);
    }
    options[token.slice(2)] = values[index + 1];
    index += 1;
  }
  return { command, options };
}

async function main() {
  const { command, options } = parseCliArguments(process.argv.slice(2));
  if (command === "backup") {
    console.log(JSON.stringify(await createAuthorityBackup({
      sourcePath: options.source,
      outputDirectory: options.output,
      backupName: options.name,
    }), null, 2));
    return;
  }
  if (command === "verify") {
    console.log(JSON.stringify(verifyAuthorityBackup({
      backupPath: options.backup,
      manifestPath: options.manifest,
    }), null, 2));
    return;
  }
  if (command === "restore") {
    console.log(JSON.stringify(await restoreAuthorityBackup({
      backupPath: options.backup,
      manifestPath: options.manifest,
      targetPath: options.target,
      overwrite: options.overwrite === true,
    }), null, 2));
    return;
  }
  throw new Error("Usage: backup --source DB --output DIR [--name NAME] | verify --backup DB [--manifest FILE] | restore --backup DB --target DB [--manifest FILE] [--overwrite]");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
