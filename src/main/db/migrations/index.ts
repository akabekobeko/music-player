import m001 from "./001_initial.sql?raw";

/**
 * Ordered migration scripts. Index `i` migrates the database from
 * `user_version === i` to `i + 1`.
 *
 * Vite's `?raw` import inlines each SQL file into the Main bundle, so the
 * packaged app carries no loose migration files.
 *
 * Rules (docs/specs/v1.0/architecture/database.md):
 * - forward-only — no down migrations
 * - an applied file must never change; schema changes go into a NEW numbered
 *   file appended here
 */
export const migrations: readonly string[] = [m001];
