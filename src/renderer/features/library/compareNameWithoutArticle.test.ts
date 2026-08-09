import { expect, it } from "vitest";
import {
  compareNameWithoutArticle,
  sortKeyWithoutArticle,
} from "./compareNameWithoutArticle";

it("strips leading articles from the sort key", () => {
  expect(sortKeyWithoutArticle("The Beatles")).toBe("beatles");
  expect(sortKeyWithoutArticle("A Perfect Circle")).toBe("perfect circle");
  expect(sortKeyWithoutArticle("Thee Michelle Gun Elephant")).toBe(
    "michelle gun elephant",
  );
});

it("does not strip articles that are part of a word", () => {
  expect(sortKeyWithoutArticle("Theatre of Tragedy")).toBe(
    "theatre of tragedy",
  );
  expect(sortKeyWithoutArticle("Adele")).toBe("adele");
});

it("sorts article-blind and case-insensitively", () => {
  const names = ["The Zutons", "a-ha", "Beck", "The Beatles"];
  names.sort(compareNameWithoutArticle);
  expect(names).toEqual(["a-ha", "The Beatles", "Beck", "The Zutons"]);
});

it("breaks ties on the raw name", () => {
  expect(compareNameWithoutArticle("A Day", "The Day")).toBeLessThan(0);
  expect(compareNameWithoutArticle("Same", "Same")).toBe(0);
});
