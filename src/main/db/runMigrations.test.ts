import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, it } from "vitest";
import { DatabaseDowngradeError } from "./DatabaseDowngradeError";
import { getUserVersion } from "./getUserVersion";
import { migrations } from "./migrations";
import { runMigrations } from "./runMigrations";

let db: DatabaseSync;

afterEach(() => {
  db.close();
});

const tableNames = (database: DatabaseSync): string[] =>
  database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()
    .map((row) => (row as { name: string }).name);

it("applies the bundled v1 schema to a fresh database", () => {
  db = new DatabaseSync(":memory:");

  runMigrations(db);

  expect(getUserVersion(db)).toBe(migrations.length);
  const tables = tableNames(db);
  for (const table of [
    "musics",
    "pictures",
    "artist_pictures",
    "playlists",
    "playlist_musics",
    "smart_playlists",
  ]) {
    expect(tables).toContain(table);
  }
});

it("is a no-op when the database is already up to date", () => {
  db = new DatabaseSync(":memory:");

  runMigrations(db);
  runMigrations(db);

  expect(getUserVersion(db)).toBe(migrations.length);
});

it("applies only the pending scripts", () => {
  db = new DatabaseSync(":memory:");
  const list = [
    "CREATE TABLE first (id INTEGER)",
    "CREATE TABLE second (id INTEGER)",
  ];

  runMigrations(db, [list[0] as string]);
  expect(getUserVersion(db)).toBe(1);

  runMigrations(db, list);
  expect(getUserVersion(db)).toBe(2);
  expect(tableNames(db)).toContain("second");
});

it("rolls back a failed script and keeps the previous version", () => {
  db = new DatabaseSync(":memory:");
  const list = [
    "CREATE TABLE first (id INTEGER)",
    "CREATE TABLE second (id INTEGER); THIS IS NOT SQL;",
  ];

  expect(() => runMigrations(db, list)).toThrow();

  // The failed script's partial work is rolled back, the good one stays.
  expect(getUserVersion(db)).toBe(1);
  expect(tableNames(db)).toContain("first");
  expect(tableNames(db)).not.toContain("second");
});

it("throws DatabaseDowngradeError when user_version is newer than the list", () => {
  db = new DatabaseSync(":memory:");
  db.exec("PRAGMA user_version = 99");

  expect(() => runMigrations(db)).toThrow(DatabaseDowngradeError);
  try {
    runMigrations(db);
  } catch (error) {
    expect(error).toBeInstanceOf(DatabaseDowngradeError);
    if (error instanceof DatabaseDowngradeError) {
      expect(error.databaseVersion).toBe(99);
      expect(error.supportedVersion).toBe(migrations.length);
    }
  }
});
