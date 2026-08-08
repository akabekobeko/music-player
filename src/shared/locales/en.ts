import type { Dictionary } from "./types";

/**
 * English translation table.
 *
 * Source of truth for the key set: every other locale must define exactly the
 * same keys (enforced by `t.test.ts`). Additions go here first so reviewers
 * can read the natural-English copy alongside the keys before translating the
 * other dictionaries.
 */
export const en: Dictionary = {
  "app.name": "Music Player",
  "dialog.db.downgrade.title": "Cannot Start",
  "dialog.db.downgrade.message":
    "The library database was created by a newer version of {appName}. Update the app to continue.",
  "dialog.db.migrationFailed.title": "Database Error",
  "dialog.db.migrationFailed.message":
    "Failed to update the library database: {message}",
};
