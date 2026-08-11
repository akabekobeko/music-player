import { expect, it } from "vitest";
import { playlistRouteId } from "./playlistRouteId";

it("builds p<id> for static and s<id> for smart playlists", () => {
  expect(playlistRouteId({ id: 3, kind: "static" })).toBe("p3");
  expect(playlistRouteId({ id: 12, kind: "smart" })).toBe("s12");
});
