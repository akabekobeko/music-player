import { DatabaseSync } from "node:sqlite";
import { backupBeforeMigration } from "./backupBeforeMigration";
import { runMigrations } from "./runMigrations";

/**
 * The single library connection. Opened once at app startup and kept until
 * quit (`docs/specs/v1.0/architecture/database.md`); queries never open their
 * own connection.
 */
let db: DatabaseSync | null = null;

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
