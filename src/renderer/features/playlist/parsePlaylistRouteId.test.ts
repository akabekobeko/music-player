import { expect, it } from "vitest";
import { parsePlaylistRouteId } from "./parsePlaylistRouteId";

it("parses route ids back to id and kind", () => {
  expect(parsePlaylistRouteId("p3")).toEqual({ id: 3, kind: "static" });
  expect(parsePlaylistRouteId("s12")).toEqual({ id: 12, kind: "smart" });
});

it("rejects malformed route ids", () => {
  expect(parsePlaylistRouteId("x3")).toBeNull();
  expect(parsePlaylistRouteId("p")).toBeNull();
  expect(parsePlaylistRouteId("3")).toBeNull();
  expect(parsePlaylistRouteId("p3x")).toBeNull();
  expect(parsePlaylistRouteId("")).toBeNull();
});
