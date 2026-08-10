import { expect, it } from "vitest";
import { parsePlaylistRouteId, playlistRouteId } from "./routeId";

it("builds p<id> for static and s<id> for smart playlists", () => {
  expect(playlistRouteId({ id: 3, kind: "static" })).toBe("p3");
  expect(playlistRouteId({ id: 12, kind: "smart" })).toBe("s12");
});

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
