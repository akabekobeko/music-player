import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { upsertMusic } from "../library/musicRepository";
import type { MusicRowInput } from "../library/trackMapping";
import { createPlaylist } from "./createPlaylist";
import { getPlaylistMusics } from "./getPlaylistMusics";
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
