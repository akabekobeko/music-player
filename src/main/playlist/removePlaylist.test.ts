import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { upsertMusic } from "../library/musicRepository";
import type { MusicRowInput } from "../library/trackMapping";
import { createPlaylist } from "./createPlaylist";
import { listPlaylists } from "./listPlaylists";
import { removePlaylist } from "./removePlaylist";
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
