import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import type { SmartCondition, SmartPlaylistRules } from "../ipc/types";
import { upsertMusic } from "../library/musicRepository";
import type { MusicRowInput } from "../library/trackMapping";
import { evaluateSmartPlaylist } from "./evaluateSmartPlaylist";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const NOW = new Date("2026-08-10T00:00:00.000Z");

const rules = (
  conditions: SmartCondition[],
  overrides: Partial<SmartPlaylistRules> = {},
): SmartPlaylistRules => ({
  version: 1,
  match: "all",
  conditions,
  ...overrides,
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
  durationMs: 1000,
  bpm: null,
  rating: null,
  ...overrides,
});

it("evaluates rules against the library", () => {
  upsertMusic(
    db,
    row("/m/1.mp3", { genre: "Rock", year: 2001 }),
    NOW.toISOString(),
  );
  upsertMusic(
    db,
    row("/m/2.mp3", { genre: "Rock", year: 1980 }),
    NOW.toISOString(),
  );
  upsertMusic(
    db,
    row("/m/3.mp3", { genre: "Jazz", year: 2001 }),
    NOW.toISOString(),
  );

  const musics = evaluateSmartPlaylist(
    db,
    rules([
      { field: "genre", operator: "is", value: "Rock" },
      { field: "year", operator: "gte", value: 2000 },
    ]),
    NOW,
  );
  expect(musics.map((music) => music.filePath)).toEqual(["/m/1.mp3"]);
});

it("applies sort and limit to the evaluation", () => {
  upsertMusic(db, row("/m/1.mp3", { year: 1990 }), NOW.toISOString());
  upsertMusic(db, row("/m/2.mp3", { year: 2010 }), NOW.toISOString());
  upsertMusic(db, row("/m/3.mp3", { year: 2000 }), NOW.toISOString());

  const musics = evaluateSmartPlaylist(
    db,
    rules([], { sort: { field: "year", order: "desc" }, limit: 2 }),
    NOW,
  );
  expect(musics.map((music) => music.year)).toEqual([2010, 2000]);
});

it("matches recently added tracks via the injected now", () => {
  upsertMusic(db, row("/m/old.mp3"), "2026-07-01T00:00:00.000Z");
  upsertMusic(db, row("/m/new.mp3"), "2026-08-08T00:00:00.000Z");

  const musics = evaluateSmartPlaylist(
    db,
    rules([{ field: "addedAt", operator: "inLastDays", value: 7 }]),
    NOW,
  );
  expect(musics.map((music) => music.filePath)).toEqual(["/m/new.mp3"]);
});
