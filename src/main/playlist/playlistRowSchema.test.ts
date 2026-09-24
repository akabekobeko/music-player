import { expect, it } from "vitest";
import { smartPlaylistRowSchema } from "./playlistRowSchema";

const ROW = { id: 1, name: "S", sortOrder: 0 };

it("decodes the stored rule JSON into the rule document", () => {
  expect(
    smartPlaylistRowSchema.parse({
      ...ROW,
      rules: '{"version":1,"match":"all","conditions":[]}',
    }),
  ).toEqual({ ...ROW, rules: { version: 1, match: "all", conditions: [] } });
});

it("reports malformed JSON as a parse issue", () => {
  expect(() =>
    smartPlaylistRowSchema.parse({ ...ROW, rules: "{not json" }),
  ).toThrow(/not valid JSON/);
});

it("rejects JSON that is not a rule document", () => {
  expect(() =>
    smartPlaylistRowSchema.parse({ ...ROW, rules: '{"version":1}' }),
  ).toThrow();
  expect(() =>
    smartPlaylistRowSchema.parse({ ...ROW, rules: "null" }),
  ).toThrow();
});
