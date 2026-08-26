import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { upsertMusic } from "./musicRepository";
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

const NOW = "2026-08-26T00:00:00.000Z";

const initialOf = (artist: string): string | undefined =>
  (
    db
      .prepare("SELECT initial FROM artist_initials WHERE artist = ?")
      .get(artist) as { initial: string } | undefined
  )?.initial;

it("stores a letter for an artist", () => {
  upsertMusic(db, row("/m/a.mp3"), NOW);
  setArtistInitial(db, "Artist", "X");
  expect(initialOf("Artist")).toBe("X");
});

it("replaces an existing letter", () => {
  upsertMusic(db, row("/m/a.mp3"), NOW);
  setArtistInitial(db, "Artist", "X");
  setArtistInitial(db, "Artist", "Y");
  expect(initialOf("Artist")).toBe("Y");
});

it("clears the choice with null", () => {
  upsertMusic(db, row("/m/a.mp3"), NOW);
  setArtistInitial(db, "Artist", "X");
  setArtistInitial(db, "Artist", null);
  expect(initialOf("Artist")).toBeUndefined();
});

it("clearing an artist without a choice is a no-op", () => {
  upsertMusic(db, row("/m/a.mp3"), NOW);
  expect(() => setArtistInitial(db, "Artist", null)).not.toThrow();
  expect(initialOf("Artist")).toBeUndefined();
});

it("drops the row when the artist has no tracks", () => {
  setArtistInitial(db, "Ghost", "G");
  expect(initialOf("Ghost")).toBeUndefined();
});

it("keys on the display artist (album_artist falling back to artist)", () => {
  upsertMusic(
    db,
    { ...row("/m/a.mp3", "Track Artist"), albumArtist: "Album Artist" },
    NOW,
  );
  setArtistInitial(db, "Album Artist", "A");
  expect(initialOf("Album Artist")).toBe("A");
  // "Track Artist" is not a display artist here, so its row is GC'd.
  setArtistInitial(db, "Track Artist", "T");
  expect(initialOf("Track Artist")).toBeUndefined();
});

it("rejects an empty artist name", () => {
  expect(() => setArtistInitial(db, "", "A")).toThrow("empty artist name");
});

it("rejects anything but a single capital letter", () => {
  upsertMusic(db, row("/m/a.mp3"), NOW);
  expect(() => setArtistInitial(db, "Artist", "a")).toThrow("Invalid initial");
  expect(() => setArtistInitial(db, "Artist", "AB")).toThrow("Invalid initial");
  expect(() => setArtistInitial(db, "Artist", "#")).toThrow("Invalid initial");
  expect(initialOf("Artist")).toBeUndefined();
});
