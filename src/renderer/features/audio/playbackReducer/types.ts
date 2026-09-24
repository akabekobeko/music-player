import type { PlaybackError, PlaybackState } from "../types";

/**
 * Pure state core of the audio engine
 * (`docs/specs/v1.0/renderer/audio-engine.md`): every observable change is
 * an event through {@link import("./reducePlayback").reducePlayback}, and
 * the published snapshot is a projection
 * ({@link import("./snapshotOfPlayback").snapshotOfPlayback}) of the
 * internal state. The imperative shell (`createAudioEngine`) owns only side
 * effects.
 */

/** Which playback pipeline is active. */
export type PlaybackMode = "streaming" | "buffer";

/** Engine-internal state (superset of the published snapshot). */
export type InternalPlayback = {
  /**
   * Active pipeline. Starts as `streaming`; `bufferEntered` switches it to
   * `buffer` once the background decode finished, and it never goes back.
   */
  readonly mode: PlaybackMode;
  /**
   * Lifecycle state as published. A new engine starts in `loading`;
   * `error` is terminal (only `closed` is accepted afterwards).
   */
  readonly state: PlaybackState;
  /**
   * Whether the user wants playback running. Survives `loading` and
   * deferred seeks so the engine knows what to do when data arrives.
   */
  readonly intendedPlaying: boolean;
  /** Actual position in seconds (not the deferred-seek target). */
  readonly currentTime: number;
  /**
   * Duration in seconds; `0` until `durationChanged` reports a finite
   * positive value (other values are ignored).
   */
  readonly duration: number;
  /** User volume, clamped to `[0, 1]` by the reducer. */
  readonly volume: number;
  /** Deferred-seek target; non-null exactly while `seeking` is shown. */
  readonly pendingSeekTime: number | null;
  /** The failure that moved `state` to `error`; `null` otherwise. */
  readonly error: PlaybackError | null;
  /**
   * Set by the `closed` event. A closed state is frozen: every further
   * event returns the input unchanged.
   */
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
