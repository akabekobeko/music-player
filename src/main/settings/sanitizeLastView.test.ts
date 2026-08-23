import { expect, it } from "vitest";
import { sanitizeLastView } from "./sanitizeLastView";

it("returns undefined for non-object input or an unknown section", () => {
  expect(sanitizeLastView(null)).toBeUndefined();
  expect(sanitizeLastView("artists")).toBeUndefined();
  expect(sanitizeLastView({ section: "settings" })).toBeUndefined();
  expect(sanitizeLastView({})).toBeUndefined();
});

it("keeps the artist selection (including the empty unknown bucket)", () => {
  expect(sanitizeLastView({ section: "artists", artist: "Queen" })).toEqual({
    section: "artists",
    artist: "Queen",
  });
  expect(sanitizeLastView({ section: "artists", artist: "" })).toEqual({
    section: "artists",
    artist: "",
  });
  expect(sanitizeLastView({ section: "artists", artist: 1 })).toEqual({
    section: "artists",
  });
});

it("keeps only well-formed playlist route ids", () => {
  expect(sanitizeLastView({ section: "playlists", playlist: "p12" })).toEqual({
    section: "playlists",
    playlist: "p12",
  });
  expect(sanitizeLastView({ section: "playlists", playlist: "s3" })).toEqual({
    section: "playlists",
    playlist: "s3",
  });
  expect(sanitizeLastView({ section: "playlists", playlist: "x3" })).toEqual({
    section: "playlists",
  });
});

it("keeps every section's selection regardless of the current section", () => {
  expect(
    sanitizeLastView({ section: "albums", artist: "Queen", playlist: "p1" }),
  ).toEqual({ section: "albums", artist: "Queen", playlist: "p1" });
});
