import { expect, it } from "vitest";
import { escapeLucene } from "./escapeLucene";

it("escapes every Lucene special character with a backslash", () => {
  const specials = '+-&|!(){}[]^"~*?:\\/';
  expect(escapeLucene(specials)).toBe(
    '\\+\\-\\&\\|\\!\\(\\)\\{\\}\\[\\]\\^\\"\\~\\*\\?\\:\\\\\\/',
  );
});

it("escapes both characters of && and ||", () => {
  expect(escapeLucene("a && b || c")).toBe("a \\&\\& b \\|\\| c");
});

it("passes Japanese text and emoji through unchanged", () => {
  expect(escapeLucene("夜に駆ける")).toBe("夜に駆ける");
  expect(escapeLucene("Summer 🌞 Hits")).toBe("Summer 🌞 Hits");
});

it("returns the empty string for the empty string", () => {
  expect(escapeLucene("")).toBe("");
});
