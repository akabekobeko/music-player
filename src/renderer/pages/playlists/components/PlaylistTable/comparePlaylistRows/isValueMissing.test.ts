import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { playlistCellTextOf } from "../renderPlaylistCell/playlistCellTextOf";
import { isValueMissing } from "./isValueMissing";

const music = (patch: Partial<Music> = {}): Music => ({
  id: 1,
  filePath: "/m/1.flac",
  audioFormat: "flac",
  title: "Title",
  artist: "Artist",
  albumArtist: "Album Artist",
  album: "Album",
  disc: 1,
  track: 3,
  year: 1999,
  genre: "Rock",
  composer: "Composer",
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
  durationMs: 225_000,
  bpm: 120,
  rating: 0.6,
  pictureId: null,
  picturePath: null,
  addedAt: "2026-10-03T12:34:56",
  updatedAt: "",
  ...patch,
});

/** A track with every optional value unset. */
const EMPTY = music({
  title: "",
  artist: "",
  albumArtist: "",
  album: "",
  genre: "",
  composer: "",
  track: 0,
  year: null,
  bpm: null,
  rating: null,
  durationMs: 0,
});

const TEXT_COLUMNS = [
  "title",
  "artist",
  "album",
  "albumArtist",
  "genre",
  "composer",
  "audioFormat",
  "year",
  "track",
  "disc",
  "bpm",
  "addedAt",
  "duration",
] as const;

it("treats an empty text tag as missing", () => {
  for (const columnId of [
    "title",
    "artist",
    "album",
    "albumArtist",
    "genre",
    "composer",
  ] as const) {
    expect(isValueMissing(columnId, EMPTY)).toBe(true);
    expect(isValueMissing(columnId, music())).toBe(false);
  }
});

it("treats a null year, bpm, or rating as missing, but not zero", () => {
  for (const columnId of ["year", "bpm", "rating"] as const) {
    expect(isValueMissing(columnId, EMPTY)).toBe(true);
    expect(isValueMissing(columnId, music({ [columnId]: 0 }))).toBe(false);
  }
});

it("treats an untagged track number as missing", () => {
  expect(isValueMissing("track", EMPTY)).toBe(true);
  expect(isValueMissing("track", music())).toBe(false);
});

it("never treats the always-valued columns as missing", () => {
  for (const columnId of [
    "ordinal",
    "disc",
    "duration",
    "audioFormat",
    "addedAt",
    "menu",
  ] as const) {
    expect(isValueMissing(columnId, EMPTY)).toBe(false);
  }
});

it("agrees with the blank cells of the text columns", () => {
  for (const row of [music(), EMPTY]) {
    for (const columnId of TEXT_COLUMNS) {
      expect(isValueMissing(columnId, row)).toBe(
        playlistCellTextOf(columnId, row, "en") === "",
      );
    }
  }
});
