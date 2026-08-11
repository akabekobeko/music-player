import { expect, it } from "vitest";
import { removeAt } from "./removeAt";

it("removes exactly one position, keeping duplicates elsewhere", () => {
  expect(removeAt(["x", "y", "x"], 0)).toEqual(["y", "x"]);
  expect(removeAt(["x", "y", "x"], 2)).toEqual(["x", "y"]);
});
