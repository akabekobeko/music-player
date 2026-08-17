import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { getOrCreatePictureId } from "./getOrCreatePictureId";
import { upsertMusic } from "./musicRepository";
import { removeAlbumFromLibrary } from "./removeAlbumFromLibrary";
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
  album: string,
  albumArtist = "",
): MusicRowInput => ({
  filePath,
  audioFormat: "mp3",
  title: "T",
  artist,
  albumArtist,
  album,
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

const NOW = "2026-08-17T00:00:00.000Z";

const insert = (
  filePath: string,
  artist: string,
  album: string,
  albumArtist = "",
  artwork?: string,
): void => {
  const pictureId =
    artwork !== undefined ? getOrCreatePictureId(db, artwork) : null;
  upsertMusic(db, row(filePath, artist, album, albumArtist), NOW, pictureId);
};

const count = (): number =>
  (db.prepare("SELECT COUNT(*) AS n FROM musics").get() as { n: number }).n;

const keyOf = (artist: string, album: string): string =>
  `${artist}\u0000${album}`;

it("removes every track of the album identity and keeps the rest", () => {
  insert("/m/a1.mp3", "Artist", "Album");
  insert("/m/a2.mp3", "Artist", "Album");
  insert("/m/b.mp3", "Artist", "Other Album");

  const result = removeAlbumFromLibrary(db, keyOf("Artist", "Album"));
  expect(result.removed).toBe(2);
  expect(count()).toBe(1);
});

it("matches by display artist — album_artist falls back to artist", () => {
  // Two tracks of one compilation: different track artists, same album artist.
  insert("/m/c1.mp3", "Feat A", "Compilation", "Various");
  insert("/m/c2.mp3", "Feat B", "Compilation", "Various");
  // A same-named album by another display artist must survive.
  insert("/m/x.mp3", "Various Other", "Compilation");

  const result = removeAlbumFromLibrary(db, keyOf("Various", "Compilation"));
  expect(result.removed).toBe(2);
  expect(count()).toBe(1);
});

it("is a no-op for a malformed key without the NUL separator", () => {
  insert("/m/a.mp3", "Artist", "Album");
  expect(removeAlbumFromLibrary(db, "Artist-Album")).toEqual({
    removed: 0,
    orphanedFiles: [],
  });
  expect(count()).toBe(1);
});

it("GCs artwork orphaned by the album removal", () => {
  insert("/m/a.mp3", "Artist", "Album", "", "/images/album.jpg");
  insert("/m/b.mp3", "Artist", "Other Album");

  const result = removeAlbumFromLibrary(db, keyOf("Artist", "Album"));
  expect(result.orphanedFiles).toEqual(["/images/album.jpg"]);
});
