import { clampVolume } from "./timeMath";
import type { PlaybackError, PlaybackSnapshot, PlaybackState } from "./types";

/**
 * Pure state core of the audio engine
 * (`docs/specs/v1.0/renderer/audio-engine.md`): every observable change is
 * an event through {@link reducePlayback}, and the published snapshot is a
 * projection ({@link snapshotOfPlayback}) of the internal state. The
 * imperative shell (`createAudioEngine`) owns only side effects.
 */

/** Which playback pipeline is active. */
export type PlaybackMode = "streaming" | "buffer";

/** Engine-internal state (superset of the published snapshot). */
export type InternalPlayback = {
  readonly mode: PlaybackMode;
  readonly state: PlaybackState;
  /**
   * Whether the user wants playback running. Survives `loading` and
   * deferred seeks so the engine knows what to do when data arrives.
   */
  readonly intendedPlaying: boolean;
  /** Actual position in seconds (not the deferred-seek target). */
  readonly currentTime: number;
  readonly duration: number;
  readonly volume: number;
  /** Deferred-seek target; non-null exactly while `seeking` is shown. */
  readonly pendingSeekTime: number | null;
  readonly error: PlaybackError | null;
  readonly closed: boolean;
};

/** Everything that can happen to the playback state. */
export type PlaybackEvent =
  | { readonly type: "loaded" } // canplay — streaming is ready
  | { readonly type: "playRequested" }
  | { readonly type: "playStarted" }
  | { readonly type: "paused" }
  | { readonly type: "stopped" }
  | { readonly type: "seeked"; readonly time: number }
  | { readonly type: "seekDeferred"; readonly time: number }
  | { readonly type: "seekRecovered" }
  | { readonly type: "tick"; readonly time: number }
  | { readonly type: "durationChanged"; readonly duration: number }
  | { readonly type: "bufferEntered"; readonly resumeOffset: number }
  | { readonly type: "ended" }
  | { readonly type: "failed"; readonly error: PlaybackError }
  | { readonly type: "volumeChanged"; readonly volume: number }
  | { readonly type: "closed" };

/**
 * Build the state an engine starts in (`state: "loading"` from the first
 * synchronous snapshot — the factory never returns a Promise).
 *
 * @param volume - Initial volume handed over by PlayerProvider.
 * @returns The initial internal state.
 */
export const createInitialPlayback = (volume: number): InternalPlayback => ({
  mode: "streaming",
  state: "loading",
  intendedPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: clampVolume(volume),
  pendingSeekTime: null,
  error: null,
  closed: false,
});

/**
 * Advance the internal state by one event.
 *
 * Total and pure: unknown combinations return the input unchanged (same
 * reference) so the shell can cheaply detect "nothing happened". A closed
 * engine is frozen — no event can revive it. An engine in `error` only
 * reacts to `closed` (playback never silently resumes after a failure).
 *
 * @param internal - Current internal state.
 * @param event - The event to apply.
 * @returns The next internal state, or `internal` when nothing changed.
 */
export const reducePlayback = (
  internal: InternalPlayback,
  event: PlaybackEvent,
): InternalPlayback => {
  if (internal.closed) {
    return internal;
  }

  if (event.type === "closed") {
    return { ...internal, closed: true };
  }

  if (internal.state === "error") {
    return internal;
  }

  switch (event.type) {
    case "loaded":
      return internal.state === "loading"
        ? {
            ...internal,
            state: internal.intendedPlaying ? "playing" : "paused",
          }
        : internal;
    case "playRequested":
      return {
        ...internal,
        intendedPlaying: true,
        state:
          internal.state === "paused" || internal.state === "stopped"
            ? "playing"
            : internal.state,
      };
    case "playStarted":
      return internal.state === "playing"
        ? internal
        : { ...internal, state: "playing", intendedPlaying: true };
    case "paused":
      return {
        ...internal,
        intendedPlaying: false,
        state:
          internal.state === "playing" || internal.state === "loading"
            ? "paused"
            : internal.state,
      };
    case "stopped":
      return {
        ...internal,
        intendedPlaying: false,
        state: "stopped",
        currentTime: 0,
        pendingSeekTime: null,
      };
    case "ended":
      return {
        ...internal,
        intendedPlaying: false,
        state: "stopped",
        currentTime: internal.duration,
        pendingSeekTime: null,
      };
    case "seeked":
      return {
        ...internal,
        currentTime: Math.max(0, event.time),
        pendingSeekTime: null,
      };
    case "seekDeferred":
      return { ...internal, pendingSeekTime: Math.max(0, event.time) };
    case "seekRecovered":
      return internal.pendingSeekTime === null
        ? internal
        : {
            ...internal,
            currentTime: internal.pendingSeekTime,
            pendingSeekTime: null,
          };
    case "tick":
      // A deferred seek owns the displayed position until it resolves.
      return internal.pendingSeekTime !== null || internal.state !== "playing"
        ? internal
        : { ...internal, currentTime: Math.max(0, event.time) };
    case "durationChanged":
      return Number.isFinite(event.duration) && event.duration > 0
        ? { ...internal, duration: event.duration }
        : internal;
    case "bufferEntered":
      return {
        ...internal,
        mode: "buffer",
        currentTime: Math.max(0, event.resumeOffset),
        pendingSeekTime: null,
      };
    case "failed":
      return {
        ...internal,
        state: "error",
        error: event.error,
        intendedPlaying: false,
        pendingSeekTime: null,
      };
    case "volumeChanged":
      return { ...internal, volume: clampVolume(event.volume) };
    default:
      return internal;
  }
};

/**
 * Project the internal state onto the published snapshot.
 *
 * @param internal - Internal state.
 * @returns The UI-facing snapshot (deferred seeks surface their target as
 *   `currentTime`, so the UI never shows a rewind).
 */
export const snapshotOfPlayback = (
  internal: InternalPlayback,
): PlaybackSnapshot => ({
  state: internal.state,
  currentTime: internal.pendingSeekTime ?? internal.currentTime,
  duration: internal.duration,
  volume: internal.volume,
  seeking: internal.pendingSeekTime !== null,
  bufferReady: internal.mode === "buffer",
  error: internal.error,
});

/**
 * Field-wise equality of two snapshots (error compared by reference).
 *
 * @param a - One snapshot.
 * @param b - Another snapshot.
 * @returns `true` when nothing observable differs.
 */
export const playbackSnapshotsEqual = (
  a: PlaybackSnapshot,
  b: PlaybackSnapshot,
): boolean =>
  a.state === b.state &&
  a.currentTime === b.currentTime &&
  a.duration === b.duration &&
  a.volume === b.volume &&
  a.seeking === b.seeking &&
  a.bufferReady === b.bufferReady &&
  a.error === b.error;
