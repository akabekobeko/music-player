import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { getOrCreatePictureId } from "./getOrCreatePictureId";
import { upsertMusic } from "./musicRepository";
import { registerArtistPictureIfMissing } from "./registerArtistPictureIfMissing";
import { removeMusicsFromLibrary } from "./removeMusicsFromLibrary";
import { setArtistInitial } from "./setArtistInitial";
import type { MusicRowInput } from "./trackMapping";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const row = (filePath: string, artist = "Artist"): MusicRowInput => ({
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
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
  durationMs: 0,
  bpm: null,
  rating: null,
});

const NOW = "2026-08-09T00:00:00.000Z";

/** Insert one track (optionally with artwork) and return its music id. */
const insert = (
  filePath: string,
  artist = "Artist",
  artwork?: string,
): number => {
  const pictureId =
    artwork !== undefined ? getOrCreatePictureId(db, artwork) : null;
  upsertMusic(db, row(filePath, artist), NOW, pictureId);
  if (pictureId !== null) {
    registerArtistPictureIfMissing(db, artist, pictureId);
  }

  return (
    db.prepare("SELECT id FROM musics WHERE file_path = ?").get(filePath) as {
      id: number;
    }
  ).id;
};

const count = (table: string): number =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

it("removes the requested rows and keeps the rest", () => {
  const a = insert("/m/a.mp3");
  insert("/m/b.mp3");
  removeMusicsFromLibrary(db, [a]);
  expect(count("musics")).toBe(1);
});

it("is a no-op for an empty id list", () => {
  insert("/m/a.mp3");
  expect(removeMusicsFromLibrary(db, [])).toEqual([]);
  expect(count("musics")).toBe(1);
});

it("cascades playlist entries", () => {
  const a = insert("/m/a.mp3");
  db.prepare(
    "INSERT INTO playlists (name, created_at, updated_at) VALUES ('p', ?, ?)",
  ).run(NOW, NOW);
  db.prepare(
    "INSERT INTO playlist_musics (playlist_id, position, music_id) VALUES (1, 0, ?)",
  ).run(a);

  removeMusicsFromLibrary(db, [a]);
  expect(count("playlist_musics")).toBe(0);
  expect(count("playlists")).toBe(1);
});

it("garbage-collects orphaned pictures and returns their paths", () => {
  const a = insert("/m/a.mp3", "Artist", "/images/only.jpg");
  const removed = removeMusicsFromLibrary(db, [a]);
  expect(removed).toEqual(["/images/only.jpg"]);
  expect(count("pictures")).toBe(0);
  expect(count("artist_pictures")).toBe(0);
});

it("keeps a picture still referenced by another track", () => {
  const a = insert("/m/a.mp3", "Artist", "/images/shared.jpg");
  insert("/m/b.mp3", "Artist", "/images/shared.jpg");
  const removed = removeMusicsFromLibrary(db, [a]);
  expect(removed).toEqual([]);
  expect(count("pictures")).toBe(1);
});

it("keeps the artist picture while the artist still has tracks", () => {
  const a = insert("/m/a.mp3", "Artist", "/images/a.jpg");
  insert("/m/b.mp3", "Artist", "/images/b.jpg");
  const removed = removeMusicsFromLibrary(db, [a]);
  // /images/a.jpg survives: it is still the artist's representative picture.
  expect(removed).toEqual([]);
  expect(count("artist_pictures")).toBe(1);
  expect(count("pictures")).toBe(2);
});

it("drops the artist picture when the artist's last track goes", () => {
  const a = insert("/m/a.mp3", "Vanishing", "/images/v.jpg");
  insert("/m/other.mp3", "Other", "/images/o.jpg");
  const removed = removeMusicsFromLibrary(db, [a]);
  expect(removed).toEqual(["/images/v.jpg"]);
  expect(db.prepare("SELECT artist FROM artist_pictures").all()).toEqual([
    { artist: "Other" },
  ]);
});

it("drops the artist initial when the artist's last track goes", () => {
  const a = insert("/m/a.mp3", "Vanishing");
  insert("/m/other.mp3", "Other");
  setArtistInitial(db, "Vanishing", "V");
  setArtistInitial(db, "Other", "O");
  removeMusicsFromLibrary(db, [a]);
  expect(db.prepare("SELECT artist FROM artist_initials").all()).toEqual([
    { artist: "Other" },
  ]);
});
