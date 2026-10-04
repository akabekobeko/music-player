import { expect, it } from "vitest";
import { PLAYLIST_COLUMNS } from "@/features/playlistColumns/constants";
import { resolveVisibleColumns } from "@/features/playlistColumns/resolveVisibleColumns";
import { columnDropOf } from "./columnDropOf";

// ordinal, title, artist, album, genre, duration, menu
const COLUMNS = resolveVisibleColumns(PLAYLIST_COLUMNS, [
  "artist",
  "album",
  "genre",
  "duration",
]);

it("lands on the hovered side of an optional column", () => {
  expect(
    columnDropOf({
      columns: COLUMNS,
      sourceId: "artist",
      overId: "genre",
      side: "after",
    }),
  ).toEqual({ targetId: "genre", side: "after" });
  expect(
    columnDropOf({
      columns: COLUMNS,
      sourceId: "duration",
      overId: "album",
      side: "before",
    }),
  ).toEqual({ targetId: "album", side: "before" });
});

it("lands before the first optional column over a leading pinned column", () => {
  for (const overId of ["ordinal", "title"] as const) {
    for (const side of ["before", "after"] as const) {
      expect(
        columnDropOf({ columns: COLUMNS, sourceId: "genre", overId, side }),
      ).toEqual({ targetId: "artist", side: "before" });
    }
  }
});

it("lands after the last optional column over the trailing pinned column", () => {
  for (const side of ["before", "after"] as const) {
    expect(
      columnDropOf({
        columns: COLUMNS,
        sourceId: "album",
        overId: "menu",
        side,
      }),
    ).toEqual({ targetId: "duration", side: "after" });
  }
});

it("is null when the column is dropped where it already is", () => {
  expect(
    columnDropOf({
      columns: COLUMNS,
      sourceId: "album",
      overId: "album",
      side: "before",
    }),
  ).toBeNull();
  expect(
    columnDropOf({
      columns: COLUMNS,
      sourceId: "album",
      overId: "artist",
      side: "after",
    }),
  ).toBeNull();
  expect(
    columnDropOf({
      columns: COLUMNS,
      sourceId: "album",
      overId: "genre",
      side: "before",
    }),
  ).toBeNull();
  expect(
    columnDropOf({
      columns: COLUMNS,
      sourceId: "artist",
      overId: "title",
      side: "after",
    }),
  ).toBeNull();
  expect(
    columnDropOf({
      columns: COLUMNS,
      sourceId: "duration",
      overId: "menu",
      side: "before",
    }),
  ).toBeNull();
});

it("is null when no optional column is shown", () => {
  expect(
    columnDropOf({
      columns: resolveVisibleColumns(PLAYLIST_COLUMNS, []),
      sourceId: "artist",
      overId: "title",
      side: "after",
    }),
  ).toBeNull();
});
