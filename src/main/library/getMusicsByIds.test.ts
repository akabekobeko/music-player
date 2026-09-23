import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { getMusicsByIds } from "./getMusicsByIds";
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
  durationMs: 0,
  bpm: null,
  rating: null,
});

const NOW = "2026-09-23T00:00:00.000Z";

const idOf = (filePath: string): number =>
  (
    db.prepare("SELECT id FROM musics WHERE file_path = ?").get(filePath) as {
      id: number;
    }
  ).id;

it("returns tracks in the order of the requested ids", () => {
  upsertMusic(db, row("/m/a.mp3", "A"), NOW);
  upsertMusic(db, row("/m/b.mp3", "B"), NOW);
  const a = idOf("/m/a.mp3");
  const b = idOf("/m/b.mp3");

  expect(getMusicsByIds(db, [b, a]).map((music) => music.title)).toEqual([
    "B",
    "A",
  ]);
});

it("omits ids that do not exist", () => {
  upsertMusic(db, row("/m/a.mp3", "A"), NOW);

  const musics = getMusicsByIds(db, [idOf("/m/a.mp3"), 999]);
  expect(musics.map((music) => music.title)).toEqual(["A"]);
});

it("returns an empty list for no ids", () => {
  expect(getMusicsByIds(db, [])).toEqual([]);
});

it("joins the artwork path", () => {
  const pictureId = getOrCreatePictureId(db, "/images/cover.jpg");
  upsertMusic(db, row("/m/a.mp3", "A"), NOW, pictureId);

  const [music] = getMusicsByIds(db, [idOf("/m/a.mp3")]);
  expect(music?.picturePath).toBe("/images/cover.jpg");
  expect(music?.pictureId).toBe(pictureId);
});
