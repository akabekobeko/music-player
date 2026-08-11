import { expect, it } from "vitest";
import { defaultCondition } from "./defaultCondition";

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
