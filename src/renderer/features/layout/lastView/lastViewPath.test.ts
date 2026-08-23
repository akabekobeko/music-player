import { expect, it } from "vitest";
import { lastViewPath } from "./lastViewPath";

it("builds section roots", () => {
  expect(lastViewPath({ section: "artists" })).toBe("/artists");
  expect(lastViewPath({ section: "albums" })).toBe("/albums");
  expect(lastViewPath({ section: "playlists" })).toBe("/playlists");
});

it("encodes the artist name and maps the empty name to the unknown path", () => {
  expect(lastViewPath({ section: "artists", artist: "AC/DC" })).toBe(
    "/artists/name/AC%2FDC",
  );
  expect(lastViewPath({ section: "artists", artist: "" })).toBe(
    "/artists/unknown",
  );
});

it("appends the playlist route id", () => {
  expect(lastViewPath({ section: "playlists", playlist: "s3" })).toBe(
    "/playlists/s3",
  );
});
