import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { upsertMusic } from "./musicRepository";
import { getLibraryStats } from "./statsQueries";
import type { MusicRowInput } from "./trackMapping";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const NOW = "2026-08-10T00:00:00.000Z";

const row = (
  filePath: string,
  overrides: Partial<MusicRowInput> = {},
): MusicRowInput => ({
  filePath,
  audioFormat: "mp3",
  title: "T",
  artist: "Artist",
  albumArtist: "",
  album: "Album",
  disc: 1,
  track: 0,
  year: null,
  genre: "",
  composer: "",
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
  durationMs: 1000,
  bpm: null,
  rating: null,
  ...overrides,
});

it("returns zeroes for an empty library", () => {
  expect(getLibraryStats(db)).toEqual({
    musicCount: 0,
    artistCount: 0,
    albumCount: 0,
    totalDurationMs: 0,
  });
});

it("counts tracks, artists, album identities, and total duration", () => {
  upsertMusic(db, row("/m/1.mp3", { artist: "A", album: "X" }), NOW);
  upsertMusic(db, row("/m/2.mp3", { artist: "A", album: "X" }), NOW);
  upsertMusic(db, row("/m/3.mp3", { artist: "B", album: "X" }), NOW);

  expect(getLibraryStats(db)).toEqual({
    musicCount: 3,
    artistCount: 2,
    // Same album name but different artists = two identity groups.
    albumCount: 2,
    totalDurationMs: 3000,
  });
});

it("groups albums and artists by album_artist when present", () => {
  upsertMusic(
    db,
    row("/m/1.mp3", { artist: "Feat A", albumArtist: "VA", album: "Comp" }),
    NOW,
  );
  upsertMusic(
    db,
    row("/m/2.mp3", { artist: "Feat B", albumArtist: "VA", album: "Comp" }),
    NOW,
  );

  expect(getLibraryStats(db).albumCount).toBe(1);
  // Artists count by the display artist — both tracks belong to "VA".
  expect(getLibraryStats(db).artistCount).toBe(1);
});
