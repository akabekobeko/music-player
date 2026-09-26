import { expect, it } from "vitest";
import { musicBrainzErrorKeyOf } from "./musicBrainzErrorKeyOf";

it("gives the three actionable failures their own kind and wording", () => {
  expect(
    musicBrainzErrorKeyOf({ name: "E", code: "MB_NETWORK", message: "x" }),
  ).toEqual({
    kind: "network",
    key: "musicbrainz.error.network",
  });
  expect(
    musicBrainzErrorKeyOf({ name: "E", code: "MB_TIMEOUT", message: "x" }),
  ).toEqual({
    kind: "timeout",
    key: "musicbrainz.error.timeout",
  });
  expect(
    musicBrainzErrorKeyOf({ name: "E", code: "MB_THROTTLED", message: "x" }),
  ).toEqual({
    kind: "throttled",
    key: "musicbrainz.error.throttled",
  });
});

it("classifies anything else as other with the raw message", () => {
  expect(
    musicBrainzErrorKeyOf({ name: "E", code: "MB_HTTP_500", message: "boom" }),
  ).toEqual({
    kind: "other",
    key: "musicbrainz.error.failed",
    params: { message: "boom" },
  });
  expect(musicBrainzErrorKeyOf({ name: "E", message: "no code" }).kind).toBe(
    "other",
  );
});
