import { expect, it } from "vitest";
import { fetchErrorKeyOf } from "./fetchErrorKeyOf";

it("maps network and timeout failures to the offline wording", () => {
  expect(
    fetchErrorKeyOf({ name: "E", code: "MB_NETWORK", message: "x" }),
  ).toEqual({
    key: "musicInfo.fetchNetwork",
  });
  expect(
    fetchErrorKeyOf({ name: "E", code: "MB_TIMEOUT", message: "x" }),
  ).toEqual({
    key: "musicInfo.fetchNetwork",
  });
});

it("maps throttling to the busy wording", () => {
  expect(
    fetchErrorKeyOf({ name: "E", code: "MB_THROTTLED", message: "x" }),
  ).toEqual({
    key: "musicInfo.fetchThrottled",
  });
});

it("shows the raw message for anything else", () => {
  expect(
    fetchErrorKeyOf({ name: "E", code: "MB_HTTP_500", message: "boom" }),
  ).toEqual({
    key: "musicInfo.fetchFailed",
    params: { message: "boom" },
  });
  expect(fetchErrorKeyOf({ name: "E", message: "no code" })).toEqual({
    key: "musicInfo.fetchFailed",
    params: { message: "no code" },
  });
});
