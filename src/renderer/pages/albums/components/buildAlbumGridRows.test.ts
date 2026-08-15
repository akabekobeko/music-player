import type { AlbumSummary } from "@mp/ipc";
import { expect, it } from "vitest";
import { buildAlbumGridRows } from "./buildAlbumGridRows";

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
  const rows = buildAlbumGridRows(albums, 2);
  expect(rows).toEqual([
    [albums[0], albums[1]],
    [albums[2], albums[3]],
    [albums[4]],
  ]);
});

it("handles a single-column layout", () => {
  const rows = buildAlbumGridRows(albums.slice(0, 2), 1);
  expect(rows).toEqual([[albums[0]], [albums[1]]]);
});

it("returns no rows for an empty album list", () => {
  expect(buildAlbumGridRows([], 3)).toEqual([]);
});
