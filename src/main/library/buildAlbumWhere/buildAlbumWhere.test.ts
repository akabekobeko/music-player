import { expect, it } from "vitest";
import { buildAlbumWhere } from "./buildAlbumWhere";

it("builds no fragment for an empty filter", () => {
  expect(buildAlbumWhere({})).toEqual([]);
  expect(
    buildAlbumWhere({ text: "  ", musicTitle: "  ", genres: [], decades: [] }),
  ).toEqual([]);
});

it("builds a musicTitle fragment matching track titles", () => {
  expect(buildAlbumWhere({ musicTitle: "rain" })).toEqual([
    { sql: "m.title LIKE ? ESCAPE '\\'", params: ["%rain%"] },
  ]);
});

it("escapes LIKE metacharacters in the musicTitle", () => {
  const [fragment] = buildAlbumWhere({ musicTitle: "100%_\\" });
  expect(fragment?.params[0]).toBe("%100\\%\\_\\\\%");
});

it("builds a text fragment matching album and artist", () => {
  expect(buildAlbumWhere({ text: "abba" })).toEqual([
    {
      sql: "(m.album LIKE ? ESCAPE '\\' OR COALESCE(NULLIF(m.album_artist, ''), m.artist) LIKE ? ESCAPE '\\')",
      params: ["%abba%", "%abba%"],
    },
  ]);
});

it("escapes LIKE metacharacters in the text", () => {
  const [fragment] = buildAlbumWhere({ text: "100%_\\" });
  expect(fragment?.params[0]).toBe("%100\\%\\_\\\\%");
});

it("builds a genre IN fragment", () => {
  expect(buildAlbumWhere({ genres: ["Rock", "Jazz"] })).toEqual([
    { sql: "m.genre IN (?, ?)", params: ["Rock", "Jazz"] },
  ]);
});

it("builds a decade fragment with year ranges OR-joined", () => {
  expect(buildAlbumWhere({ decades: [1990, 2000] })).toEqual([
    {
      sql: "((m.year >= ? AND m.year < ?) OR (m.year >= ? AND m.year < ?))",
      params: [1990, 2000, 2000, 2010],
    },
  ]);
});

it("maps the null decade to year IS NULL", () => {
  expect(buildAlbumWhere({ decades: [null, 1980] })).toEqual([
    {
      sql: "(m.year IS NULL OR (m.year >= ? AND m.year < ?))",
      params: [1980, 1990],
    },
  ]);
});

it("combines filter kinds with AND (one fragment per kind)", () => {
  const fragments = buildAlbumWhere({
    text: "a",
    musicTitle: "b",
    genres: ["Rock"],
    decades: [2000],
  });
  expect(fragments).toHaveLength(4);
});
