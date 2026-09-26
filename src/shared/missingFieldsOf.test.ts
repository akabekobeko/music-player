import { expect, it } from "vitest";
import { type MissingFieldsInput, missingFieldsOf } from "./missingFieldsOf";

const full: MissingFieldsInput = {
  artist: "A",
  albumArtist: "AA",
  album: "Album",
  genre: "Rock",
  composer: "C",
  lyricist: "L",
  producer: "P",
  conductor: "Co",
  publisher: "Pu",
  year: 2007,
  track: 3,
};

it("reports nothing for a fully tagged track", () => {
  expect(missingFieldsOf(full).size).toBe(0);
});

it("reports empty text tags", () => {
  expect([
    ...missingFieldsOf({ ...full, artist: "", genre: "", publisher: "" }),
  ]).toEqual(["artist", "genre", "publisher"]);
});

it("reports a null year", () => {
  expect([...missingFieldsOf({ ...full, year: null })]).toEqual(["year"]);
});

it("reports track and disc together when the track number is unset", () => {
  expect([...missingFieldsOf({ ...full, track: 0 })]).toEqual([
    "track",
    "disc",
  ]);
});
