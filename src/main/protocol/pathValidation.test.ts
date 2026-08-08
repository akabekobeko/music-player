import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, it } from "vitest";
import { runMigrations } from "../db/migrate";
import { isLibraryMusicPath, resolveImagePath } from "./pathValidation";

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

it("resolves a path inside the images directory", () => {
  const imagesDir = path.join("/data", "images");

  expect(resolveImagePath(path.join(imagesDir, "abc.jpg"), imagesDir)).toBe(
    path.join(imagesDir, "abc.jpg"),
  );
});

it("rejects a traversal escaping the images directory", () => {
  const imagesDir = path.join("/data", "images");

  expect(
    resolveImagePath(path.join(imagesDir, "..", "settings.json"), imagesDir),
  ).toBeNull();
  expect(resolveImagePath("/etc/passwd", imagesDir)).toBeNull();
});

it("rejects the images directory itself", () => {
  const imagesDir = path.join("/data", "images");

  expect(resolveImagePath(imagesDir, imagesDir)).toBeNull();
});

it("rejects a sibling directory sharing the prefix", () => {
  // "/data/images-evil" starts with "/data/images" as a string but is not
  // inside it — the separator-suffixed comparison must reject it.
  const imagesDir = path.join("/data", "images");

  expect(
    resolveImagePath(path.join("/data", "images-evil", "a.jpg"), imagesDir),
  ).toBeNull();
});
