import { expect, it } from "vitest";
import type { SmartCondition } from "../../ipc/types";
import { buildConditionSql } from "./buildConditionSql";

const NOW = new Date("2026-08-10T00:00:00.000Z");

it("converts text conditions (is / isNot / contains)", () => {
  expect(
    buildConditionSql({ field: "artist", operator: "is", value: "A" }, NOW),
  ).toEqual({ sql: "m.artist = ?", params: ["A"] });
  expect(
    buildConditionSql({ field: "genre", operator: "isNot", value: "B" }, NOW),
  ).toEqual({ sql: "m.genre <> ?", params: ["B"] });
  expect(
    buildConditionSql(
      { field: "title", operator: "contains", value: "50%_off" },
      NOW,
    ),
  ).toEqual({
    sql: "m.title LIKE ? ESCAPE '\\'",
    params: ["%50\\%\\_off%"],
  });
});

it("maps albumArtist to the album_artist column", () => {
  expect(
    buildConditionSql(
      { field: "albumArtist", operator: "is", value: "VA" },
      NOW,
    ).sql,
  ).toBe("m.album_artist = ?");
});

it("converts year conditions including between", () => {
  expect(
    buildConditionSql({ field: "year", operator: "is", value: 1999 }, NOW),
  ).toEqual({ sql: "m.year = ?", params: [1999] });
  expect(
    buildConditionSql(
      { field: "year", operator: "between", value: 1990, value2: 1999 },
      NOW,
    ),
  ).toEqual({ sql: "m.year BETWEEN ? AND ?", params: [1990, 1999] });
  expect(
    buildConditionSql({ field: "year", operator: "gte", value: 2000 }, NOW),
  ).toEqual({ sql: "m.year >= ?", params: [2000] });
});

it("converts duration seconds into the milliseconds column", () => {
  expect(
    buildConditionSql({ field: "duration", operator: "gte", value: 90 }, NOW),
  ).toEqual({ sql: "m.duration_ms >= ?", params: [90000] });
});

it("converts rating bounds", () => {
  expect(
    buildConditionSql({ field: "rating", operator: "lte", value: 0.5 }, NOW),
  ).toEqual({ sql: "m.rating <= ?", params: [0.5] });
});

it("converts addedAt inLastDays into an ISO cutoff from now", () => {
  expect(
    buildConditionSql(
      { field: "addedAt", operator: "inLastDays", value: 7 },
      NOW,
    ),
  ).toEqual({
    sql: "m.added_at >= ?",
    params: ["2026-08-03T00:00:00.000Z"],
  });
});

it("throws for a malformed condition document", () => {
  expect(() =>
    buildConditionSql(
      {
        field: "plays",
        operator: "gte",
        value: 1,
      } as unknown as SmartCondition,
      NOW,
    ),
  ).toThrow(/Unsupported/);
});
