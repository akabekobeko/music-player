import { expect, it } from "vitest";
import { formValuesOf } from "./formValuesOf";
import { toMusicTagPatch } from "./toMusicTagPatch";

it("contains exactly the changed fields", () => {
  expect(toMusicTagPatch({ title: "New", genre: "Jazz" })).toEqual({
    title: "New",
    genre: "Jazz",
  });
  expect(toMusicTagPatch({})).toEqual({});
});

it("trims text and keeps an empty text as the clear marker", () => {
  expect(toMusicTagPatch({ artist: "  A  ", album: "" })).toEqual({
    artist: "A",
    album: "",
  });
});

it("parses year and bpm, clearing them with null when empty", () => {
  expect(toMusicTagPatch({ year: "2001", bpm: "128" })).toEqual({
    year: 2001,
    bpm: 128,
  });
  expect(toMusicTagPatch({ year: "", bpm: "" })).toEqual({
    year: null,
    bpm: null,
  });
});

it("falls back to the DB defaults for an empty track or disc", () => {
  expect(toMusicTagPatch({ track: "", disc: "" })).toEqual({
    track: 0,
    disc: 1,
  });
  expect(toMusicTagPatch({ track: "7", disc: "2" })).toEqual({
    track: 7,
    disc: 2,
  });
});

it("converts the 5-star rating back to the normalised value", () => {
  expect(toMusicTagPatch({ rating: "5" })).toEqual({ rating: 1 });
  expect(toMusicTagPatch({ rating: "2.5" })).toEqual({ rating: 0.5 });
  expect(toMusicTagPatch({ rating: "0" })).toEqual({ rating: 0 });
  expect(toMusicTagPatch({ rating: "" })).toEqual({ rating: null });
});

it("round-trips a rating through the form (5 → 1.0 → 5)", () => {
  const stored = toMusicTagPatch({ rating: "5" }).rating;
  expect(stored).toBe(1);
  const shown = formValuesOf({
    id: 1,
    filePath: "",
    audioFormat: "mp3",
    title: "",
    artist: "",
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
    rating: stored ?? null,
    pictureId: null,
    picturePath: null,
    addedAt: "",
    updatedAt: "",
  }).rating;
  expect(shown).toBe("5");
});
