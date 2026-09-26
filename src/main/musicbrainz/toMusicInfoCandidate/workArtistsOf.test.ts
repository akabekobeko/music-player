import { expect, it } from "vitest";
import type { ReleaseTrack } from "../schemas/releaseSchema";
import { workArtistsOf } from "./workArtistsOf";

const work = (
  names: readonly string[],
  type = "composer",
): NonNullable<ReleaseTrack["recording"]["relations"]>[number] => ({
  type: "performance",
  "target-type": "work",
  work: {
    id: "w",
    title: "w",
    relations: names.map((name) => ({
      type,
      "target-type": "artist",
      "target-credit": name,
    })),
  },
});

const track = (
  relations: ReleaseTrack["recording"]["relations"],
): ReleaseTrack => ({
  id: "t",
  position: 1,
  title: "t",
  recording: { id: "r", title: "r", relations },
});

it("merges names across works without duplicates, keeping names with commas whole", () => {
  expect(
    workArtistsOf(
      track([
        work(["Rodgers, Richard", "A"]),
        work(["A", "Richard"]),
        work(["X"], "lyricist"),
      ]),
      "composer",
    ),
  ).toEqual(["Rodgers, Richard", "A", "Richard"]);
});

it("ignores artist relations of the recording itself and works without relations", () => {
  expect(
    workArtistsOf(
      track([
        {
          type: "composer",
          "target-type": "artist",
          artist: { name: "Direct" },
        },
        {
          type: "performance",
          "target-type": "work",
          work: { id: "w", title: "w" },
        },
      ]),
      "composer",
    ),
  ).toEqual([]);
  expect(workArtistsOf(track(undefined), "composer")).toEqual([]);
});
