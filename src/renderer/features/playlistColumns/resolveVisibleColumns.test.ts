import { expect, it } from "vitest";
import { PLAYLIST_COLUMNS } from "./constants";
import { resolveVisibleColumns } from "./resolveVisibleColumns";

const idsOf = (visibleIds: readonly string[] | undefined): string[] =>
  resolveVisibleColumns(PLAYLIST_COLUMNS, visibleIds).map(
    (column) => column.id,
  );

it("shows the default columns when nothing is saved", () => {
  expect(idsOf(undefined)).toEqual([
    "ordinal",
    "title",
    "artist",
    "album",
    "duration",
    "menu",
  ]);
});

it("shows only the pinned columns for an empty list", () => {
  expect(idsOf([])).toEqual(["ordinal", "title", "menu"]);
});

it("keeps the declaration order whatever the order of the ids", () => {
  expect(idsOf(["duration", "year", "artist"])).toEqual([
    "ordinal",
    "title",
    "artist",
    "year",
    "duration",
    "menu",
  ]);
});

it("drops ids that name no column", () => {
  expect(idsOf(["genre", "unknown", ""])).toEqual([
    "ordinal",
    "title",
    "genre",
    "menu",
  ]);
});

it("shows a pinned column once even when it is listed", () => {
  expect(idsOf(["title", "menu", "album"])).toEqual([
    "ordinal",
    "title",
    "album",
    "menu",
  ]);
});
