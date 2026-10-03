import { expect, it } from "vitest";
import { DEFAULT_PLAYLIST_COLUMNS_STATE } from "./constants";
import { reducePlaylistColumns } from "./reducePlaylistColumns";
import type { PlaylistColumnsState } from "./types";

const STATE: PlaylistColumnsState = {
  visibleIds: ["artist", "album", "duration"],
  widths: { artist: 320 },
};

it("starts from the v1.2 columns with no resized width", () => {
  expect(DEFAULT_PLAYLIST_COLUMNS_STATE).toEqual({
    visibleIds: ["artist", "album", "duration"],
    widths: {},
  });
});

it("shows a hidden column", () => {
  const next = reducePlaylistColumns(STATE, {
    type: "visibilityChanged",
    columnId: "year",
    visible: true,
  });
  expect(next.visibleIds).toEqual(["artist", "album", "duration", "year"]);
});

it("hides a visible column and keeps its saved width", () => {
  const next = reducePlaylistColumns(STATE, {
    type: "visibilityChanged",
    columnId: "artist",
    visible: false,
  });
  expect(next.visibleIds).toEqual(["album", "duration"]);
  expect(next.widths).toEqual({ artist: 320 });
});

it("returns the same state when the visibility is already as requested", () => {
  expect(
    reducePlaylistColumns(STATE, {
      type: "visibilityChanged",
      columnId: "artist",
      visible: true,
    }),
  ).toBe(STATE);
  expect(
    reducePlaylistColumns(STATE, {
      type: "visibilityChanged",
      columnId: "year",
      visible: false,
    }),
  ).toBe(STATE);
});

it("ignores a visibility change of a pinned column", () => {
  for (const columnId of ["ordinal", "title", "menu"] as const) {
    for (const visible of [true, false]) {
      expect(
        reducePlaylistColumns(STATE, {
          type: "visibilityChanged",
          columnId,
          visible,
        }),
      ).toBe(STATE);
    }
  }
});

it("saves a resized width", () => {
  const next = reducePlaylistColumns(STATE, {
    type: "widthChanged",
    columnId: "title",
    width: 400,
  });
  expect(next.widths).toEqual({ artist: 320, title: 400 });
  expect(next.visibleIds).toBe(STATE.visibleIds);
});

it("returns the same state when the width is already saved", () => {
  expect(
    reducePlaylistColumns(STATE, {
      type: "widthChanged",
      columnId: "artist",
      width: 320,
    }),
  ).toBe(STATE);
});

it("ignores a width of a column that cannot be resized", () => {
  for (const columnId of ["ordinal", "menu"] as const) {
    expect(
      reducePlaylistColumns(STATE, {
        type: "widthChanged",
        columnId,
        width: 100,
      }),
    ).toBe(STATE);
  }
});

it("drops a saved width to return the column to its default", () => {
  const next = reducePlaylistColumns(STATE, {
    type: "widthReset",
    columnId: "artist",
  });
  expect(next.widths).toEqual({});
});

it("returns the same state when no width is saved for the column", () => {
  expect(
    reducePlaylistColumns(STATE, { type: "widthReset", columnId: "album" }),
  ).toBe(STATE);
});

it("resets the visible columns and the widths to the defaults", () => {
  const changed: PlaylistColumnsState = {
    visibleIds: ["year"],
    widths: { title: 400, year: 90 },
  };
  expect(reducePlaylistColumns(changed, { type: "reset" })).toBe(
    DEFAULT_PLAYLIST_COLUMNS_STATE,
  );
});
