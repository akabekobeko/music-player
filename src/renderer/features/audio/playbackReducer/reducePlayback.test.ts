import { expect, it } from "vitest";
import { createInitialPlayback } from "./createInitialPlayback";
import { reducePlayback } from "./reducePlayback";
import { snapshotOfPlayback } from "./snapshotOfPlayback";
import type { InternalPlayback, PlaybackEvent } from "./types";

const initial = (
  overrides: Partial<InternalPlayback> = {},
): InternalPlayback => ({ ...createInitialPlayback(1), ...overrides });

const apply = (
  state: InternalPlayback,
  ...events: PlaybackEvent[]
): InternalPlayback => events.reduce(reducePlayback, state);

it("loaded lands in paused without a play request", () => {
  expect(apply(initial(), { type: "loaded" }).state).toBe("paused");
});

it("loaded lands in playing when play was already requested", () => {
  const state = apply(initial(), { type: "playRequested" }, { type: "loaded" });
  expect(state.state).toBe("playing");
});

it("playRequested resumes from paused and stopped", () => {
  const paused = initial({ state: "paused" });
  expect(reducePlayback(paused, { type: "playRequested" }).state).toBe(
    "playing",
  );
  const stopped = initial({ state: "stopped" });
  expect(reducePlayback(stopped, { type: "playRequested" }).state).toBe(
    "playing",
  );
});

it("paused keeps intendedPlaying off and leaves stopped untouched", () => {
  const playing = initial({ state: "playing", intendedPlaying: true });
  const paused = reducePlayback(playing, { type: "paused" });
  expect(paused.state).toBe("paused");
  expect(paused.intendedPlaying).toBe(false);

  const stopped = initial({ state: "stopped" });
  expect(reducePlayback(stopped, { type: "paused" }).state).toBe("stopped");
});

it("stopped rewinds to zero and clears a pending seek", () => {
  const state = reducePlayback(
    initial({ state: "playing", currentTime: 42, pendingSeekTime: 80 }),
    { type: "stopped" },
  );
  expect(state).toMatchObject({
    state: "stopped",
    currentTime: 0,
    pendingSeekTime: null,
  });
});

it("ended stops at the duration", () => {
  const state = reducePlayback(
    initial({ state: "playing", duration: 200, currentTime: 199.5 }),
    { type: "ended" },
  );
  expect(state.state).toBe("stopped");
  expect(state.currentTime).toBe(200);
});

it("a deferred seek surfaces its target as currentTime and seeking", () => {
  const state = reducePlayback(initial({ state: "playing", currentTime: 10 }), {
    type: "seekDeferred",
    time: 120,
  });
  const snapshot = snapshotOfPlayback(state);
  expect(snapshot.currentTime).toBe(120);
  expect(snapshot.seeking).toBe(true);
  expect(state.currentTime).toBe(10);
});

it("ticks are ignored while a deferred seek is pending", () => {
  const state = apply(
    initial({ state: "playing" }),
    { type: "seekDeferred", time: 120 },
    { type: "tick", time: 11 },
  );
  expect(snapshotOfPlayback(state).currentTime).toBe(120);
});

it("seekRecovered commits the pending target", () => {
  const state = apply(
    initial({ state: "playing", currentTime: 10 }),
    { type: "seekDeferred", time: 120 },
    { type: "seekRecovered" },
  );
  expect(state.currentTime).toBe(120);
  expect(state.pendingSeekTime).toBeNull();
  expect(snapshotOfPlayback(state).seeking).toBe(false);
});

it("ticks advance currentTime only while playing", () => {
  expect(
    reducePlayback(initial({ state: "playing" }), { type: "tick", time: 5 })
      .currentTime,
  ).toBe(5);
  expect(
    reducePlayback(initial({ state: "paused" }), { type: "tick", time: 5 })
      .currentTime,
  ).toBe(0);
});

it("durationChanged ignores non-finite and non-positive values", () => {
  expect(
    reducePlayback(initial(), {
      type: "durationChanged",
      duration: Number.POSITIVE_INFINITY,
    }).duration,
  ).toBe(0);
  expect(
    reducePlayback(initial(), { type: "durationChanged", duration: 0 })
      .duration,
  ).toBe(0);
  expect(
    reducePlayback(initial(), { type: "durationChanged", duration: 210 })
      .duration,
  ).toBe(210);
});

it("bufferEntered switches the mode, sets the resume offset, and clears pending seeks", () => {
  const state = apply(
    initial({ state: "playing", currentTime: 30 }),
    { type: "seekDeferred", time: 90 },
    { type: "bufferEntered", resumeOffset: 90 },
  );
  expect(state.mode).toBe("buffer");
  expect(state.currentTime).toBe(90);
  expect(state.pendingSeekTime).toBeNull();
  expect(snapshotOfPlayback(state).bufferReady).toBe(true);
});

it("failed freezes the engine in the error state", () => {
  const error = { kind: "playback" as const, message: "boom" };
  const failed = reducePlayback(initial({ state: "playing" }), {
    type: "failed",
    error,
  });
  expect(failed.state).toBe("error");
  expect(failed.error).toBe(error);
  // No event but closed can leave the error state.
  expect(reducePlayback(failed, { type: "playRequested" })).toBe(failed);
  expect(reducePlayback(failed, { type: "loaded" })).toBe(failed);
  expect(reducePlayback(failed, { type: "closed" }).closed).toBe(true);
});

it("a closed engine ignores every event", () => {
  const closed = reducePlayback(initial(), { type: "closed" });
  expect(reducePlayback(closed, { type: "playRequested" })).toBe(closed);
  expect(reducePlayback(closed, { type: "tick", time: 3 })).toBe(closed);
});

it("volumeChanged clamps into [0, 1]", () => {
  expect(
    reducePlayback(initial(), { type: "volumeChanged", volume: 1.5 }).volume,
  ).toBe(1);
  expect(
    reducePlayback(initial(), { type: "volumeChanged", volume: -0.5 }).volume,
  ).toBe(0);
});
