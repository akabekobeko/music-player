import type { DatabaseSync } from "node:sqlite";
import { DatabaseDowngradeError } from "./DatabaseDowngradeError";
import { getUserVersion } from "./getUserVersion";
import { migrations } from "./migrations";

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

  // Pending scripts only; the offset within that tail maps back to the
  // schema version the script upgrades the file to.
  for (const [offset, sql] of migrationList.slice(current).entries()) {
    const version = current + offset + 1;

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
