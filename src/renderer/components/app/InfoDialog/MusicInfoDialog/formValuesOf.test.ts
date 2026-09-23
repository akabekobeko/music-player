import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { formValuesOf } from "./formValuesOf";

const music = (overrides: Partial<Music> = {}): Music => ({
  id: 1,
  filePath: "/m/1.mp3",
  audioFormat: "mp3",
  title: "T",
  artist: "Artist",
  albumArtist: "AA",
  album: "Album",
  disc: 2,
  track: 7,
  year: 2001,
  genre: "Rock",
  composer: "C",
  lyricist: "L",
  producer: "P",
  conductor: "Co",
  publisher: "Pub",
  durationMs: 1000,
  bpm: 128,
  rating: 0.8,
  pictureId: null,
  picturePath: null,
  addedAt: "",
  updatedAt: "",
  ...overrides,
});

it("shows every tag as text, the rating on the 5-star scale", () => {
  expect(formValuesOf(music())).toEqual({
    title: "T",
    artist: "Artist",
    albumArtist: "AA",
    album: "Album",
    genre: "Rock",
    composer: "C",
    lyricist: "L",
    producer: "P",
    conductor: "Co",
    publisher: "Pub",
    year: "2001",
    track: "7",
    disc: "2",
    bpm: "128",
    rating: "4",
  });
});

it("shows unset numbers as empty text", () => {
  const values = formValuesOf(music({ year: null, bpm: null, rating: null }));
  expect(values.year).toBe("");
  expect(values.bpm).toBe("");
  expect(values.rating).toBe("");
});

it("keeps half stars", () => {
  expect(formValuesOf(music({ rating: 0.5 })).rating).toBe("2.5");
});
