import { expect, it } from "vitest";
import { normalizeTitle } from "./normalizeTitle";

it("ignores case, surrounding whitespace and repeated spaces", () => {
  expect(normalizeTitle("  The   Beginning of the END ")).toBe(
    "the beginning of the end",
  );
});

it("folds full-width characters to half-width", () => {
  expect(normalizeTitle("ＳＵＲＶＩＶＡＬＩＳＭ　１")).toBe("survivalism 1");
  expect(normalizeTitle("ｶﾀｶﾅ")).toBe("カタカナ");
});
