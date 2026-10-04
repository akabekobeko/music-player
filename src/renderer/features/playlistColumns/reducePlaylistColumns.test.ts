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

it("shows a hidden column at its place by declaration order", () => {
  const next = reducePlaylistColumns(STATE, {
    type: "visibilityChanged",
    columnId: "year",
    visible: true,
  });
  expect(next.visibleIds).toEqual(["artist", "album", "year", "duration"]);
});

it("shows a hidden column after the nearest column declared before it", () => {
  const reordered = { ...STATE, visibleIds: ["duration", "album", "artist"] };
  expect(
    reducePlaylistColumns(reordered, {
      type: "visibilityChanged",
      columnId: "genre",
      visible: true,
    }).visibleIds,
  ).toEqual(["duration", "album", "genre", "artist"]);
});

it("shows a hidden column in front of the next one when none is declared before it", () => {
  const withoutArtist = { ...STATE, visibleIds: ["duration", "album"] };
  expect(
    reducePlaylistColumns(withoutArtist, {
      type: "visibilityChanged",
      columnId: "artist",
      visible: true,
    }).visibleIds,
  ).toEqual(["duration", "artist", "album"]);
  expect(
    reducePlaylistColumns(
      { ...STATE, visibleIds: [] },
      { type: "visibilityChanged", columnId: "genre", visible: true },
    ).visibleIds,
  ).toEqual(["genre"]);
});

it("moves a column next to another one", () => {
  expect(
    reducePlaylistColumns(STATE, {
      type: "moved",
      columnId: "duration",
      targetId: "artist",
      side: "before",
    }),
  ).toEqual({
    visibleIds: ["duration", "artist", "album"],
    widths: { artist: 320 },
  });
  expect(
    reducePlaylistColumns(STATE, {
      type: "moved",
      columnId: "artist",
      targetId: "album",
      side: "after",
    }).visibleIds,
  ).toEqual(["album", "artist", "duration"]);
});

it("returns the same state when a move changes nothing", () => {
  expect(
    reducePlaylistColumns(STATE, {
      type: "moved",
      columnId: "album",
      targetId: "artist",
      side: "after",
    }),
  ).toBe(STATE);
  expect(
    reducePlaylistColumns(STATE, {
      type: "moved",
      columnId: "year",
      targetId: "artist",
      side: "after",
    }),
  ).toBe(STATE);
});

it("ignores a move of a pinned column", () => {
  const listed = { ...STATE, visibleIds: ["title", "artist", "album"] };
  expect(
    reducePlaylistColumns(listed, {
      type: "moved",
      columnId: "title",
      targetId: "album",
      side: "after",
    }),
  ).toBe(listed);
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

it("drops the saved width when a column is resized back to its default", () => {
  const next = reducePlaylistColumns(STATE, {
    type: "widthChanged",
    columnId: "artist",
    width: 200,
  });
  expect(next.widths).toEqual({});
  expect(
    reducePlaylistColumns(STATE, {
      type: "widthChanged",
      columnId: "album",
      width: 200,
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
