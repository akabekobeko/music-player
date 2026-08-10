import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/migrate";
import type { SmartCondition, SmartPlaylistRules } from "../ipc/types";
import { upsertMusic } from "../library/musicRepository";
import type { MusicRowInput } from "../library/trackMapping";
import {
  buildConditionSql,
  buildSmartSql,
  evaluateSmartPlaylist,
} from "./smartQuery";

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

// --- buildConditionSql -----------------------------------------------------

it("converts text conditions (is / isNot / contains)", () => {
  expect(
    buildConditionSql({ field: "artist", operator: "is", value: "A" }, NOW),
  ).toEqual({ sql: "m.artist = ?", params: ["A"] });
  expect(
    buildConditionSql({ field: "genre", operator: "isNot", value: "B" }, NOW),
  ).toEqual({ sql: "m.genre <> ?", params: ["B"] });
  expect(
    buildConditionSql(
      { field: "title", operator: "contains", value: "50%_off" },
      NOW,
    ),
  ).toEqual({
    sql: "m.title LIKE ? ESCAPE '\\'",
    params: ["%50\\%\\_off%"],
  });
});

it("maps albumArtist to the album_artist column", () => {
  expect(
    buildConditionSql(
      { field: "albumArtist", operator: "is", value: "VA" },
      NOW,
    ).sql,
  ).toBe("m.album_artist = ?");
});

it("converts year conditions including between", () => {
  expect(
    buildConditionSql({ field: "year", operator: "is", value: 1999 }, NOW),
  ).toEqual({ sql: "m.year = ?", params: [1999] });
  expect(
    buildConditionSql(
      { field: "year", operator: "between", value: 1990, value2: 1999 },
      NOW,
    ),
  ).toEqual({ sql: "m.year BETWEEN ? AND ?", params: [1990, 1999] });
  expect(
    buildConditionSql({ field: "year", operator: "gte", value: 2000 }, NOW),
  ).toEqual({ sql: "m.year >= ?", params: [2000] });
});

it("converts duration seconds into the milliseconds column", () => {
  expect(
    buildConditionSql({ field: "duration", operator: "gte", value: 90 }, NOW),
  ).toEqual({ sql: "m.duration_ms >= ?", params: [90000] });
});

it("converts rating bounds", () => {
  expect(
    buildConditionSql({ field: "rating", operator: "lte", value: 0.5 }, NOW),
  ).toEqual({ sql: "m.rating <= ?", params: [0.5] });
});

it("converts addedAt inLastDays into an ISO cutoff from now", () => {
  expect(
    buildConditionSql(
      { field: "addedAt", operator: "inLastDays", value: 7 },
      NOW,
    ),
  ).toEqual({
    sql: "m.added_at >= ?",
    params: ["2026-08-03T00:00:00.000Z"],
  });
});

it("throws for a malformed condition document", () => {
  expect(() =>
    buildConditionSql(
      {
        field: "plays",
        operator: "gte",
        value: 1,
      } as unknown as SmartCondition,
      NOW,
    ),
  ).toThrow(/Unsupported/);
});

// --- buildSmartSql ---------------------------------------------------------

it("joins conditions with AND for match=all and OR for match=any", () => {
  const conditions: SmartCondition[] = [
    { field: "genre", operator: "is", value: "Rock" },
    { field: "year", operator: "gte", value: 2000 },
  ];
  expect(buildSmartSql(rules(conditions), NOW).sql).toContain(
    "(m.genre = ?) AND (m.year >= ?)",
  );
  expect(buildSmartSql(rules(conditions, { match: "any" }), NOW).sql).toContain(
    "(m.genre = ?) OR (m.year >= ?)",
  );
});

it("emits no WHERE for an empty condition list", () => {
  expect(buildSmartSql(rules([]), NOW).sql).not.toContain("WHERE");
});

it("emits the sort clause (field order, random, and the stable default)", () => {
  expect(
    buildSmartSql(rules([], { sort: { field: "year", order: "desc" } }), NOW)
      .sql,
  ).toContain("ORDER BY m.year DESC");
  expect(
    buildSmartSql(rules([], { sort: { field: "random" } }), NOW).sql,
  ).toContain("ORDER BY RANDOM()");
  expect(buildSmartSql(rules([]), NOW).sql).toContain(
    "ORDER BY m.artist, m.album, m.disc, m.track",
  );
});

it("appends LIMIT as a parameter when set", () => {
  const { sql, params } = buildSmartSql(rules([], { limit: 25 }), NOW);
  expect(sql).toContain("LIMIT ?");
  expect(params).toEqual([25]);
});

// --- evaluateSmartPlaylist -------------------------------------------------

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
