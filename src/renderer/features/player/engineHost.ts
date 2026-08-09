import { clampVolume } from "../audio/timeMath";
import type { AudioEngine, PlaybackSnapshot } from "../audio/types";

/**
 * React-free holder of the active audio engine
 * (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * `useSyncExternalStore` needs a stable `subscribe` identity, but the engine
 * is replaced on every track change. The host bridges that gap: components
 * subscribe to the host once, and the host re-wires itself to whichever
 * engine is current (notifying on swaps as well as on engine changes).
 *
 * The host also owns the app-level volume — the engine is the authority
 * only while it exists; the volume must survive between tracks and before
 * the first one.
 */

/** Snapshot shown when no engine exists (before the first playback). */
const idleSnapshot = (volume: number): PlaybackSnapshot => ({
  state: "stopped",
  currentTime: 0,
  duration: 0,
  volume,
  seeking: false,
  bufferReady: false,
  error: null,
});

/** Host handle; see module docs. */
export type EngineHost = {
  /** Swap in the next engine (or `null`); the previous one is closed. */
  readonly set: (engine: AudioEngine | null) => void;
  readonly get: () => AudioEngine | null;
  /** App-level volume: applied to the active engine and kept for the next. */
  readonly setVolume: (volume: number) => void;
  readonly getVolume: () => number;
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => PlaybackSnapshot;
};

/**
 * Create an engine host.
 *
 * @param initialVolume - Volume before the first engine exists.
 * @returns The host.
 */
export const createEngineHost = (initialVolume = 1): EngineHost => {
  const listeners = new Set<() => void>();
  let engine: AudioEngine | null = null;
  let detachEngine: (() => void) | null = null;
  let volume = clampVolume(initialVolume);
  let idle = idleSnapshot(volume);

  const notify = (): void => {
    for (const listener of [...listeners]) {
      listener();
    }
  };

  return {
    set: (next) => {
      detachEngine?.();
      detachEngine = null;
      engine?.close();
      engine = next;
      if (next !== null) {
        detachEngine = next.subscribe(notify);
      }

      notify();
    },
    get: () => engine,
    setVolume: (nextVolume) => {
      volume = clampVolume(nextVolume);
      idle = idleSnapshot(volume);
      if (engine !== null) {
        engine.setVolume(volume);
      } else {
        notify();
      }
    },
    getVolume: () => volume,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => engine?.getSnapshot() ?? idle,
  };
};
