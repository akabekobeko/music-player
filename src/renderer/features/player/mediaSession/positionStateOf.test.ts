import { expect, it } from "vitest";
import type { PlaybackSnapshot } from "../../audio/types";
import { positionStateOf } from "./positionStateOf";

const snapshot = (patch: Partial<PlaybackSnapshot>): PlaybackSnapshot => ({
  state: "playing",
  currentTime: 0,
  duration: 0,
  volume: 1,
  seeking: false,
  bufferReady: false,
  error: null,
  ...patch,
});

it("builds a clamped position state once the duration is known", () => {
  expect(positionStateOf(snapshot({ currentTime: 30, duration: 200 }))).toEqual(
    { duration: 200, position: 30, playbackRate: 1 },
  );
  expect(
    positionStateOf(snapshot({ currentTime: 250, duration: 200 }))?.position,
  ).toBe(200);
  expect(
    positionStateOf(snapshot({ currentTime: -1, duration: 200 }))?.position,
  ).toBe(0);
});

it("returns null while the duration is unknown", () => {
  expect(positionStateOf(snapshot({ currentTime: 5, duration: 0 }))).toBeNull();
});
