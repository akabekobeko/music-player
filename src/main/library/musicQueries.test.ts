import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/migrate";
import { getMusicsByAlbum, getMusicsByArtist } from "./musicQueries";
import { upsertMusic } from "./musicRepository";
import { getOrCreatePictureId } from "./pictureRepository";
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
  patch: Partial<MusicRowInput> = {},
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
  ...patch,
});

const NOW = "2026-08-09T00:00:00.000Z";

it("returns only the requested artist's tracks in camelCase", () => {
  upsertMusic(db, row("/m/a.mp3", { title: "Mine" }), NOW);
  upsertMusic(db, row("/m/b.mp3", { artist: "Other" }), NOW);

  const musics = getMusicsByArtist(db, "Artist");
  expect(musics).toHaveLength(1);
  expect(musics[0]).toMatchObject({
    filePath: "/m/a.mp3",
    title: "Mine",
    artist: "Artist",
    albumArtist: "",
    durationMs: 1000,
    picturePath: null,
    addedAt: NOW,
  });
});

it("joins the artwork path from pictures", () => {
  const pictureId = getOrCreatePictureId(db, "/images/x.jpg");
  upsertMusic(db, row("/m/a.mp3"), NOW, pictureId);

  expect(getMusicsByArtist(db, "Artist")[0]?.picturePath).toBe("/images/x.jpg");
});

it("orders by album, disc, then track as a stable base", () => {
  upsertMusic(db, row("/m/1.mp3", { album: "B", disc: 1, track: 2 }), NOW);
  upsertMusic(db, row("/m/2.mp3", { album: "A", disc: 2, track: 1 }), NOW);
  upsertMusic(db, row("/m/3.mp3", { album: "A", disc: 1, track: 9 }), NOW);

  expect(getMusicsByArtist(db, "Artist").map((m) => m.filePath)).toEqual([
    "/m/3.mp3",
    "/m/2.mp3",
    "/m/1.mp3",
  ]);
});

it("returns an empty list for an unknown artist", () => {
  expect(getMusicsByArtist(db, "Nobody")).toEqual([]);
});

it("returns one album's tracks for its identity key", () => {
  upsertMusic(db, row("/m/1.mp3", { album: "A" }), NOW);
  upsertMusic(db, row("/m/2.mp3", { album: "B" }), NOW);

  const musics = getMusicsByAlbum(db, "Artist\u0000A");
  expect(musics.map((m) => m.filePath)).toEqual(["/m/1.mp3"]);
});

it("resolves the album identity through album_artist", () => {
  upsertMusic(
    db,
    row("/m/1.mp3", { artist: "Feat A", albumArtist: "VA", album: "Comp" }),
    NOW,
  );
  upsertMusic(
    db,
    row("/m/2.mp3", { artist: "Feat B", albumArtist: "VA", album: "Comp" }),
    NOW,
  );

  expect(getMusicsByAlbum(db, "VA\u0000Comp")).toHaveLength(2);
});

it("orders album tracks by disc then track", () => {
  upsertMusic(db, row("/m/1.mp3", { disc: 2, track: 1 }), NOW);
  upsertMusic(db, row("/m/2.mp3", { disc: 1, track: 2 }), NOW);
  upsertMusic(db, row("/m/3.mp3", { disc: 1, track: 1 }), NOW);

  expect(
    getMusicsByAlbum(db, "Artist\u0000Album").map((m) => m.filePath),
  ).toEqual(["/m/3.mp3", "/m/2.mp3", "/m/1.mp3"]);
});

it("returns an empty list for a malformed album key", () => {
  upsertMusic(db, row("/m/1.mp3"), NOW);
  expect(getMusicsByAlbum(db, "no-separator")).toEqual([]);
});
