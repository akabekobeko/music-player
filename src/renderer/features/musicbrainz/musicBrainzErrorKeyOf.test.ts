import { expect, it } from "vitest";
import { musicBrainzErrorKeyOf } from "./musicBrainzErrorKeyOf";

it("gives the three actionable failures their own wording", () => {
  expect(
    musicBrainzErrorKeyOf({ name: "E", code: "MB_NETWORK", message: "x" }),
  ).toEqual({
    key: "musicbrainz.error.network",
  });
  expect(
    musicBrainzErrorKeyOf({ name: "E", code: "MB_TIMEOUT", message: "x" }),
  ).toEqual({
    key: "musicbrainz.error.timeout",
  });
  expect(
    musicBrainzErrorKeyOf({ name: "E", code: "MB_THROTTLED", message: "x" }),
  ).toEqual({
    key: "musicbrainz.error.throttled",
  });
});

it("shows the raw message for anything else", () => {
  expect(
    musicBrainzErrorKeyOf({ name: "E", code: "MB_HTTP_500", message: "boom" }),
  ).toEqual({
    key: "musicbrainz.error.failed",
    params: { message: "boom" },
  });
  expect(musicBrainzErrorKeyOf({ name: "E", message: "no code" })).toEqual({
    key: "musicbrainz.error.failed",
    params: { message: "no code" },
  });
});
