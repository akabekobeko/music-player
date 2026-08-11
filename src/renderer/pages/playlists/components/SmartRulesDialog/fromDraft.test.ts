import { expect, it } from "vitest";
import { fromDraft } from "./fromDraft";
import { toDraft } from "./toDraft";

it("drops an invalid limit input", () => {
  const draft = toDraft({ version: 1, match: "all", conditions: [] });
  expect(fromDraft({ ...draft, limit: "abc" }).limit).toBeUndefined();
  expect(fromDraft({ ...draft, limit: "0" }).limit).toBeUndefined();
  expect(fromDraft({ ...draft, limit: "10" }).limit).toBe(10);
});
