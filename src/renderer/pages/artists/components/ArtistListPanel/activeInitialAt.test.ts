import type { Artist } from "@mp/ipc";
import { expect, it } from "vitest";
import { activeInitialAt } from "./activeInitialAt";
import { flattenSections } from "./flattenSections";
import { groupArtistsByInitial } from "./groupArtistsByInitial";
import { itemStartsOf } from "./itemStartsOf";

const artist = (name: string): Artist => ({
  name,
  musicCount: 1,
  picturePath: null,
  initial: null,
});

// [A@0] AAA@24 ABC@72 [B@120] BBB@144 [#@192] 2Pac@216
const items = flattenSections(
  groupArtistsByInitial(["AAA", "ABC", "BBB", "2Pac"].map(artist)),
);
const starts = itemStartsOf(items);

it("lays rows out with slim headings and fixed artist rows", () => {
  expect(items.map((item) => item.kind)).toEqual([
    "heading",
    "artist",
    "artist",
    "heading",
    "artist",
    "heading",
    "artist",
  ]);
  expect(starts).toEqual([0, 24, 72, 120, 144, 192, 216]);
});

it("pins the first heading at the top and while its rows scroll by", () => {
  expect(activeInitialAt(items, starts, 0)).toBe("A");
  expect(activeInitialAt(items, starts, 100)).toBe("A");
  expect(activeInitialAt(items, starts, 119)).toBe("A");
});

it("switches to the next heading once it reaches the top, and back again", () => {
  expect(activeInitialAt(items, starts, 120)).toBe("B");
  expect(activeInitialAt(items, starts, 150)).toBe("B");
  expect(activeInitialAt(items, starts, 192)).toBe("#");
  expect(activeInitialAt(items, starts, 130)).toBe("B");
  expect(activeInitialAt(items, starts, 80)).toBe("A");
});

it("returns null for an empty list", () => {
  expect(activeInitialAt([], [], 0)).toBeNull();
});
