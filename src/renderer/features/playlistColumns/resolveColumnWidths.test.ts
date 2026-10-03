import { expect, it } from "vitest";
import { MIN_COLUMN_WIDTH, PLAYLIST_COLUMNS } from "./constants";
import { resolveColumnWidths } from "./resolveColumnWidths";
import { resolveVisibleColumns } from "./resolveVisibleColumns";

const DEFAULT_COLUMNS = resolveVisibleColumns(PLAYLIST_COLUMNS, undefined);

it("uses the default widths when nothing is saved", () => {
  expect(resolveColumnWidths(DEFAULT_COLUMNS, undefined)).toEqual({
    ordinal: 44,
    title: 280,
    artist: 200,
    album: 200,
    duration: 72,
    menu: 44,
  });
});

it("uses the saved width and falls back to the default per column", () => {
  const widths = resolveColumnWidths(DEFAULT_COLUMNS, { artist: 320 });
  expect(widths.artist).toBe(320);
  expect(widths.album).toBe(200);
});

it("raises a saved width below the minimum to the minimum", () => {
  const widths = resolveColumnWidths(DEFAULT_COLUMNS, { duration: 10 });
  expect(widths.duration).toBe(MIN_COLUMN_WIDTH);
});

it("uses the default width for a saved width that is not a positive number", () => {
  const widths = resolveColumnWidths(DEFAULT_COLUMNS, {
    artist: Number.NaN,
    album: 0,
    duration: -20,
    title: Number.POSITIVE_INFINITY,
  });
  expect(widths.artist).toBe(200);
  expect(widths.album).toBe(200);
  expect(widths.duration).toBe(72);
  expect(widths.title).toBe(280);
});

it("ignores a saved width of a column that cannot be resized", () => {
  const widths = resolveColumnWidths(DEFAULT_COLUMNS, {
    ordinal: 200,
    menu: 200,
  });
  expect(widths.ordinal).toBe(44);
  expect(widths.menu).toBe(44);
});

it("resolves the given columns only", () => {
  const widths = resolveColumnWidths(DEFAULT_COLUMNS, { year: 100, zzz: 100 });
  expect(Object.keys(widths)).toEqual(
    DEFAULT_COLUMNS.map((column) => column.id),
  );
});
