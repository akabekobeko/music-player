import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/migrate";
import { buildAlbumWhere, getAlbums, getFilterOptions } from "./albumQueries";
import { upsertMusic } from "./musicRepository";
import { getOrCreatePictureId } from "./pictureRepository";
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

// --- buildAlbumWhere -------------------------------------------------------

it("builds no fragment for an empty filter", () => {
  expect(buildAlbumWhere({})).toEqual([]);
  expect(buildAlbumWhere({ text: "  ", genres: [], decades: [] })).toEqual([]);
});

it("builds a text fragment matching album and artist", () => {
  expect(buildAlbumWhere({ text: "abba" })).toEqual([
    {
      sql: "(m.album LIKE ? ESCAPE '\\' OR COALESCE(NULLIF(m.album_artist, ''), m.artist) LIKE ? ESCAPE '\\')",
      params: ["%abba%", "%abba%"],
    },
  ]);
});

it("escapes LIKE metacharacters in the text", () => {
  const [fragment] = buildAlbumWhere({ text: "100%_\\" });
  expect(fragment?.params[0]).toBe("%100\\%\\_\\\\%");
});

it("builds a genre IN fragment", () => {
  expect(buildAlbumWhere({ genres: ["Rock", "Jazz"] })).toEqual([
    { sql: "m.genre IN (?, ?)", params: ["Rock", "Jazz"] },
  ]);
});

it("builds a decade fragment with year ranges OR-joined", () => {
  expect(buildAlbumWhere({ decades: [1990, 2000] })).toEqual([
    {
      sql: "((m.year >= ? AND m.year < ?) OR (m.year >= ? AND m.year < ?))",
      params: [1990, 2000, 2000, 2010],
    },
  ]);
});

it("maps the null decade to year IS NULL", () => {
  expect(buildAlbumWhere({ decades: [null, 1980] })).toEqual([
    {
      sql: "(m.year IS NULL OR (m.year >= ? AND m.year < ?))",
      params: [1980, 1990],
    },
  ]);
});

it("combines filter kinds with AND (one fragment per kind)", () => {
  const fragments = buildAlbumWhere({
    text: "a",
    genres: ["Rock"],
    decades: [2000],
  });
  expect(fragments).toHaveLength(3);
});

// --- getAlbums -------------------------------------------------------------

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

// --- getFilterOptions ------------------------------------------------------

it("lists distinct genres with album counts, excluding empty", () => {
  upsertMusic(db, row("/m/1.mp3", { album: "A", genre: "Rock" }), NOW);
  upsertMusic(db, row("/m/2.mp3", { album: "A", genre: "Rock" }), NOW);
  upsertMusic(db, row("/m/3.mp3", { album: "B", genre: "Rock" }), NOW);
  upsertMusic(db, row("/m/4.mp3", { album: "C", genre: "Jazz" }), NOW);
  upsertMusic(db, row("/m/5.mp3", { album: "D", genre: "" }), NOW);

  expect(getFilterOptions(db).genres).toEqual([
    { name: "Jazz", count: 1 },
    { name: "Rock", count: 2 },
  ]);
});

it("reports the library-wide year range", () => {
  upsertMusic(db, row("/m/1.mp3", { album: "A", year: 1987 }), NOW);
  upsertMusic(db, row("/m/2.mp3", { album: "B", year: 2020 }), NOW);
  upsertMusic(db, row("/m/3.mp3", { album: "C", year: null }), NOW);

  expect(getFilterOptions(db).yearRange).toEqual({ min: 1987, max: 2020 });
});

it("returns a null year range for an empty or year-less library", () => {
  expect(getFilterOptions(db).yearRange).toBeNull();
  upsertMusic(db, row("/m/1.mp3", { year: null }), NOW);
  expect(getFilterOptions(db).yearRange).toBeNull();
});
