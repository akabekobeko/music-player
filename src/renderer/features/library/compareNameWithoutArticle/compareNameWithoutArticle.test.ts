import { expect, it } from "vitest";
import { compareNameWithoutArticle } from "./compareNameWithoutArticle";

it("sorts article-blind and case-insensitively", () => {
  const names = ["The Zutons", "a-ha", "Beck", "The Beatles"];
  names.sort(compareNameWithoutArticle);
  expect(names).toEqual(["a-ha", "The Beatles", "Beck", "The Zutons"]);
});

it("breaks ties on the raw name", () => {
  expect(compareNameWithoutArticle("A Day", "The Day")).toBeLessThan(0);
  expect(compareNameWithoutArticle("Same", "Same")).toBe(0);
});
