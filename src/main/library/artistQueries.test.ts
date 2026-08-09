import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/migrate";
import { getArtists } from "./artistQueries";
import { upsertMusic } from "./musicRepository";
import {
  getOrCreatePictureId,
  registerArtistPictureIfMissing,
} from "./pictureRepository";
import type { MusicRowInput } from "./trackMapping";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const row = (filePath: string, artist: string): MusicRowInput => ({
  filePath,
  audioFormat: "mp3",
  title: "T",
  artist,
  albumArtist: "",
  album: "",
  disc: 1,
  track: 0,
  year: null,
  genre: "",
  composer: "",
  durationMs: 0,
  bpm: null,
  rating: null,
});

const NOW = "2026-08-09T00:00:00.000Z";

it("returns distinct artists with their track counts", () => {
  upsertMusic(db, row("/m/a1.mp3", "Alpha"), NOW);
  upsertMusic(db, row("/m/a2.mp3", "Alpha"), NOW);
  upsertMusic(db, row("/m/b1.mp3", "Beta"), NOW);

  expect(getArtists(db)).toEqual([
    { name: "Alpha", musicCount: 2, picturePath: null },
    { name: "Beta", musicCount: 1, picturePath: null },
  ]);
});

it("joins the representative artwork path", () => {
  upsertMusic(db, row("/m/a1.mp3", "Alpha"), NOW);
  const pictureId = getOrCreatePictureId(db, "/images/alpha.jpg");
  registerArtistPictureIfMissing(db, "Alpha", pictureId);

  expect(getArtists(db)).toEqual([
    { name: "Alpha", musicCount: 1, picturePath: "/images/alpha.jpg" },
  ]);
});

it("includes artists with an empty name (untagged files)", () => {
  upsertMusic(db, row("/m/x.mp3", ""), NOW);
  expect(getArtists(db)).toEqual([
    { name: "", musicCount: 1, picturePath: null },
  ]);
});

it("returns an empty list for an empty library", () => {
  expect(getArtists(db)).toEqual([]);
});
