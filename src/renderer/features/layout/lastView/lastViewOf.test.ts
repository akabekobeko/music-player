import { expect, it } from "vitest";
import { lastViewOf } from "./lastViewOf";

it("maps section roots to a selection-less view", () => {
  expect(lastViewOf("/artists")).toEqual({ section: "artists" });
  expect(lastViewOf("/albums")).toEqual({ section: "albums" });
  expect(lastViewOf("/playlists")).toEqual({ section: "playlists" });
});

it("decodes the selected artist, including the unknown bucket", () => {
  expect(lastViewOf("/artists/name/AC%2FDC")).toEqual({
    section: "artists",
    artist: "AC/DC",
  });
  expect(lastViewOf("/artists/unknown")).toEqual({
    section: "artists",
    artist: "",
  });
});

it("keeps the playlist route id", () => {
  expect(lastViewOf("/playlists/p12")).toEqual({
    section: "playlists",
    playlist: "p12",
  });
});

it("returns null for settings and unknown paths", () => {
  expect(lastViewOf("/settings")).toBeNull();
  expect(lastViewOf("/")).toBeNull();
  expect(lastViewOf("/nowhere")).toBeNull();
});
