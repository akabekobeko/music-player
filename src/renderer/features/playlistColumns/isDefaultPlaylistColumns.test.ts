import { expect, it } from "vitest";
import { DEFAULT_PLAYLIST_COLUMNS_STATE } from "./constants";
import { isDefaultPlaylistColumns } from "./isDefaultPlaylistColumns";

it("is true for the default layout", () => {
  expect(isDefaultPlaylistColumns(DEFAULT_PLAYLIST_COLUMNS_STATE)).toBe(true);
});

it("is false when the columns were reordered", () => {
  expect(
    isDefaultPlaylistColumns({
      visibleIds: ["duration", "artist", "album"],
      widths: {},
    }),
  ).toBe(false);
});

it("is false when a column was shown or hidden", () => {
  expect(
    isDefaultPlaylistColumns({
      visibleIds: ["artist", "album", "duration", "year"],
      widths: {},
    }),
  ).toBe(false);
  expect(
    isDefaultPlaylistColumns({ visibleIds: ["artist", "album"], widths: {} }),
  ).toBe(false);
  expect(
    isDefaultPlaylistColumns({
      visibleIds: ["artist", "album", "year"],
      widths: {},
    }),
  ).toBe(false);
});

it("is false when a width was resized", () => {
  expect(
    isDefaultPlaylistColumns({
      ...DEFAULT_PLAYLIST_COLUMNS_STATE,
      widths: { title: 400 },
    }),
  ).toBe(false);
});
