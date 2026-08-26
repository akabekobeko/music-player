import type { Artist } from "@mp/ipc";
import { expect, it } from "vitest";
import { groupArtistsByInitial } from "./groupArtistsByInitial";

const artist = (name: string): Artist => ({
  name,
  musicCount: 1,
  picturePath: null,
  initial: null,
});

it("groups sorted artists into contiguous initial sections", () => {
  const sections = groupArtistsByInitial(["AAA", "ABC", "BBB"].map(artist));
  expect(sections.map((s) => s.initial)).toEqual(["A", "B"]);
  expect(sections[0]?.artists.map((a) => a.name)).toEqual(["AAA", "ABC"]);
  expect(sections[1]?.artists.map((a) => a.name)).toEqual(["BBB"]);
});

it("keeps the given order inside a section and classifies article-blind", () => {
  const sections = groupArtistsByInitial(
    ["Weezer", "The Who", "Wilco"].map(artist),
  );
  expect(sections).toHaveLength(1);
  expect(sections[0]?.artists.map((a) => a.name)).toEqual([
    "Weezer",
    "The Who",
    "Wilco",
  ]);
});

it("places the other bucket last even when its names sort first", () => {
  const sections = groupArtistsByInitial(
    ["2Pac", "Adele", "", "Zed"].map(artist),
  );
  expect(sections.map((s) => s.initial)).toEqual(["A", "Z", "#"]);
  expect(sections[2]?.artists.map((a) => a.name)).toEqual(["2Pac", ""]);
});

it("files an artist under its stored initial instead of the name", () => {
  const sections = groupArtistsByInitial([
    artist("Adele"),
    { ...artist("宇多田ヒカル"), initial: "U" },
    artist("2Pac"),
  ]);
  expect(sections.map((s) => s.initial)).toEqual(["A", "U", "#"]);
  expect(sections[1]?.artists.map((a) => a.name)).toEqual(["宇多田ヒカル"]);
  expect(sections[2]?.artists.map((a) => a.name)).toEqual(["2Pac"]);
});

it("returns no sections for an empty list", () => {
  expect(groupArtistsByInitial([])).toEqual([]);
});
