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
