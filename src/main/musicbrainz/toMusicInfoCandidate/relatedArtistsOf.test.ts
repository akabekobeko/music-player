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
  expect(relatedArtistsOf(relations, "producer")).toEqual([
    "A",
    "B (credited)",
  ]);
  expect(relatedArtistsOf(relations, "conductor")).toEqual(["C"]);
});

it("returns an empty list when nothing matches or the list is absent", () => {
  expect(relatedArtistsOf(relations, "composer")).toEqual([]);
  expect(relatedArtistsOf(undefined, "producer")).toEqual([]);
});

it("keeps a credited name containing the separator intact", () => {
  expect(
    relatedArtistsOf(
      [
        {
          type: "composer",
          "target-type": "artist",
          "target-credit": "Rodgers, Richard",
          artist: { name: "Richard Rodgers" },
        },
        {
          type: "composer",
          "target-type": "artist",
          "target-credit": "",
          artist: { name: "Richard" },
        },
      ],
      "composer",
    ),
  ).toEqual(["Rodgers, Richard", "Richard"]);
});
