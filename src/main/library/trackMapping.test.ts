import type { Track } from "@akabeko/music-metadata-editor";
import { expect, it } from "vitest";
import { mapTrackToMusicRow } from "./trackMapping";

const track = (overrides: Partial<Track> = {}): Track => ({
  audioFormat: "mp3",
  durationMs: 1234,
  tag: {},
  pictures: [],
  chapters: [],
  additionalFields: {},
  warnings: [],
  ...overrides,
});

it("maps a fully tagged track", () => {
  const row = mapTrackToMusicRow(
    track({
      tag: {
        title: "Song",
        artist: "Artist",
        albumArtist: "Album Artist",
        album: "Album",
        discNumber: 2,
        trackNumber: 7,
        year: 2001,
        genre: "Rock",
        composer: "Composer",
        bpm: 120,
        rating: 0.8,
      },
    }),
    "/music/song.mp3",
  );
  expect(row).toEqual({
    filePath: "/music/song.mp3",
    audioFormat: "mp3",
    title: "Song",
    artist: "Artist",
    albumArtist: "Album Artist",
    album: "Album",
    disc: 2,
    track: 7,
    year: 2001,
    genre: "Rock",
    composer: "Composer",
    durationMs: 1234,
    bpm: 120,
    rating: 0.8,
  });
});

it("falls back to the file name (without extension) for an empty title", () => {
  expect(mapTrackToMusicRow(track(), "/music/No Title.flac").title).toBe(
    "No Title",
  );
  expect(
    mapTrackToMusicRow(track({ tag: { title: "  " } }), "/m/a.mp3").title,
  ).toBe("a");
});

it("defaults unset text tags to empty strings", () => {
  const row = mapTrackToMusicRow(track(), "/m/a.mp3");
  expect(row.artist).toBe("");
  expect(row.albumArtist).toBe("");
  expect(row.album).toBe("");
  expect(row.genre).toBe("");
  expect(row.composer).toBe("");
});

it("defaults disc to 1 and track to 0", () => {
  const row = mapTrackToMusicRow(track(), "/m/a.mp3");
  expect(row.disc).toBe(1);
  expect(row.track).toBe(0);
});

it("keeps unset year / bpm / rating as NULL (never 0)", () => {
  const row = mapTrackToMusicRow(track(), "/m/a.mp3");
  expect(row.year).toBeNull();
  expect(row.bpm).toBeNull();
  expect(row.rating).toBeNull();
});

it("defaults an unknown duration to 0", () => {
  expect(
    mapTrackToMusicRow(track({ durationMs: undefined }), "/m/a.mp3").durationMs,
  ).toBe(0);
});
