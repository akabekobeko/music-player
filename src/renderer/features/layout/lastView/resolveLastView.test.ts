import { expect, it } from "vitest";
import { resolveLastView } from "./resolveLastView";

const library = {
  artistNames: new Set(["Queen", ""]),
  playlistRouteIds: new Set(["p1", "s2"]),
};

it("keeps selections that still exist", () => {
  expect(
    resolveLastView(
      { section: "albums", artist: "Queen", playlist: "s2" },
      library,
    ),
  ).toEqual({ section: "albums", artist: "Queen", playlist: "s2" });
  expect(resolveLastView({ section: "artists", artist: "" }, library)).toEqual({
    section: "artists",
    artist: "",
  });
});

it("drops each selection whose target is gone, keeping the section", () => {
  expect(
    resolveLastView(
      { section: "artists", artist: "Gone", playlist: "p1" },
      library,
    ),
  ).toEqual({ section: "artists", playlist: "p1" });
  expect(
    resolveLastView({ section: "playlists", playlist: "p9" }, library),
  ).toEqual({ section: "playlists" });
});

it("passes selection-less views through", () => {
  expect(resolveLastView({ section: "albums" }, library)).toEqual({
    section: "albums",
  });
});
