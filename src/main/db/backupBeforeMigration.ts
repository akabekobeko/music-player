import { copyFileSync, existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { getUserVersion } from "./getUserVersion";
import { migrations } from "./migrations";

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
 * @param filePath - Database file path (same value passed to
 *   {@link import("./connection").openDatabase}).
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
