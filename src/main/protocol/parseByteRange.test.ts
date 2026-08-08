import { expect, it } from "vitest";
import { parseByteRange } from "./parseByteRange";

it("parses a bounded range", () => {
  expect(parseByteRange("bytes=0-99", 1000)).toEqual({ start: 0, end: 99 });
});

it("parses an open-ended range to the last byte", () => {
  expect(parseByteRange("bytes=500-", 1000)).toEqual({ start: 500, end: 999 });
});

it("parses a suffix range as the last N bytes", () => {
  expect(parseByteRange("bytes=-100", 1000)).toEqual({ start: 900, end: 999 });
});

it("clamps a suffix range larger than the file", () => {
  expect(parseByteRange("bytes=-5000", 1000)).toEqual({ start: 0, end: 999 });
});

it("clamps an end beyond the file size", () => {
  expect(parseByteRange("bytes=0-9999", 1000)).toEqual({ start: 0, end: 999 });
});

it("rejects a start beyond the file size", () => {
  expect(parseByteRange("bytes=1000-", 1000)).toBeNull();
});

it("rejects an inverted range", () => {
  expect(parseByteRange("bytes=200-100", 1000)).toBeNull();
});

it("rejects malformed headers", () => {
  expect(parseByteRange("bytes=-", 1000)).toBeNull();
  expect(parseByteRange("items=0-1", 1000)).toBeNull();
  expect(parseByteRange("bytes=0-1,5-9", 1000)).toBeNull();
});
