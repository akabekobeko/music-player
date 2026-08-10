import type { SmartPlaylistRules } from "@mp/ipc";
import { expect, it } from "vitest";
import {
  defaultCondition,
  fromDraft,
  operatorsFor,
  toDraft,
} from "./rulesForm";

it("offers operators matching each field's condition type", () => {
  expect(operatorsFor("artist")).toEqual(["is", "isNot", "contains"]);
  expect(operatorsFor("year")).toEqual(["is", "between", "gte", "lte"]);
  expect(operatorsFor("rating")).toEqual(["gte", "lte"]);
  expect(operatorsFor("addedAt")).toEqual(["inLastDays"]);
});

it("builds a valid default condition per field", () => {
  expect(defaultCondition("genre")).toEqual({
    field: "genre",
    operator: "contains",
    value: "",
  });
  expect(defaultCondition("addedAt")).toEqual({
    field: "addedAt",
    operator: "inLastDays",
    value: 30,
  });
});

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

it("drops an invalid limit input", () => {
  const draft = toDraft({ version: 1, match: "all", conditions: [] });
  expect(fromDraft({ ...draft, limit: "abc" }).limit).toBeUndefined();
  expect(fromDraft({ ...draft, limit: "0" }).limit).toBeUndefined();
  expect(fromDraft({ ...draft, limit: "10" }).limit).toBe(10);
});
