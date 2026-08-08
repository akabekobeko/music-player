import type { DatabaseSync } from "node:sqlite";
import { migrations } from "./migrations";

/**
 * Thrown when the database's `user_version` is newer than every migration
 * this build knows about — i.e. the user downgraded the app after running a
 * newer version. Startup must abort and tell the user to update
 * (`docs/specs/v1.0/architecture/database.md`).
 */
export class DatabaseDowngradeError extends Error {
  /** `user_version` found in the database file. */
  readonly databaseVersion: number;
  /** Highest schema version this build can handle. */
  readonly supportedVersion: number;

  constructor(databaseVersion: number, supportedVersion: number) {
    super(
      `database user_version ${databaseVersion} is newer than the supported version ${supportedVersion}`,
    );
    this.name = "DatabaseDowngradeError";
    this.databaseVersion = databaseVersion;
    this.supportedVersion = supportedVersion;
  }
}

/**
 * Read `PRAGMA user_version` from an open connection.
 *
 * @param db - Open database connection.
 * @returns The schema version stored in the database file (0 for a fresh file).
 */
export const getUserVersion = (db: DatabaseSync): number => {
  const row = db.prepare("PRAGMA user_version").get() as
    | { user_version?: number }
    | undefined;
  return row?.user_version ?? 0;
};

/**
 * Bring the connected database up to the newest schema version.
 *
 * Compares `PRAGMA user_version` against the ordered migration list and
 * applies every pending script in its own transaction; a failure rolls the
 * current script back and re-throws so the caller treats it as a startup
 * error. Forward-only — when the file reports a version newer than the list,
 * a {@link DatabaseDowngradeError} is thrown instead of touching the file.
 *
 * @param db - Open database connection.
 * @param migrationList - Ordered scripts; defaults to the bundled migrations
 *   (injectable for unit tests).
 * @returns void.
 */
export const runMigrations = (
  db: DatabaseSync,
  migrationList: readonly string[] = migrations,
): void => {
  const current = getUserVersion(db);
  if (current > migrationList.length) {
    throw new DatabaseDowngradeError(current, migrationList.length);
  }

  for (let version = current + 1; version <= migrationList.length; version++) {
    const sql = migrationList[version - 1];
    if (sql === undefined) {
      break;
    }

    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.exec(`PRAGMA user_version = ${version}`);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
};
