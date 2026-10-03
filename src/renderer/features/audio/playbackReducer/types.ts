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

/** Engine-internal state (superset of the published snapshot). */
export type InternalPlayback = {
  /**
   * Lifecycle state as published. A new engine starts in `loading`;
   * `error` is terminal (only `closed` is accepted afterwards).
   */
  readonly state: PlaybackState;
  /**
   * Whether the user wants playback running. Survives `loading` and
   * in-flight seeks so the engine knows what to do when data arrives.
   */
  readonly intendedPlaying: boolean;
  /** Actual position in seconds (not the in-flight seek target). */
  readonly currentTime: number;
  /**
   * Duration in seconds; `0` until `durationChanged` reports a finite
   * positive value (other values are ignored).
   */
  readonly duration: number;
  /** User volume, clamped to `[0, 1]` by the reducer. */
  readonly volume: number;
  /**
   * Target of the seek the media element is still working on; non-null
   * exactly while `seeking` is shown.
   */
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
  | { readonly type: "seekStarted"; readonly time: number } // currentTime set
  | { readonly type: "seekFinished" } // media element `seeked`
  | { readonly type: "tick"; readonly time: number }
  | { readonly type: "durationChanged"; readonly duration: number }
  | { readonly type: "ended" }
  | { readonly type: "failed"; readonly error: PlaybackError }
  | { readonly type: "volumeChanged"; readonly volume: number }
  | { readonly type: "closed" };
