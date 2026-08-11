import type { SmartPlaylistRules } from "@mp/ipc";
import { expect, it } from "vitest";
import { fromDraft } from "./fromDraft";
import { toDraft } from "./toDraft";

it("round-trips rules through the draft", () => {
  const rules: SmartPlaylistRules = {
    version: 1,
    match: "any",
    conditions: [
      { field: "genre", operator: "is", value: "Rock" },
      { field: "year", operator: "between", value: 1990, value2: 1999 },
    ],
    sort: { field: "year", order: "desc" },
    limit: 50,
  };
  expect(fromDraft(toDraft(rules))).toEqual(rules);
});

it("maps the sort choices none and random", () => {
  const none: SmartPlaylistRules = { version: 1, match: "all", conditions: [] };
  expect(fromDraft(toDraft(none))).toEqual(none);

  const random: SmartPlaylistRules = {
    version: 1,
    match: "all",
    conditions: [],
    sort: { field: "random" },
  };
  expect(fromDraft(toDraft(random))).toEqual(random);
});
