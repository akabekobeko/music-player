import type { TagData } from "@akabeko/music-metadata-editor";
import { expect, it } from "vitest";
import { applyTagPatch } from "./applyTagPatch";

const tag = (overrides: Partial<TagData> = {}): TagData => ({
  title: "Title",
  artist: "Artist",
  album: "Album",
  trackNumber: 3,
  trackTotal: 12,
  comment: "keep me",
  year: 2024,
  ...overrides,
});

it("overwrites only the patched text fields", () => {
  const next = applyTagPatch(tag(), { artist: "New", genre: "Rock" });
  expect(next.artist).toBe("New");
  expect(next.genre).toBe("Rock");
  expect(next.title).toBe("Title");
  expect(next.album).toBe("Album");
});

it("passes fields Parade does not model through untouched", () => {
  const next = applyTagPatch(tag(), { title: "Renamed" });
  expect(next.comment).toBe("keep me");
  expect(next.trackTotal).toBe(12);
});

it("turns an empty string into the null deletion marker", () => {
  const next = applyTagPatch(tag(), { album: "" });
  expect(next.album).toBeNull();
});

it("does not touch the tag when the patch is empty", () => {
  expect(applyTagPatch(tag(), {})).toEqual(tag());
});

it("maps track and disc onto trackNumber and discNumber", () => {
  const next = applyTagPatch(tag(), { track: 7, disc: 2 });
  expect(next.trackNumber).toBe(7);
  expect(next.discNumber).toBe(2);
  expect(next.trackTotal).toBe(12);
});

it("sets the year and rewrites the year part of the recording date", () => {
  const next = applyTagPatch(tag({ recordingDate: "2024-04-01" }), {
    year: 2001,
  });
  expect(next.year).toBe(2001);
  expect(next.recordingDate).toBe("2001-04-01");
});

it("sets the year alone when there is no recording date", () => {
  const next = applyTagPatch(tag(), { year: 2001 });
  expect(next.year).toBe(2001);
  expect(next.recordingDate).toBeUndefined();
});

it("clears a recording date it cannot align with the new year", () => {
  const next = applyTagPatch(tag({ recordingDate: "April 2024" }), {
    year: 2001,
  });
  expect(next.year).toBe(2001);
  expect(next.recordingDate).toBeNull();
});

it("clears the year together with the recording date", () => {
  const next = applyTagPatch(tag({ recordingDate: "2024-04-01" }), {
    year: null,
  });
  expect(next.year).toBeNull();
  expect(next.recordingDate).toBeNull();
});

it("sets and clears bpm and rating", () => {
  const set = applyTagPatch(tag(), { bpm: 128, rating: 0.8 });
  expect(set.bpm).toBe(128);
  expect(set.rating).toBe(0.8);

  const cleared = applyTagPatch(tag({ bpm: 128, rating: 0.8 }), {
    bpm: null,
    rating: null,
  });
  expect(cleared.bpm).toBeNull();
  expect(cleared.rating).toBeNull();
});

it("does not mutate the input tag", () => {
  const original = tag();
  applyTagPatch(original, { title: "Renamed", year: null });
  expect(original).toEqual(tag());
});
