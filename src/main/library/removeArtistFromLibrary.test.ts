import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { getOrCreatePictureId } from "./getOrCreatePictureId";
import { upsertMusic } from "./musicRepository";
import { registerArtistPictureIfMissing } from "./registerArtistPictureIfMissing";
import { removeArtistFromLibrary } from "./removeArtistFromLibrary";
import type { MusicRowInput } from "./trackMapping";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const row = (filePath: string, artist = "Artist"): MusicRowInput => ({
  filePath,
  audioFormat: "mp3",
  title: "T",
  artist,
  albumArtist: "",
  album: "",
  disc: 1,
  track: 0,
  year: null,
  genre: "",
  composer: "",
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
  durationMs: 0,
  bpm: null,
  rating: null,
});

const NOW = "2026-08-17T00:00:00.000Z";

/** Insert one track (optionally with artwork) the way the importer does. */
const insert = (
  filePath: string,
  artist = "Artist",
  artwork?: string,
): void => {
  const pictureId =
    artwork !== undefined ? getOrCreatePictureId(db, artwork) : null;
  upsertMusic(db, row(filePath, artist), NOW, pictureId);
  if (pictureId !== null) {
    registerArtistPictureIfMissing(db, artist, pictureId);
  }
};

const count = (table: string): number =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

it("removes every track of the artist and keeps other artists", () => {
  insert("/m/a1.mp3", "Target");
  insert("/m/a2.mp3", "Target");
  insert("/m/b.mp3", "Other");

  const result = removeArtistFromLibrary(db, "Target");
  expect(result.removed).toBe(2);
  expect(count("musics")).toBe(1);
});

it("is a no-op for an artist without tracks", () => {
  insert("/m/a.mp3", "Artist");
  const result = removeArtistFromLibrary(db, "Ghost");
  expect(result).toEqual({ removed: 0, orphanedFiles: [] });
  expect(count("musics")).toBe(1);
});

it("removes the unknown-artist bucket via the empty name", () => {
  insert("/m/untagged.mp3", "");
  insert("/m/b.mp3", "Other");

  const result = removeArtistFromLibrary(db, "");
  expect(result.removed).toBe(1);
  expect(count("musics")).toBe(1);
});

it("GCs the artist picture and orphaned artwork with the tracks", () => {
  insert("/m/a.mp3", "Target", "/images/t.jpg");
  insert("/m/b.mp3", "Other", "/images/o.jpg");

  const result = removeArtistFromLibrary(db, "Target");
  expect(result.orphanedFiles).toEqual(["/images/t.jpg"]);
  expect(db.prepare("SELECT artist FROM artist_pictures").all()).toEqual([
    { artist: "Other" },
  ]);
});
