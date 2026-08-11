import { expect, it } from "vitest";
import { operatorsFor } from "./operatorsFor";

it("offers operators matching each field's condition type", () => {
  expect(operatorsFor("artist")).toEqual(["is", "isNot", "contains"]);
  expect(operatorsFor("year")).toEqual(["is", "between", "gte", "lte"]);
  expect(operatorsFor("rating")).toEqual(["gte", "lte"]);
  expect(operatorsFor("addedAt")).toEqual(["inLastDays"]);
});
