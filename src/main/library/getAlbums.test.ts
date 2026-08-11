import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { getAlbums } from "./getAlbums";
import { getOrCreatePictureId } from "./getOrCreatePictureId";
import { upsertMusic } from "./musicRepository";
import type { MusicRowInput } from "./trackMapping";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

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
  durationMs: 0,
  bpm: null,
  rating: null,
  ...overrides,
});

const NOW = "2026-08-09T00:00:00.000Z";

it("groups tracks by album identity and aggregates the summary", () => {
  upsertMusic(
    db,
    row("/m/1.mp3", { album: "A", year: 2001, genre: "Rock", durationMs: 100 }),
    NOW,
  );
  upsertMusic(
    db,
    row("/m/2.mp3", { album: "A", year: 2001, genre: "Rock", durationMs: 50 }),
    NOW,
  );
  upsertMusic(db, row("/m/3.mp3", { album: "B", year: 1999 }), NOW);

  // Base order is artist → year ascending, so B (1999) precedes A (2001).
  expect(getAlbums(db, {})).toEqual([
    {
      albumKey: "Artist\u0000B",
      album: "B",
      artist: "Artist",
      year: 1999,
      genre: "",
      musicCount: 1,
      totalDurationMs: 0,
      picturePath: null,
    },
    {
      albumKey: "Artist\u0000A",
      album: "A",
      artist: "Artist",
      year: 2001,
      genre: "Rock",
      musicCount: 2,
      totalDurationMs: 150,
      picturePath: null,
    },
  ]);
});

it("keeps same-named albums by different album artists separate", () => {
  upsertMusic(db, row("/m/1.mp3", { artist: "One", album: "Best" }), NOW);
  upsertMusic(db, row("/m/2.mp3", { artist: "Two", album: "Best" }), NOW);

  const albums = getAlbums(db, {});
  expect(albums.map((album) => album.albumKey)).toEqual([
    "One\u0000Best",
    "Two\u0000Best",
  ]);
});

it("prefers album_artist over artist for the identity", () => {
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

  expect(getAlbums(db, {})).toHaveLength(1);
  expect(getAlbums(db, {})[0]?.artist).toBe("VA");
});

it("joins the representative artwork path", () => {
  const pictureId = getOrCreatePictureId(db, "/images/a.jpg");
  upsertMusic(db, row("/m/1.mp3"), NOW, pictureId);
  upsertMusic(db, row("/m/2.mp3"), NOW);

  expect(getAlbums(db, {})[0]?.picturePath).toBe("/images/a.jpg");
});

it("filters by text case-insensitively", () => {
  upsertMusic(db, row("/m/1.mp3", { album: "Abbey Road" }), NOW);
  upsertMusic(db, row("/m/2.mp3", { album: "Help!" }), NOW);

  expect(getAlbums(db, { text: "abbey" })).toHaveLength(1);
  expect(getAlbums(db, { text: "zep" })).toHaveLength(0);
});

it("filters by genre and decade combined with AND", () => {
  upsertMusic(
    db,
    row("/m/1.mp3", { album: "A", genre: "Rock", year: 1995 }),
    NOW,
  );
  upsertMusic(
    db,
    row("/m/2.mp3", { album: "B", genre: "Rock", year: 2005 }),
    NOW,
  );
  upsertMusic(
    db,
    row("/m/3.mp3", { album: "C", genre: "Jazz", year: 1995 }),
    NOW,
  );

  const albums = getAlbums(db, { genres: ["Rock"], decades: [1990] });
  expect(albums.map((album) => album.album)).toEqual(["A"]);
});

it("picks up unknown-year albums via the null decade", () => {
  upsertMusic(db, row("/m/1.mp3", { album: "A", year: null }), NOW);
  upsertMusic(db, row("/m/2.mp3", { album: "B", year: 2001 }), NOW);

  const albums = getAlbums(db, { decades: [null] });
  expect(albums.map((album) => album.album)).toEqual(["A"]);
});
