import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/migrate";
import { upsertMusic } from "../library/musicRepository";
import type { MusicRowInput } from "../library/trackMapping";
import {
  createPlaylist,
  getPlaylistMusics,
  listPlaylists,
  removePlaylist,
  updatePlaylist,
} from "./playlistQueries";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const NOW = "2026-08-10T00:00:00.000Z";

const row = (filePath: string, title: string): MusicRowInput => ({
  filePath,
  audioFormat: "mp3",
  title,
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
});

/** Insert `count` tracks and return their ids in insertion order. */
const seedMusics = (count: number): number[] => {
  for (let index = 0; index < count; index += 1) {
    upsertMusic(db, row(`/m/${index}.mp3`, `T${index}`), NOW);
  }

  return (
    db.prepare("SELECT id FROM musics ORDER BY id").all() as Array<{
      id: number;
    }>
  ).map((entry) => entry.id);
};

const RULES = {
  version: 1,
  match: "all",
  conditions: [{ field: "genre", operator: "is", value: "Rock" }],
} as const;

it("creates static playlists with incrementing sort order", () => {
  const first = createPlaylist(db, { kind: "static", name: "One" }, NOW);
  const second = createPlaylist(db, { kind: "static", name: "Two" }, NOW);

  expect(first).toEqual({ id: 1, kind: "static", name: "One", sortOrder: 0 });
  expect(second.sortOrder).toBe(1);
});

it("creates a smart playlist with its rules and rejects missing rules", () => {
  const smart = createPlaylist(
    db,
    { kind: "smart", name: "S", rules: RULES },
    NOW,
  );
  expect(smart).toEqual({
    id: 1,
    kind: "smart",
    name: "S",
    sortOrder: 0,
    rules: RULES,
  });

  expect(() => createPlaylist(db, { kind: "smart", name: "Bad" }, NOW)).toThrow(
    /rules/,
  );
});

it("lists static playlists before smart ones, each by sort order", () => {
  createPlaylist(db, { kind: "smart", name: "S", rules: RULES }, NOW);
  createPlaylist(db, { kind: "static", name: "B" }, NOW);
  createPlaylist(db, { kind: "static", name: "A" }, NOW);

  expect(listPlaylists(db).map((entry) => [entry.kind, entry.name])).toEqual([
    ["static", "B"],
    ["static", "A"],
    ["smart", "S"],
  ]);
});

it("renames a playlist without touching its tracks", () => {
  const ids = seedMusics(2);
  const playlist = createPlaylist(db, { kind: "static", name: "Old" }, NOW);
  updatePlaylist(db, { id: playlist.id, kind: "static", musicIds: ids }, NOW);

  const renamed = updatePlaylist(
    db,
    { id: playlist.id, kind: "static", name: "New" },
    NOW,
  );
  expect(renamed.name).toBe("New");
  expect(
    getPlaylistMusics(db, { playlistId: playlist.id, kind: "static" }),
  ).toHaveLength(2);
});

it("replaces the full track order wholesale via musicIds", () => {
  const ids = seedMusics(3);
  const playlist = createPlaylist(db, { kind: "static", name: "P" }, NOW);
  updatePlaylist(db, { id: playlist.id, kind: "static", musicIds: ids }, NOW);
  updatePlaylist(
    db,
    {
      id: playlist.id,
      kind: "static",
      musicIds: [ids[2] as number, ids[0] as number],
    },
    NOW,
  );

  expect(
    getPlaylistMusics(db, { playlistId: playlist.id, kind: "static" }).map(
      (music) => music.id,
    ),
  ).toEqual([ids[2], ids[0]]);
});

it("allows the same track at multiple positions", () => {
  const ids = seedMusics(1);
  const id = ids[0] as number;
  const playlist = createPlaylist(db, { kind: "static", name: "P" }, NOW);
  updatePlaylist(
    db,
    { id: playlist.id, kind: "static", musicIds: [id, id, id] },
    NOW,
  );

  expect(
    getPlaylistMusics(db, { playlistId: playlist.id, kind: "static" }),
  ).toHaveLength(3);
});

it("updates smart playlist rules", () => {
  const smart = createPlaylist(
    db,
    { kind: "smart", name: "S", rules: RULES },
    NOW,
  );
  const nextRules = { ...RULES, match: "any" } as const;
  const updated = updatePlaylist(
    db,
    { id: smart.id, kind: "smart", rules: nextRules },
    NOW,
  );
  expect(updated.rules).toEqual(nextRules);
});

it("removes a playlist and its rows, keeping the musics", () => {
  const ids = seedMusics(2);
  const playlist = createPlaylist(db, { kind: "static", name: "P" }, NOW);
  updatePlaylist(db, { id: playlist.id, kind: "static", musicIds: ids }, NOW);

  removePlaylist(db, { id: playlist.id, kind: "static" });
  expect(listPlaylists(db)).toEqual([]);
  expect(
    db.prepare("SELECT COUNT(*) AS count FROM playlist_musics").get(),
  ).toEqual({ count: 0 });
  expect(db.prepare("SELECT COUNT(*) AS count FROM musics").get()).toEqual({
    count: 2,
  });
});

it("drops tracks from playlists when the music leaves the library", () => {
  const ids = seedMusics(2);
  const playlist = createPlaylist(db, { kind: "static", name: "P" }, NOW);
  updatePlaylist(db, { id: playlist.id, kind: "static", musicIds: ids }, NOW);

  db.prepare("DELETE FROM musics WHERE id = ?").run(ids[0] as number);
  expect(
    getPlaylistMusics(db, { playlistId: playlist.id, kind: "static" }).map(
      (music) => music.id,
    ),
  ).toEqual([ids[1]]);
});

it("evaluates a smart playlist's rules on getMusics", () => {
  seedMusics(2); // genre "" — no Rock matches.
  upsertMusic(db, { ...row("/m/rock.mp3", "R"), genre: "Rock" }, NOW);
  const smart = createPlaylist(
    db,
    { kind: "smart", name: "S", rules: RULES },
    NOW,
  );
  expect(
    getPlaylistMusics(db, { playlistId: smart.id, kind: "smart" }).map(
      (music) => music.filePath,
    ),
  ).toEqual(["/m/rock.mp3"]);
});

it("throws for unknown playlist ids", () => {
  expect(() => removePlaylist(db, { id: 99, kind: "static" })).toThrow(
    /not found/i,
  );
  expect(() =>
    updatePlaylist(db, { id: 99, kind: "smart", name: "X" }, NOW),
  ).toThrow(/not found/i);
  expect(() =>
    getPlaylistMusics(db, { playlistId: 99, kind: "static" }),
  ).toThrow(/not found/i);
});
