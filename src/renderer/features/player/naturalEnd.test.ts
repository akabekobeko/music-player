import { expect, it } from "vitest";
import type { PlaybackSnapshot } from "../audio/types";
import { isNaturalEnd } from "./naturalEnd";

const snapshot = (patch: Partial<PlaybackSnapshot>): PlaybackSnapshot => ({
  state: "stopped",
  currentTime: 0,
  duration: 0,
  volume: 1,
  seeking: false,
  bufferReady: false,
  error: null,
  ...patch,
});

it("detects a track that ran to its end", () => {
  expect(isNaturalEnd(snapshot({ currentTime: 200, duration: 200 }))).toBe(
    true,
  );
  expect(isNaturalEnd(snapshot({ currentTime: 199.995, duration: 200 }))).toBe(
    true,
  );
});

it("rejects a manual stop (position rewound to zero)", () => {
  expect(isNaturalEnd(snapshot({ currentTime: 0, duration: 200 }))).toBe(false);
});

it("rejects non-stopped states and unknown durations", () => {
  expect(
    isNaturalEnd(
      snapshot({ state: "playing", currentTime: 200, duration: 200 }),
    ),
  ).toBe(false);
  expect(isNaturalEnd(snapshot({ currentTime: 0, duration: 0 }))).toBe(false);
});
