import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { getOrCreatePictureId } from "./getOrCreatePictureId";
import { upsertMusic } from "./musicRepository";
import { registerArtistPictureIfMissing } from "./registerArtistPictureIfMissing";
import { setArtistPicture } from "./setArtistPicture";
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

const NOW = "2026-08-14T00:00:00.000Z";

/** Insert one track (optionally with artwork) and register the artist picture. */
const insert = (
  filePath: string,
  artist = "Artist",
  artwork?: string,
): void => {
  const pictureId =
    artwork !== undefined ? getOrCreatePictureId(db, artwork) : null;
  upsertMusic(db, row(filePath, artist), NOW, pictureId);
  if (pictureId !== null) {
    registerArtistPictureIfMissing(db, artist, pictureId);
  }
};

const artistPicturePath = (artist: string): string | undefined =>
  (
    db
      .prepare(
        `SELECT p.file_path AS path FROM artist_pictures ap
         JOIN pictures p ON p.id = ap.picture_id WHERE ap.artist = ?`,
      )
      .get(artist) as { path: string } | undefined
  )?.path;

const count = (table: string): number =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

it("registers a picture for an artist without one", () => {
  insert("/m/a.mp3");
  const pictureId = getOrCreatePictureId(db, "/images/new.jpg");
  const orphaned = setArtistPicture(db, "Artist", pictureId);
  expect(orphaned).toEqual([]);
  expect(artistPicturePath("Artist")).toBe("/images/new.jpg");
});

it("replaces an existing picture and GCs the orphaned old one", () => {
  insert("/m/a.mp3", "Artist");
  const oldId = getOrCreatePictureId(db, "/images/old.jpg");
  registerArtistPictureIfMissing(db, "Artist", oldId);

  const newId = getOrCreatePictureId(db, "/images/new.jpg");
  const orphaned = setArtistPicture(db, "Artist", newId);
  expect(orphaned).toEqual(["/images/old.jpg"]);
  expect(artistPicturePath("Artist")).toBe("/images/new.jpg");
  expect(count("pictures")).toBe(1);
});

it("keeps the old picture when a track still references it", () => {
  insert("/m/a.mp3", "Artist", "/images/shared.jpg");
  const newId = getOrCreatePictureId(db, "/images/new.jpg");
  const orphaned = setArtistPicture(db, "Artist", newId);
  // /images/shared.jpg survives: it is still a track's embedded artwork.
  expect(orphaned).toEqual([]);
  expect(artistPicturePath("Artist")).toBe("/images/new.jpg");
  expect(count("pictures")).toBe(2);
});

it("keeps the old picture when another artist still uses it", () => {
  insert("/m/a.mp3", "A", "/images/shared.jpg");
  insert("/m/b.mp3", "B", "/images/shared.jpg");
  const newId = getOrCreatePictureId(db, "/images/new.jpg");
  const orphaned = setArtistPicture(db, "A", newId);
  expect(orphaned).toEqual([]);
  expect(artistPicturePath("B")).toBe("/images/shared.jpg");
});

it("re-setting the same picture is a no-op without GC", () => {
  insert("/m/a.mp3", "Artist");
  const pictureId = getOrCreatePictureId(db, "/images/same.jpg");
  registerArtistPictureIfMissing(db, "Artist", pictureId);
  const orphaned = setArtistPicture(db, "Artist", pictureId);
  expect(orphaned).toEqual([]);
  expect(artistPicturePath("Artist")).toBe("/images/same.jpg");
});

it("drops the association and GCs the picture when the artist has no tracks", () => {
  const pictureId = getOrCreatePictureId(db, "/images/ghost.jpg");
  const orphaned = setArtistPicture(db, "Ghost", pictureId);
  expect(orphaned).toEqual(["/images/ghost.jpg"]);
  expect(count("artist_pictures")).toBe(0);
  expect(count("pictures")).toBe(0);
});

it("rejects an empty artist name", () => {
  const pictureId = getOrCreatePictureId(db, "/images/new.jpg");
  expect(() => setArtistPicture(db, "", pictureId)).toThrow(
    "empty artist name",
  );
});
