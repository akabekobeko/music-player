import type { DatabaseSync } from "node:sqlite";

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
