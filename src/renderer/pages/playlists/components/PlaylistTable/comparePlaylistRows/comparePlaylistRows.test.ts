import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import type { PlaylistColumnId } from "@/features/playlistColumns/types";
import type { PlaylistRow } from "../types";
import { comparePlaylistRows } from "./comparePlaylistRows";

const music = (patch: Partial<Music>): Music => ({
  id: 1,
  filePath: "/m/1.flac",
  audioFormat: "flac",
  title: "Title",
  artist: "Artist",
  albumArtist: "Album Artist",
  album: "Album",
  disc: 1,
  track: 1,
  year: 2000,
  genre: "Rock",
  composer: "Composer",
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
  durationMs: 1000,
  bpm: 100,
  rating: 0.5,
  pictureId: null,
  picturePath: null,
  addedAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "",
  ...patch,
});

/** Rows in playlist order, one per patch. */
const rowsOf = (patches: readonly Partial<Music>[]): PlaylistRow[] =>
  patches.map((patch, index) => ({ music: music(patch), index }));

/** Positions of the rows after sorting. */
const sorted = (
  rows: readonly PlaylistRow[],
  columnId: PlaylistColumnId,
  order: "asc" | "desc",
): number[] =>
  rows
    .toSorted(comparePlaylistRows({ columnId, order }))
    .map((row) => row.index);

it("sorts by the playlist position", () => {
  const rows = rowsOf([{}, {}, {}]);
  expect(sorted(rows.toReversed(), "ordinal", "asc")).toEqual([0, 1, 2]);
  expect(sorted(rows, "ordinal", "desc")).toEqual([2, 1, 0]);
});

it("sorts names without the leading article and case-insensitively", () => {
  for (const columnId of ["title", "artist", "album", "albumArtist"] as const) {
    const rows = rowsOf([
      { [columnId]: "The Cure" },
      { [columnId]: "abba" },
      { [columnId]: "Beck" },
    ]);
    expect(sorted(rows, columnId, "asc")).toEqual([1, 2, 0]);
    expect(sorted(rows, columnId, "desc")).toEqual([0, 2, 1]);
  }
});

it("sorts genre, composer, and format case-insensitively", () => {
  for (const columnId of ["genre", "composer"] as const) {
    const rows = rowsOf([
      { [columnId]: "rock" },
      { [columnId]: "Jazz" },
      { [columnId]: "The Blues" },
    ]);
    expect(sorted(rows, columnId, "asc")).toEqual([1, 0, 2]);
    expect(sorted(rows, columnId, "desc")).toEqual([2, 0, 1]);
  }

  const rows = rowsOf([
    { audioFormat: "mp3" },
    { audioFormat: "flac" },
    { audioFormat: "wav" },
  ]);
  expect(sorted(rows, "audioFormat", "asc")).toEqual([1, 0, 2]);
  expect(sorted(rows, "audioFormat", "desc")).toEqual([2, 0, 1]);
});

it("sorts the numeric columns as numbers", () => {
  for (const columnId of ["year", "track", "disc", "bpm"] as const) {
    const rows = rowsOf([
      { [columnId]: 10 },
      { [columnId]: 9 },
      { [columnId]: 100 },
    ]);
    expect(sorted(rows, columnId, "asc")).toEqual([1, 0, 2]);
    expect(sorted(rows, columnId, "desc")).toEqual([2, 0, 1]);
  }

  const ratings = rowsOf([{ rating: 0.6 }, { rating: 0.2 }, { rating: 1 }]);
  expect(sorted(ratings, "rating", "asc")).toEqual([1, 0, 2]);
  expect(sorted(ratings, "rating", "desc")).toEqual([2, 0, 1]);

  const durations = rowsOf([
    { durationMs: 200_000 },
    { durationMs: 90_000 },
    { durationMs: 1_000_000 },
  ]);
  expect(sorted(durations, "duration", "asc")).toEqual([1, 0, 2]);
  expect(sorted(durations, "duration", "desc")).toEqual([2, 0, 1]);
});

it("sorts the added date by the full timestamp", () => {
  const rows = rowsOf([
    { addedAt: "2026-03-01T10:00:01.000Z" },
    { addedAt: "2026-03-01T10:00:00.000Z" },
    { addedAt: "2026-04-01T00:00:00.000Z" },
  ]);
  expect(sorted(rows, "addedAt", "asc")).toEqual([1, 0, 2]);
  expect(sorted(rows, "addedAt", "desc")).toEqual([2, 0, 1]);
});

it("puts rows without a value last in either direction", () => {
  const texts = rowsOf([{ artist: "" }, { artist: "B" }, { artist: "A" }]);
  expect(sorted(texts, "artist", "asc")).toEqual([2, 1, 0]);
  expect(sorted(texts, "artist", "desc")).toEqual([1, 2, 0]);

  const years = rowsOf([{ year: null }, { year: 2001 }, { year: 1999 }]);
  expect(sorted(years, "year", "asc")).toEqual([2, 1, 0]);
  expect(sorted(years, "year", "desc")).toEqual([1, 2, 0]);

  const tracks = rowsOf([{ track: 0 }, { track: 2 }, { track: 1 }]);
  expect(sorted(tracks, "track", "asc")).toEqual([2, 1, 0]);
  expect(sorted(tracks, "track", "desc")).toEqual([1, 2, 0]);
});

it("keeps rows without a value in the playlist order", () => {
  const rows = rowsOf([{ bpm: null }, { bpm: 90 }, { bpm: null }]);
  expect(sorted(rows, "bpm", "asc")).toEqual([1, 0, 2]);
  expect(sorted(rows, "bpm", "desc")).toEqual([1, 0, 2]);
});

it("treats a zero rating and a zero duration as values", () => {
  const ratings = rowsOf([{ rating: 0.4 }, { rating: 0 }, { rating: null }]);
  expect(sorted(ratings, "rating", "asc")).toEqual([1, 0, 2]);
  expect(sorted(ratings, "rating", "desc")).toEqual([0, 1, 2]);

  const durations = rowsOf([{ durationMs: 5000 }, { durationMs: 0 }]);
  expect(sorted(durations, "duration", "asc")).toEqual([1, 0]);
  expect(sorted(durations, "duration", "desc")).toEqual([0, 1]);
});

it("keeps equal rows in the playlist order in either direction", () => {
  const rows = rowsOf([
    { album: "B" },
    { album: "A" },
    { album: "B" },
    { album: "A" },
  ]);
  expect(sorted(rows, "album", "asc")).toEqual([1, 3, 0, 2]);
  expect(sorted(rows, "album", "desc")).toEqual([0, 2, 1, 3]);
});
