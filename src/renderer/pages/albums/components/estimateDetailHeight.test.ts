import type { AlbumSummary } from "@mp/ipc";
import { expect, it } from "vitest";
import { estimateDetailHeight } from "./estimateDetailHeight";

const album = (key: string): AlbumSummary => ({
  albumKey: key,
  album: key,
  artist: "Artist",
  year: null,
  genre: "",
  musicCount: 10,
  totalDurationMs: 0,
  picturePath: null,
});

it("estimates the detail height from the track count", () => {
  expect(estimateDetailHeight(album("a"))).toBeGreaterThan(10 * 36);
});
