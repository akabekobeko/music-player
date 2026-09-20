import { expect, it } from "vitest";
import { sectionOf } from "./sectionOf";

it("maps a pathname to its section by prefix", () => {
  expect(sectionOf("/artists")).toBe("artists");
  expect(sectionOf("/artists/name/AC%2FDC")).toBe("artists");
  expect(sectionOf("/albums")).toBe("albums");
  expect(sectionOf("/playlists/p12")).toBe("playlists");
});

it("yields null outside the main sections", () => {
  expect(sectionOf("/settings")).toBeNull();
  expect(sectionOf("/")).toBeNull();
});
