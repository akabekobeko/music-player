import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { cleanupLibraryOrphans } from "./cleanupLibraryOrphans";
import { getOrCreatePictureId } from "./getOrCreatePictureId";
import { upsertMusic } from "./musicRepository";
import { registerArtistPictureIfMissing } from "./registerArtistPictureIfMissing";
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

/** Import one track (optionally with artwork) the way `runImport` does. */
const importTrack = (
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

it("is a no-op on a library without orphans", () => {
  importTrack("/m/a.mp3", "Artist", "/images/a.jpg");
  expect(cleanupLibraryOrphans(db)).toEqual([]);
  expect(count("artist_pictures")).toBe(1);
  expect(count("pictures")).toBe(1);
});

it("drops the artist picture stranded by a re-import that renamed the artist", () => {
  importTrack("/m/a.mp3", "Old Name", "/images/a.jpg");
  // Same file re-imported after its artist tag changed.
  importTrack("/m/a.mp3", "New Name", "/images/a.jpg");

  expect(cleanupLibraryOrphans(db)).toEqual([]);
  // The old association is gone; the picture survives as the track's artwork.
  expect(db.prepare("SELECT artist FROM artist_pictures").all()).toEqual([
    { artist: "New Name" },
  ]);
  expect(count("pictures")).toBe(1);
});

it("GCs a picture once neither a track nor an artist references it", () => {
  importTrack("/m/a.mp3", "Old Name", "/images/old.jpg");
  // Re-import with a renamed artist *and* new artwork: the old picture's
  // last reference is the stranded artist_pictures row.
  importTrack("/m/a.mp3", "New Name", "/images/new.jpg");

  expect(cleanupLibraryOrphans(db)).toEqual(["/images/old.jpg"]);
  expect(db.prepare("SELECT file_path FROM pictures").all()).toEqual([
    { file_path: "/images/new.jpg" },
  ]);
});
