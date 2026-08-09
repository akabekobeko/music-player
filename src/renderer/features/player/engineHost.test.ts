import { expect, it, vi } from "vitest";
import type { AudioEngine, PlaybackSnapshot } from "../audio/types";
import { createEngineHost } from "./engineHost";

const snapshot = (patch: Partial<PlaybackSnapshot> = {}): PlaybackSnapshot => ({
  state: "playing",
  currentTime: 1,
  duration: 100,
  volume: 1,
  seeking: false,
  bufferReady: false,
  error: null,
  ...patch,
});

/** Minimal fake engine capturing calls and exposing its own listeners. */
const createFakeEngine = (initial: PlaybackSnapshot = snapshot()) => {
  const listeners = new Set<() => void>();
  let current = initial;
  return {
    engine: {
      play: vi.fn(async () => {}),
      pause: vi.fn(),
      stop: vi.fn(),
      seek: vi.fn(),
      setVolume: vi.fn(),
      close: vi.fn(),
      getSnapshot: () => current,
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSpectrums: () => null,
    } satisfies AudioEngine,
    emit: (next: PlaybackSnapshot) => {
      current = next;
      for (const listener of [...listeners]) {
        listener();
      }
    },
    listenerCount: () => listeners.size,
  };
};

it("returns the idle snapshot before any engine exists", () => {
  const host = createEngineHost(0.7);
  expect(host.getSnapshot()).toMatchObject({
    state: "stopped",
    volume: 0.7,
  });
  expect(host.getSnapshot()).toBe(host.getSnapshot());
});

it("proxies the active engine's snapshot", () => {
  const host = createEngineHost();
  const { engine } = createFakeEngine(snapshot({ currentTime: 42 }));
  host.set(engine);
  expect(host.getSnapshot().currentTime).toBe(42);
});

it("notifies host subscribers on engine swap and on engine changes", () => {
  const host = createEngineHost();
  const listener = vi.fn();
  host.subscribe(listener);

  const first = createFakeEngine();
  host.set(first.engine);
  expect(listener).toHaveBeenCalledTimes(1);

  first.emit(snapshot({ currentTime: 5 }));
  expect(listener).toHaveBeenCalledTimes(2);
});

it("closes and detaches the previous engine on swap", () => {
  const host = createEngineHost();
  const first = createFakeEngine();
  const second = createFakeEngine();
  host.set(first.engine);
  host.set(second.engine);

  expect(first.engine.close).toHaveBeenCalledTimes(1);
  expect(first.listenerCount()).toBe(0);

  // Events from the abandoned engine no longer reach host subscribers.
  const listener = vi.fn();
  host.subscribe(listener);
  first.emit(snapshot());
  expect(listener).not.toHaveBeenCalled();
});

it("applies the volume to the active engine and keeps it for the next", () => {
  const host = createEngineHost();
  const first = createFakeEngine();
  host.set(first.engine);
  host.setVolume(0.3);
  expect(first.engine.setVolume).toHaveBeenCalledWith(0.3);
  expect(host.getVolume()).toBe(0.3);
});

it("reflects a volume change in the idle snapshot and notifies", () => {
  const host = createEngineHost();
  const listener = vi.fn();
  host.subscribe(listener);
  host.setVolume(0.5);
  expect(host.getSnapshot().volume).toBe(0.5);
  expect(listener).toHaveBeenCalledTimes(1);
});

it("set(null) closes the current engine and falls back to idle", () => {
  const host = createEngineHost();
  const { engine } = createFakeEngine();
  host.set(engine);
  host.set(null);
  expect(engine.close).toHaveBeenCalledTimes(1);
  expect(host.getSnapshot().state).toBe("stopped");
});
