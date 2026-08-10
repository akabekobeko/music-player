import { expect, it } from "vitest";
import { moveItem, removeAt } from "./reorder";

it("moves an item forward, shifting the range left", () => {
  expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
});

it("moves an item backward, shifting the range right", () => {
  expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
});

it("returns a copy for same or out-of-range indexes", () => {
  const list = ["a", "b"];
  expect(moveItem(list, 1, 1)).toEqual(list);
  expect(moveItem(list, -1, 0)).toEqual(list);
  expect(moveItem(list, 0, 5)).toEqual(list);
  expect(moveItem(list, 1, 1)).not.toBe(list);
});

it("removes exactly one position, keeping duplicates elsewhere", () => {
  expect(removeAt(["x", "y", "x"], 0)).toEqual(["y", "x"]);
  expect(removeAt(["x", "y", "x"], 2)).toEqual(["x", "y"]);
});
