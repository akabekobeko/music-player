import { expect, it } from "vitest";
import { fetchFailureHintOf } from "./fetchFailureHintOf";

const failure = (code: string | undefined, musicId = 1) => ({
  musicId,
  filePath: `/${musicId}.mp3`,
  error: {
    name: "E",
    ...(code === undefined ? {} : { code }),
    message: code ?? "x",
  },
});

it("returns the shared wording when every failure has the same actionable cause", () => {
  expect(
    fetchFailureHintOf([failure("MB_NETWORK", 1), failure("MB_NETWORK", 2)]),
  ).toEqual({ kind: "network", key: "musicbrainz.error.network" });
  expect(fetchFailureHintOf([failure("MB_THROTTLED")])).toEqual({
    kind: "throttled",
    key: "musicbrainz.error.throttled",
  });
});

it("returns null for no failures, mixed causes, or a non-actionable cause", () => {
  expect(fetchFailureHintOf([])).toBeNull();
  expect(
    fetchFailureHintOf([failure("MB_NETWORK", 1), failure("MB_TIMEOUT", 2)]),
  ).toBeNull();
  expect(
    fetchFailureHintOf([failure("EACCES", 1), failure("EACCES", 2)]),
  ).toBeNull();
  expect(fetchFailureHintOf([failure(undefined)])).toBeNull();
});
