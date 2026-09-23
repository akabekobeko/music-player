import { expect, it } from "vitest";
import { diffFormValues } from "./diffFormValues";
import type { MusicInfoFormValues } from "./musicInfoSchema";

const values = (
  overrides: Partial<MusicInfoFormValues> = {},
): MusicInfoFormValues => ({
  title: "T",
  artist: "Artist",
  albumArtist: "",
  album: "Album",
  genre: "Rock",
  composer: "",
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
  year: "2001",
  track: "1",
  disc: "1",
  bpm: "",
  rating: "",
  ...overrides,
});

it("returns nothing when nothing changed", () => {
  expect(diffFormValues(values(), values())).toEqual({});
});

it("returns only the changed fields with their current text", () => {
  expect(diffFormValues(values(), values({ genre: "Jazz", year: "" }))).toEqual(
    { genre: "Jazz", year: "" },
  );
});

it("treats a value edited back to its initial text as unchanged", () => {
  expect(diffFormValues(values(), values({ genre: "Rock" }))).toEqual({});
});

it("reports an emptied text field as a change (clear)", () => {
  expect(diffFormValues(values(), values({ album: "" }))).toEqual({
    album: "",
  });
});

it("leaves a mixed field alone until it is edited", () => {
  const initial = values({ genre: null, year: null });
  expect(diffFormValues(initial, initial)).toEqual({});
  expect(diffFormValues(initial, { ...initial, genre: "Rock" })).toEqual({
    genre: "Rock",
  });
  expect(diffFormValues(initial, { ...initial, year: "" })).toEqual({
    year: "",
  });
});
