import type { AlbumSummary } from "@mp/ipc";
import { expect, it } from "vitest";
import { sortAlbums } from "./sortAlbums";

const album = (
  artist: string,
  name: string,
  year: number | null,
): AlbumSummary => ({
  albumKey: `${artist}:${name}`,
  album: name,
  artist,
  year,
  genre: "",
  producer: "",
  conductor: "",
  publisher: "",
  musicCount: 1,
  totalDurationMs: 0,
  picturePath: null,
});

it("sorts by artist ignoring leading articles", () => {
  const sorted = sortAlbums([
    album("The Zebras", "Z", 2000),
    album("Apples", "A", 2000),
    album("A Monkey", "M", 2000),
  ]);
  expect(sorted.map((entry) => entry.artist)).toEqual([
    "Apples",
    "A Monkey",
    "The Zebras",
  ]);
});

it("sorts one artist's albums by year ascending, unknown last", () => {
  const sorted = sortAlbums([
    album("X", "New", 2020),
    album("X", "Unknown", null),
    album("X", "Old", 1990),
  ]);
  expect(sorted.map((entry) => entry.album)).toEqual(["Old", "New", "Unknown"]);
});

it("breaks year ties by album name", () => {
  const sorted = sortAlbums([
    album("X", "Beta", 2000),
    album("X", "Alpha", 2000),
  ]);
  expect(sorted.map((entry) => entry.album)).toEqual(["Alpha", "Beta"]);
});

it("does not mutate the input", () => {
  const input = [album("B", "B", 2000), album("A", "A", 1990)];
  sortAlbums(input);
  expect(input[0]?.artist).toBe("B");
});
