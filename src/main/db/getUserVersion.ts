import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";

/** Row of `PRAGMA user_version`. */
const userVersionRowSchema = z.object({ user_version: z.number().int() });

/**
 * Read `PRAGMA user_version` from an open connection.
 *
 * @param db - Open database connection.
 * @returns The schema version stored in the database file (0 for a fresh file).
 */
export const getUserVersion = (db: DatabaseSync): number => {
  return userVersionRowSchema.parse(db.prepare("PRAGMA user_version").get())
    .user_version;
};
