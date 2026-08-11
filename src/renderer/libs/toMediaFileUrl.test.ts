import { expect, it } from "vitest";
import { toMediaFileUrl } from "./toMediaFileUrl";

it("prefixes the scheme and keeps path separators", () => {
  expect(toMediaFileUrl("/Users/a/images/abc.jpg")).toBe(
    "media-file:///Users/a/images/abc.jpg",
  );
});
