import { expect, it } from "vitest";
import { resolveLastView } from "./resolveLastView";

const library = {
  artistNames: new Set(["Queen", ""]),
  playlistRouteIds: new Set(["p1", "s2"]),
};

it("keeps selections that still exist", () => {
  expect(
    resolveLastView({ section: "artists", artist: "Queen" }, library),
  ).toEqual({ section: "artists", artist: "Queen" });
  expect(resolveLastView({ section: "artists", artist: "" }, library)).toEqual({
    section: "artists",
    artist: "",
  });
  expect(
    resolveLastView({ section: "playlists", playlist: "s2" }, library),
  ).toEqual({ section: "playlists", playlist: "s2" });
});

it("falls back to the section root when the target is gone", () => {
  expect(
    resolveLastView({ section: "artists", artist: "Gone" }, library),
  ).toEqual({ section: "artists" });
  expect(
    resolveLastView({ section: "playlists", playlist: "p9" }, library),
  ).toEqual({ section: "playlists" });
});

it("passes albums and selection-less views through", () => {
  expect(resolveLastView({ section: "albums" }, library)).toEqual({
    section: "albums",
  });
  expect(resolveLastView({ section: "playlists" }, library)).toEqual({
    section: "playlists",
  });
});
