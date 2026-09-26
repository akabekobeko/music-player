import { expect, it } from "vitest";
import { relatedArtistsOf } from "./relatedArtistsOf";

const relations = [
  {
    type: "producer",
    "target-type": "artist",
    "target-credit": "",
    artist: { name: "A" },
  },
  {
    type: "producer",
    "target-type": "artist",
    "target-credit": "B (credited)",
    artist: { name: "B" },
  },
  {
    type: "producer",
    "target-type": "artist",
    "target-credit": "",
    artist: { name: "A" },
  },
  { type: "conductor", "target-type": "artist", artist: { name: "C" } },
  { type: "producer", "target-type": "label", "target-credit": "" },
];

it("collects the artists of one relationship type, credited name first, without duplicates", () => {
  expect(relatedArtistsOf(relations, "producer")).toBe("A, B (credited)");
  expect(relatedArtistsOf(relations, "conductor")).toBe("C");
});

it("returns null when nothing matches or the list is absent", () => {
  expect(relatedArtistsOf(relations, "composer")).toBeNull();
  expect(relatedArtistsOf(undefined, "producer")).toBeNull();
});
