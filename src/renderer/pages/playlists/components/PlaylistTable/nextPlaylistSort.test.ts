import { expect, it } from "vitest";
import { nextPlaylistSort } from "./nextPlaylistSort";
import { DEFAULT_PLAYLIST_SORT } from "./types";

it("sorts another column ascending", () => {
  expect(nextPlaylistSort(DEFAULT_PLAYLIST_SORT, "title")).toEqual({
    columnId: "title",
    order: "asc",
  });
  expect(
    nextPlaylistSort({ columnId: "title", order: "desc" }, "artist"),
  ).toEqual({ columnId: "artist", order: "asc" });
});

it("flips the direction of the sorted column", () => {
  expect(
    nextPlaylistSort({ columnId: "title", order: "asc" }, "title"),
  ).toEqual({ columnId: "title", order: "desc" });
  expect(
    nextPlaylistSort({ columnId: "title", order: "desc" }, "title"),
  ).toEqual({ columnId: "title", order: "asc" });
});

it("returns to the playlist order on the ordinal column", () => {
  expect(
    nextPlaylistSort({ columnId: "album", order: "desc" }, "ordinal"),
  ).toEqual(DEFAULT_PLAYLIST_SORT);
});
