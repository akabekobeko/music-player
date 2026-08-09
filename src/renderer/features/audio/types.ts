/**
 * Public surface of the audio engine
 * (`docs/specs/v1.0/renderer/audio-engine.md`).
 *
 * The engine knows exactly one source URL. Queue, next/previous track, and
 * track metadata are PlayerProvider's business; switching tracks means
 * `close()` on the old engine and `createAudioEngine` for the new one.
 */

/** Lifecycle state exposed to the UI. */
export type PlaybackState =
  | "loading"
  | "playing"
  | "paused"
  | "stopped"
  | "error";

/** Error surfaced through the snapshot — never only `console.error`. */
export type PlaybackError = {
  /** Which stage failed: opening the source, decoding, or playback. */
  readonly kind: "open" | "decode" | "playback";
  readonly message: string;
};

/**
 * Immutable snapshot of the playback state.
 *
 * Replaced (never mutated) on every observable change so
 * `useSyncExternalStore` re-renders exactly when something changed.
 */
export type PlaybackSnapshot = {
  readonly state: PlaybackState;
  /** Playback position in seconds. During a deferred seek: the target. */
  readonly currentTime: number;
  /** Duration in seconds; `0` means not yet known. */
  readonly duration: number;
  /** User volume in `[0, 1]`. */
  readonly volume: number;
  /** A deferred seek is waiting for data (UI shows a spinner / pulse). */
  readonly seeking: boolean;
  /** Whether playback has switched to buffer mode (seek is then free). */
  readonly bufferReady: boolean;
  readonly error: PlaybackError | null;
};

/** Engine handle returned by `createAudioEngine`. */
export type AudioEngine = {
  readonly play: () => Promise<void>;
  readonly pause: () => void;
  /** Rewind to the start and stop. */
  readonly stop: () => void;
  readonly seek: (timeSec: number) => void;
  /** Set the user volume (`[0, 1]`). */
  readonly setVolume: (volume: number) => void;
  /** Release everything up to `AudioContext.close`; calls become no-ops. */
  readonly close: () => void;
  readonly getSnapshot: () => PlaybackSnapshot;
  readonly subscribe: (listener: () => void) => () => void;
  /** High-frequency spectrum read for rAF consumers; bypasses the snapshot. */
  readonly getSpectrums: () => Uint8Array | null;
};
