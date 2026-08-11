import { expect, it } from "vitest";
import type { PlaybackSnapshot } from "../../audio/types";
import { SEEK_STEP_SEC, seekTargetFrom } from "./seekTargetFrom";

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

it("steps forward and backward from the current position", () => {
  const base = snapshot({ currentTime: 60, duration: 200 });
  expect(seekTargetFrom(base, SEEK_STEP_SEC)).toBe(65);
  expect(seekTargetFrom(base, -SEEK_STEP_SEC)).toBe(55);
});

it("clamps at the track boundaries", () => {
  expect(seekTargetFrom(snapshot({ currentTime: 2, duration: 200 }), -5)).toBe(
    0,
  );
  expect(seekTargetFrom(snapshot({ currentTime: 198, duration: 200 }), 5)).toBe(
    200,
  );
});

it("returns null while the duration is unknown", () => {
  expect(seekTargetFrom(snapshot({ currentTime: 10, duration: 0 }), 5)).toBe(
    null,
  );
});
