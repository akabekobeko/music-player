import { expect, it } from "vitest";
import { buildUserAgent } from "./buildUserAgent";

it("follows the MusicBrainz recommended form with the repository as contact", () => {
  expect(buildUserAgent("1.2.0")).toBe(
    "Parade/1.2.0 ( https://github.com/akabekobeko/music-player )",
  );
});

it("passes the version through unchanged, including prerelease tags", () => {
  expect(buildUserAgent("0.0.0-test")).toMatch(/^Parade\/0\.0\.0-test /);
});
