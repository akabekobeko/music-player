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

it("nullifies junk years (<= 0) when migrating an existing library", () => {
  db = new DatabaseSync(":memory:");
  runMigrations(db, [migrations[0] as string]);
  db.exec(
    `INSERT INTO musics (file_path, audio_format, title, year, added_at, updated_at)
     VALUES ('/m/a.mp3', 'mp3', 'T', -1, '', ''),
            ('/m/b.mp3', 'mp3', 'T', 1987, '', '')`,
  );

  runMigrations(db);

  const years = db
    .prepare("SELECT year FROM musics ORDER BY file_path")
    .all() as Array<{ year: number | null }>;
  expect(years).toEqual([{ year: null }, { year: 1987 }]);
});

it("re-keys artist_pictures to display artists when migrating", () => {
  db = new DatabaseSync(":memory:");
  runMigrations(db, migrations.slice(0, 2));
  db.exec(
    `INSERT INTO pictures (id, file_path) VALUES (1, '/img/1.jpg'), (2, '/img/2.jpg');
     INSERT INTO musics (file_path, audio_format, title, artist, album_artist, picture_id, added_at, updated_at)
     VALUES ('/m/1.mp3', 'mp3', 'T', 'Feat A', 'Various', 1, '', ''),
            ('/m/2.mp3', 'mp3', 'T', 'Solo', '', 2, '', '');
     INSERT INTO artist_pictures (artist, picture_id) VALUES ('Feat A', 1), ('Solo', 2)`,
  );

  runMigrations(db);

  // 'Feat A' is unreachable (its display artist is 'Various') — dropped;
  // 'Various' gains a representative picture; 'Solo' keeps its row.
  const rows = db
    .prepare("SELECT artist, picture_id FROM artist_pictures ORDER BY artist")
    .all();
  expect(rows).toEqual([
    { artist: "Solo", picture_id: 2 },
    { artist: "Various", picture_id: 1 },
  ]);
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
