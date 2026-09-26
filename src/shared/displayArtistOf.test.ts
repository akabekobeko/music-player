import { expect, it } from "vitest";
import { displayArtistOf } from "./displayArtistOf";

it("prefers the album artist", () => {
  expect(displayArtistOf({ artist: "Solo", albumArtist: "Band" })).toBe("Band");
});

it("falls back to the track artist when the album artist is empty", () => {
  expect(displayArtistOf({ artist: "Solo", albumArtist: "" })).toBe("Solo");
});

it("is empty for the unknown artist", () => {
  expect(displayArtistOf({ artist: "", albumArtist: "" })).toBe("");
});
