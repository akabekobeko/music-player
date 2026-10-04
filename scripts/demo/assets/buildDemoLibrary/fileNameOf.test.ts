import { expect, it } from "vitest";
import { fileNameOf } from "./fileNameOf.ts";

it("keeps ordinary titles as they are", () => {
  expect(fileNameOf("Alice & Bob")).toBe("Alice & Bob");
});

it("replaces characters that are invalid in file names", () => {
  expect(fileNameOf("Suite No. 2: III. Adagio / Live?")).toBe(
    "Suite No. 2_ III. Adagio _ Live_",
  );
});

it("drops trailing dots and spaces", () => {
  expect(fileNameOf("Vol. ")).toBe("Vol");
});
