import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { getArtists } from "./artistQueries";
import { getOrCreatePictureId } from "./getOrCreatePictureId";
import { upsertMusic } from "./musicRepository";
import { registerArtistPictureIfMissing } from "./registerArtistPictureIfMissing";
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
  artist: string,
  albumArtist = "",
): MusicRowInput => ({
  filePath,
  audioFormat: "mp3",
  title: "T",
  artist,
  albumArtist,
  album: "",
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

it("groups by the album artist when it differs from the track artist", () => {
  upsertMusic(db, row("/m/c1.mp3", "Feat A", "Various"), NOW);
  upsertMusic(db, row("/m/c2.mp3", "Feat B", "Various"), NOW);

  expect(getArtists(db)).toEqual([
    { name: "Various", musicCount: 2, picturePath: null },
  ]);
});

it("falls back to the track artist when the album artist is empty", () => {
  upsertMusic(db, row("/m/a.mp3", "Solo", ""), NOW);
  upsertMusic(db, row("/m/b.mp3", "Solo", "Solo"), NOW);

  expect(getArtists(db)).toEqual([
    { name: "Solo", musicCount: 2, picturePath: null },
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
