import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { isLibraryMusicPath } from "./isLibraryMusicPath";

let db: DatabaseSync | null = null;

afterEach(() => {
  db?.close();
  db = null;
});

const openLibrary = (registeredPath: string): DatabaseSync => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
  db.prepare(
    "INSERT INTO musics (file_path, audio_format, title, added_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  ).run(
    registeredPath,
    "flac",
    "Song",
    "2026-01-01T00:00:00Z",
    "2026-01-01T00:00:00Z",
  );
  return db;
};

it("accepts a path registered in the musics table", () => {
  const library = openLibrary("/music/song.flac");

  expect(isLibraryMusicPath(library, "/music/song.flac")).toBe(true);
});

it("rejects a path missing from the musics table", () => {
  const library = openLibrary("/music/song.flac");

  expect(isLibraryMusicPath(library, "/etc/passwd")).toBe(false);
  expect(isLibraryMusicPath(library, "/music/other.flac")).toBe(false);
});
