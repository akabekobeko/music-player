import { expect, it } from "vitest";
import type { SmartCondition, SmartPlaylistRules } from "../ipc/types";
import { buildSmartSql } from "./buildSmartSql";

const NOW = new Date("2026-08-10T00:00:00.000Z");

const rules = (
  conditions: SmartCondition[],
  overrides: Partial<SmartPlaylistRules> = {},
): SmartPlaylistRules => ({
  version: 1,
  match: "all",
  conditions,
  ...overrides,
});

it("joins conditions with AND for match=all and OR for match=any", () => {
  const conditions: SmartCondition[] = [
    { field: "genre", operator: "is", value: "Rock" },
    { field: "year", operator: "gte", value: 2000 },
  ];
  expect(buildSmartSql(rules(conditions), NOW).sql).toContain(
    "(m.genre = ?) AND (m.year >= ?)",
  );
  expect(buildSmartSql(rules(conditions, { match: "any" }), NOW).sql).toContain(
    "(m.genre = ?) OR (m.year >= ?)",
  );
});

it("emits no WHERE for an empty condition list", () => {
  expect(buildSmartSql(rules([]), NOW).sql).not.toContain("WHERE");
});

it("emits the sort clause (field order, random, and the stable default)", () => {
  expect(
    buildSmartSql(rules([], { sort: { field: "year", order: "desc" } }), NOW)
      .sql,
  ).toContain("ORDER BY m.year DESC");
  expect(
    buildSmartSql(rules([], { sort: { field: "random" } }), NOW).sql,
  ).toContain("ORDER BY RANDOM()");
  expect(buildSmartSql(rules([]), NOW).sql).toContain(
    "ORDER BY m.artist, m.album, m.disc, m.track",
  );
});

it("appends LIMIT as a parameter when set", () => {
  const { sql, params } = buildSmartSql(rules([], { limit: 25 }), NOW);
  expect(sql).toContain("LIMIT ?");
  expect(params).toEqual([25]);
});
