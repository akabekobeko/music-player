import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import type { SmartPlaylistRules } from "../ipc/types";
import { upsertMusic } from "../library/musicRepository";
import type { MusicRowInput } from "../library/trackMapping";
import { createPlaylist } from "./createPlaylist";
import { getPlaylistMusics } from "./getPlaylistMusics";
import { readPlaylist } from "./readPlaylist";
import { updatePlaylist } from "./updatePlaylist";

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
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
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

it("rejects a rule document that fails the schema and keeps the stored one", () => {
  const created = createPlaylist(
    db,
    { kind: "smart", name: "S", rules: RULES },
    NOW,
  );
  const rules = { version: 2 } as unknown as SmartPlaylistRules;

  expect(() =>
    updatePlaylist(db, { id: created.id, kind: "smart", rules }, NOW),
  ).toThrow();
  expect(readPlaylist(db, "smart", created.id).rules).toEqual(RULES);
});

it("renames a smart playlist whose stored rules are corrupted", () => {
  db.prepare(
    `INSERT INTO smart_playlists (id, name, rules, sort_order, created_at, updated_at)
     VALUES (9, 'Broken', 'not json', 0, ?, ?)`,
  ).run(NOW, NOW);

  expect(() =>
    updatePlaylist(db, { id: 9, kind: "smart", name: "Renamed" }, NOW),
  ).toThrow(/not valid JSON/);
  expect(
    db.prepare("SELECT name FROM smart_playlists WHERE id = 9").get(),
  ).toEqual({ name: "Renamed" });
});
