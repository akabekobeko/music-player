import { expect, it } from "vitest";
import { smartPlaylistRulesSchema } from "./smartPlaylistRulesSchema";

it("accepts every condition shape and both sort forms", () => {
  const rules = {
    version: 1,
    match: "any",
    conditions: [
      { field: "artist", operator: "contains", value: "a" },
      { field: "year", operator: "between", value: 1990, value2: 1999 },
      { field: "rating", operator: "gte", value: 0.8 },
      { field: "duration", operator: "lte", value: 300 },
      { field: "addedAt", operator: "inLastDays", value: 30 },
    ],
    sort: { field: "year", order: "desc" },
    limit: 25,
  };
  expect(smartPlaylistRulesSchema.parse(rules)).toEqual(rules);
  expect(
    smartPlaylistRulesSchema.parse({
      version: 1,
      match: "all",
      conditions: [],
      sort: { field: "random" },
    }),
  ).toMatchObject({ sort: { field: "random" } });
});

it("rejects an unknown version, field, or operator", () => {
  expect(() =>
    smartPlaylistRulesSchema.parse({
      version: 2,
      match: "all",
      conditions: [],
    }),
  ).toThrow();
  expect(() =>
    smartPlaylistRulesSchema.parse({
      version: 1,
      match: "all",
      conditions: [{ field: "playCount", operator: "gte", value: 1 }],
    }),
  ).toThrow();
  expect(() =>
    smartPlaylistRulesSchema.parse({
      version: 1,
      match: "all",
      conditions: [{ field: "year", operator: "contains", value: 1999 }],
    }),
  ).toThrow();
});

it("rejects a condition value of the wrong type for its field", () => {
  expect(() =>
    smartPlaylistRulesSchema.parse({
      version: 1,
      match: "all",
      conditions: [{ field: "genre", operator: "is", value: 1 }],
    }),
  ).toThrow();
});
