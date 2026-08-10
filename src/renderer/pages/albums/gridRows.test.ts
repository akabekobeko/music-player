import type { AlbumSummary } from "@mp/ipc";
import { expect, it } from "vitest";
import { buildAlbumGridRows, estimateDetailHeight } from "./gridRows";

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

const albums = ["a", "b", "c", "d", "e"].map(album);

it("chunks albums into rows of the given column count", () => {
  const rows = buildAlbumGridRows(albums, 2, null);
  expect(rows).toHaveLength(3);
  expect(rows[0]).toEqual({ type: "cards", albums: [albums[0], albums[1]] });
  expect(rows[2]).toEqual({ type: "cards", albums: [albums[4]] });
});

it("inserts the detail row directly below the expanded album's card row", () => {
  const rows = buildAlbumGridRows(albums, 2, "c");
  expect(rows.map((row) => row.type)).toEqual([
    "cards",
    "cards",
    "detail",
    "cards",
  ]);
  expect(rows[2]).toEqual({ type: "detail", album: albums[2] });
});

it("produces no detail row when the expanded key matches nothing", () => {
  const rows = buildAlbumGridRows(albums, 2, "gone");
  expect(rows.every((row) => row.type === "cards")).toBe(true);
});

it("handles a single-column layout", () => {
  const rows = buildAlbumGridRows(albums.slice(0, 2), 1, "a");
  expect(rows.map((row) => row.type)).toEqual(["cards", "detail", "cards"]);
});

it("estimates the detail height from the track count", () => {
  expect(estimateDetailHeight(album("a"))).toBeGreaterThan(10 * 36);
});
