import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { formValuesOf } from "./formValuesOf";
import { mergeMusics } from "./mergeMusics";

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

it("equals the single track's form values when there is one track", () => {
  const only = music();
  expect(mergeMusics([only])).toEqual(formValuesOf(only));
});

it("keeps every value that matches on all tracks", () => {
  expect(mergeMusics([music({ id: 1 }), music({ id: 2 })])).toEqual(
    formValuesOf(music()),
  );
});

it("marks the fields that differ on any track as mixed", () => {
  const merged = mergeMusics([
    music({ id: 1 }),
    music({ id: 2, title: "Other", track: 8 }),
    music({ id: 3, genre: "Jazz" }),
  ]);
  expect(merged.title).toBeNull();
  expect(merged.track).toBeNull();
  expect(merged.genre).toBeNull();
  expect(merged.artist).toBe("Artist");
  expect(merged.year).toBe("2001");
});

it("treats an unset number and a set one as different", () => {
  const merged = mergeMusics([
    music({ id: 1, year: null, bpm: null, rating: null }),
    music({ id: 2, year: 2001, bpm: 128, rating: 0.8 }),
  ]);
  expect(merged.year).toBeNull();
  expect(merged.bpm).toBeNull();
  expect(merged.rating).toBeNull();
});

it("treats an empty text and a set one as different", () => {
  expect(
    mergeMusics([music({ id: 1, album: "" }), music({ id: 2 })]).album,
  ).toBeNull();
  expect(
    mergeMusics([music({ id: 1, album: "" }), music({ id: 2, album: "" })])
      .album,
  ).toBe("");
});

it("rejects an empty list", () => {
  expect(() => mergeMusics([])).toThrow();
});
