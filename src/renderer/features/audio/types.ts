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
  /**
   * Human-readable detail: the thrown `Error.message`, or the media
   * element's error message (falling back to a text naming its code).
   */
  readonly message: string;
};

/**
 * Immutable snapshot of the playback state.
 *
 * Replaced (never mutated) on every observable change so
 * `useSyncExternalStore` re-renders exactly when something changed.
 */
export type PlaybackSnapshot = {
  /**
   * Lifecycle state. A new engine starts in `loading`; `error` is terminal
   * (playback never resumes after a failure). The engine host reports
   * `stopped` while no engine exists.
   */
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
  /** Failure detail while `state` is `error`; `null` otherwise. */
  readonly error: PlaybackError | null;
};

/** Engine handle returned by `createAudioEngine`. */
export type AudioEngine = {
  /**
   * Start or resume playback from the held position. Resolves once the
   * request settled; failures land in `snapshot.error`, never as a
   * rejection. A no-op after `close()` or in `error`.
   */
  readonly play: () => Promise<void>;
  /** Pause, keeping the position. A no-op after `close()` or in `error`. */
  readonly pause: () => void;
  /** Rewind to the start and stop. */
  readonly stop: () => void;
  /**
   * Seek to a position in seconds (negative values clamp to `0`). Immediate
   * in buffer mode or inside the buffered ranges; otherwise deferred
   * (`seeking` turns on, output is muted) until the data arrives.
   */
  readonly seek: (timeSec: number) => void;
  /** Set the user volume (`[0, 1]`). */
  readonly setVolume: (volume: number) => void;
  /** Release everything up to `AudioContext.close`; calls become no-ops. */
  readonly close: () => void;
  /** Current snapshot; the same reference until an observable change. */
  readonly getSnapshot: () => PlaybackSnapshot;
  /**
   * Register a change listener; returns the unsubscribe function (a no-op
   * after `close()`).
   */
  readonly subscribe: (listener: () => void) => () => void;
  /** High-frequency spectrum read for rAF consumers; bypasses the snapshot. */
  readonly getSpectrums: () => Uint8Array | null;
};
