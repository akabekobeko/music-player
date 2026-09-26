import { expect, it } from "vitest";
import { buildReleaseQuery } from "./buildReleaseQuery";

it("combines the album and the album artist", () => {
  expect(
    buildReleaseQuery({
      album: "Year Zero",
      albumArtist: "Nine Inch Nails",
      artist: "NIN",
    }),
  ).toBe('release:"Year Zero" AND artist:"Nine Inch Nails"');
});

it("falls back to the track artist when the album artist is empty", () => {
  expect(
    buildReleaseQuery({ album: "Year Zero", albumArtist: "", artist: "NIN" }),
  ).toBe('release:"Year Zero" AND artist:"NIN"');
});

it("omits the artist clause for the unknown artist", () => {
  expect(
    buildReleaseQuery({ album: "Year Zero", albumArtist: "", artist: "" }),
  ).toBe('release:"Year Zero"');
});

it("escapes Lucene syntax inside the values", () => {
  expect(
    buildReleaseQuery({
      album: 'Hits (Vol. 1) "Live"',
      albumArtist: "AC/DC",
      artist: "",
    }),
  ).toBe('release:"Hits \\(Vol. 1\\) \\"Live\\"" AND artist:"AC\\/DC"');
});
