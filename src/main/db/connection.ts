import { copyFileSync, existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { getUserVersion, runMigrations } from "./migrate";
import { migrations } from "./migrations";

/**
 * The single library connection. Opened once at app startup and kept until
 * quit (`docs/specs/v1.0/architecture/database.md`); queries never open their
 * own connection.
 */
let db: DatabaseSync | null = null;

/**
 * Copy the database file to `<filePath>.backup-v<current>` when the pending
 * migrations are about to raise its schema version.
 *
 * Recovery from a broken migration is a manual restore from this copy
 * (forward-only policy — there are no down migrations). Skipped for
 * in-memory databases, for files that do not exist yet, and for fresh files
 * still at version 0 (nothing worth preserving). Peeks at `user_version`
 * through a short-lived read-only connection; opening and closing it also
 * replays a leftover WAL so the copied file is complete.
 *
 * @param filePath - Database file path (same value passed to {@link openDatabase}).
 * @param migrationCount - Number of known migrations; defaults to the bundled
 *   list (injectable for unit tests).
 * @returns void.
 */
export const backupBeforeMigration = (
  filePath: string,
  migrationCount: number = migrations.length,
): void => {
  if (filePath === ":memory:" || !existsSync(filePath)) {
    return;
  }

  const peek = new DatabaseSync(filePath, { readOnly: true });
  let current = 0;
  try {
    current = getUserVersion(peek);
  } finally {
    peek.close();
  }

  if (current > 0 && current < migrationCount) {
    copyFileSync(filePath, `${filePath}.backup-v${current}`);
  }
};

/**
 * Open the single library connection and bring its schema up to date.
 *
 * Enables WAL mode and foreign keys, backs the file up when a migration is
 * pending, then runs the migration runner. Any failure (including a detected
 * downgrade) closes the half-open connection and re-throws so the caller can
 * abort startup with a dialog.
 *
 * @param filePath - Database file path (`userData/app.db`, or `:memory:` in tests).
 * @returns The opened connection (also reachable via {@link getDatabase}).
 */
export const openDatabase = (filePath: string): DatabaseSync => {
  if (db !== null) {
    throw new Error("database is already open");
  }

  backupBeforeMigration(filePath);

  const database = new DatabaseSync(filePath);
  try {
    database.exec("PRAGMA journal_mode = WAL");
    database.exec("PRAGMA foreign_keys = ON");
    runMigrations(database);
  } catch (error) {
    database.close();
    throw error;
  }

  db = database;
  return database;
};

/**
 * Resolve the connection opened by {@link openDatabase}.
 *
 * @returns The single open connection.
 */
export const getDatabase = (): DatabaseSync => {
  if (db === null) {
    throw new Error("database is not open — call openDatabase() first");
  }
  return db;
};

/**
 * Close the single connection at app quit. Safe to call when nothing is
 * open.
 *
 * @returns void.
 */
export const closeDatabase = (): void => {
  if (db === null) {
    return;
  }
  db.close();
  db = null;
};
