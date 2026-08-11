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
