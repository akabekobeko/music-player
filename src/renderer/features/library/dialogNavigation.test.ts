import { expect, it } from "vitest";
import {
  adjacentOf,
  DialogNavigator,
  movedBy,
  navigationOf,
} from "./dialogNavigation";

const LIST: readonly string[] = ["a", "b", "c"];

it("navigationOf locates the subject in its list", () => {
  expect(navigationOf(LIST, (item) => item === "b")).toEqual({
    siblings: LIST,
    index: 1,
  });
});

it("navigationOf is null without a list or a matching entry", () => {
  expect(navigationOf(undefined, () => true)).toBeNull();
  expect(navigationOf(LIST, (item) => item === "z")).toBeNull();
});

it("adjacentOf gives both neighbours in the middle of the list", () => {
  expect(adjacentOf({ siblings: LIST, index: 1 })).toEqual({
    previous: "a",
    next: "c",
  });
});

it("adjacentOf has no previous at the start and no next at the end", () => {
  expect(adjacentOf({ siblings: LIST, index: 0 })).toEqual({
    previous: null,
    next: "b",
  });
  expect(adjacentOf({ siblings: LIST, index: 2 })).toEqual({
    previous: "b",
    next: null,
  });
});

it("adjacentOf has no neighbours without a navigation", () => {
  expect(adjacentOf(null)).toEqual({ previous: null, next: null });
});

it("movedBy steps within the list and refuses to leave it", () => {
  const start = { siblings: LIST, index: 0 };
  const next = movedBy(start, 1);
  expect(next).toEqual({ siblings: LIST, index: 1 });
  expect(movedBy(next, -1)).toEqual(start);
  expect(movedBy(start, -1)).toBeNull();
  expect(movedBy({ siblings: LIST, index: 2 }, 1)).toBeNull();
  expect(movedBy(null, 1)).toBeNull();
});

it("DialogNavigator steps through a located list and reports the neighbours", () => {
  const navigator = new DialogNavigator<string>();
  navigator.locate(LIST, (item) => item === "a");
  expect(navigator.adjacent()).toEqual({ previous: null, next: "b" });
  expect(navigator.move(1)).toBe("b");
  expect(navigator.adjacent()).toEqual({ previous: "a", next: "c" });
  expect(navigator.move(1)).toBe("c");
  expect(navigator.move(1)).toBeNull();
  expect(navigator.adjacent()).toEqual({ previous: "b", next: null });
});

it("DialogNavigator has nothing to step to without a list or after a reset", () => {
  const navigator = new DialogNavigator<string>();
  expect(navigator.move(1)).toBeNull();
  navigator.locate(LIST, (item) => item === "b");
  navigator.reset();
  expect(navigator.adjacent()).toEqual({ previous: null, next: null });
  expect(navigator.move(-1)).toBeNull();
});
