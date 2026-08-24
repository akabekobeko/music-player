import { expect, it } from "vitest";
import { initialOf } from "./initialOf";

it("uses the first letter, upper-cased", () => {
  expect(initialOf("Adele")).toBe("A");
  expect(initialOf("bbb")).toBe("B");
  expect(initialOf("  Zed  ")).toBe("Z");
});

it("ignores leading articles like the sort order", () => {
  expect(initialOf("The Who")).toBe("W");
  expect(initialOf("A Perfect Circle")).toBe("P");
  expect(initialOf("Thee Michelle Gun Elephant")).toBe("M");
  expect(initialOf("Theatre of Tragedy")).toBe("T");
});

it("puts digits, symbols, non-Latin scripts and the empty name into other", () => {
  expect(initialOf("2Pac")).toBe("#");
  expect(initialOf("!!!")).toBe("#");
  expect(initialOf("Édith Piaf")).toBe("#");
  expect(initialOf("宇多田ヒカル")).toBe("#");
  expect(initialOf("")).toBe("#");
});
