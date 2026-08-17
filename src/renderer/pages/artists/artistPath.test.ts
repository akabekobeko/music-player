import { expect, it } from "vitest";
import { artistPathOf, UNKNOWN_ARTIST_PATH } from "./artistPath";

it("routes a named artist under /artists/name/", () => {
  expect(artistPathOf("Pink Floyd")).toBe("/artists/name/Pink%20Floyd");
});

it("percent-encodes path-hostile characters", () => {
  expect(artistPathOf("AC/DC")).toBe("/artists/name/AC%2FDC");
});

it("routes the empty name to the reserved unknown path", () => {
  expect(artistPathOf("")).toBe(UNKNOWN_ARTIST_PATH);
});

it("never collides a real artist with the reserved word", () => {
  expect(artistPathOf("unknown")).toBe("/artists/name/unknown");
});
