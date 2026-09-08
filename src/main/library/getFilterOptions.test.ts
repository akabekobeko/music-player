import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { getFilterOptions } from "./getFilterOptions";
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
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
  durationMs: 0,
  bpm: null,
  rating: null,
  ...overrides,
});

const NOW = "2026-08-09T00:00:00.000Z";

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

it("lists only the decades that contain tracks with album counts, ascending", () => {
  upsertMusic(db, row("/m/1.mp3", { album: "A", year: 1987 }), NOW);
  upsertMusic(db, row("/m/2.mp3", { album: "A", year: 1985 }), NOW);
  upsertMusic(db, row("/m/3.mp3", { album: "B", year: 1985 }), NOW);
  upsertMusic(db, row("/m/4.mp3", { album: "C", year: 2020 }), NOW);
  upsertMusic(db, row("/m/5.mp3", { album: "D", year: 1709 }), NOW);
  upsertMusic(db, row("/m/6.mp3", { album: "E", year: null }), NOW);

  expect(getFilterOptions(db).decades).toEqual([
    { decade: 1700, count: 1 },
    { decade: 1980, count: 2 },
    { decade: 2020, count: 1 },
  ]);
});

it("counts an album once per decade its tracks span", () => {
  upsertMusic(db, row("/m/1.mp3", { album: "A", year: 1999 }), NOW);
  upsertMusic(db, row("/m/2.mp3", { album: "A", year: 2000 }), NOW);
  upsertMusic(db, row("/m/3.mp3", { album: "A", year: 2001 }), NOW);

  expect(getFilterOptions(db).decades).toEqual([
    { decade: 1990, count: 1 },
    { decade: 2000, count: 1 },
  ]);
});

it("counts albums with an unknown-year track separately", () => {
  upsertMusic(db, row("/m/1.mp3", { album: "A", year: null }), NOW);
  upsertMusic(db, row("/m/2.mp3", { album: "A", year: null }), NOW);
  upsertMusic(db, row("/m/3.mp3", { album: "B", year: 1990 }), NOW);
  upsertMusic(db, row("/m/4.mp3", { album: "B", year: null }), NOW);

  const options = getFilterOptions(db);
  expect(options.decades).toEqual([{ decade: 1990, count: 1 }]);
  expect(options.unknownYearCount).toBe(2);
});

it("returns no decades for an empty or year-less library", () => {
  expect(getFilterOptions(db)).toEqual({
    genres: [],
    decades: [],
    unknownYearCount: 0,
  });
  upsertMusic(db, row("/m/1.mp3", { year: null }), NOW);
  expect(getFilterOptions(db).decades).toEqual([]);
  expect(getFilterOptions(db).unknownYearCount).toBe(1);
});
