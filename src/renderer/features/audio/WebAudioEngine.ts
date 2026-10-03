import { clampVolume } from "./clampVolume";
import { createInitialPlayback } from "./playbackReducer/createInitialPlayback";
import { playbackSnapshotsEqual } from "./playbackReducer/playbackSnapshotsEqual";
import { reducePlayback } from "./playbackReducer/reducePlayback";
import { snapshotOfPlayback } from "./playbackReducer/snapshotOfPlayback";
import type { InternalPlayback, PlaybackEvent } from "./playbackReducer/types";
import type { PlaybackSnapshot } from "./types";

/** Interval of the position timer (also the `currentTime` throttle). */
const TICK_INTERVAL_MS = 250;

/**
 * Audio engine for one source URL
 * (`docs/specs/v1.0/renderer/audio-engine.md`).
 *
 * Architecture: the *state* lives in a pure reducer
 * (`playbackReducer.ts`) — every observable change flows through
 * {@link WebAudioEngine.#dispatch} as an event, and the published snapshot
 * is a projection of the reducer state. This class owns only the
 * side-effectful resources (AudioContext, node graph, media element),
 * declared once as private fields below so the full mutable surface is
 * visible in one place.
 *
 * Playback strategy: streaming only. `HTMLAudioElement` reads the
 * `media-stream://` URL with Range requests and seeks go straight to
 * `currentTime`; Chromium fetches the missing byte range on demand. The
 * earlier hybrid design (background `decodeAudioData` + migration to an
 * `AudioBufferSourceNode`) worked around a seek failure in older Electron
 * builds that no longer reproduces, and its CPU / memory cost caused
 * dropouts on slow machines.
 */
export class WebAudioEngine {
  // ---- Pure state core -------------------------------------------------
  #internal: InternalPlayback;
  #snapshot: PlaybackSnapshot;
  readonly #listeners = new Set<() => void>();

  // ---- Node graph (fixed at construction; EQ slot reserved for v1.x) ----
  // source → effectInput → effectOutput → analyser → gain → out
  readonly #context: AudioContext;
  readonly #effectInput: GainNode;
  readonly #analyser: AnalyserNode;
  readonly #gain: GainNode;

  // ---- Streaming pipeline (null after close) ----------------------------
  #audio: HTMLAudioElement | null = null;
  #mediaSource: MediaElementAudioSourceNode | null = null;

  // ---- Misc --------------------------------------------------------------
  #spectrums: Uint8Array<ArrayBuffer> | null = null;
  readonly #timer: ReturnType<typeof setInterval>;

  /**
   * Create the engine and start loading immediately.
   *
   * Synchronous: the first snapshot (`state: "loading"`) is available right
   * away and open failures surface later through `snapshot.error` — the
   * constructor never throws for source problems.
   *
   * @param url - `media-stream://` URL of the audio file.
   * @param options.volume - Initial volume (`[0, 1]`) from app state.
   */
  constructor(url: string, options: { readonly volume?: number } = {}) {
    this.#internal = createInitialPlayback(options.volume ?? 1);
    this.#snapshot = snapshotOfPlayback(this.#internal);

    this.#context = new AudioContext();
    this.#effectInput = this.#context.createGain();
    const effectOutput = this.#context.createGain();
    this.#analyser = this.#context.createAnalyser();
    this.#analyser.fftSize = 64;
    this.#gain = this.#context.createGain();
    this.#gain.gain.value = clampVolume(options.volume ?? 1);
    this.#effectInput.connect(effectOutput);
    effectOutput.connect(this.#analyser);
    this.#analyser.connect(this.#gain);
    this.#gain.connect(this.#context.destination);

    this.#attachStreaming(url);

    this.#timer = setInterval(() => {
      if (!this.#internal.closed && this.#internal.state === "playing") {
        this.#dispatch({ type: "tick", time: this.#audio?.currentTime ?? 0 });
      }
    }, TICK_INTERVAL_MS);
  }

  // ---- Public API (the AudioEngine contract) -----------------------------

  /** Start or resume playback. Failures land in `snapshot.error`. */
  async play(): Promise<void> {
    if (this.#internal.closed || this.#internal.state === "error") {
      return;
    }

    this.#dispatch({ type: "playRequested" });
    try {
      await this.#context.resume();
      if (this.#audio !== null) {
        await this.#audio.play();
      }

      if (!this.#internal.closed) {
        this.#dispatch({ type: "playStarted" });
      }
    } catch (error) {
      if (!this.#internal.closed) {
        this.#dispatch({
          type: "failed",
          error: {
            kind: this.#internal.state === "loading" ? "open" : "playback",
            message: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }
  }

  /** Pause, keeping the position. */
  pause(): void {
    if (this.#internal.closed || this.#internal.state === "error") {
      return;
    }

    this.#audio?.pause();
    this.#dispatch({ type: "paused" });
  }

  /** Rewind to the start and stop. */
  stop(): void {
    if (this.#internal.closed || this.#internal.state === "error") {
      return;
    }

    if (this.#audio !== null) {
      this.#audio.pause();
      try {
        this.#audio.currentTime = 0;
      } catch {
        // Not seekable yet (still loading) — position resets on load.
      }
    }

    this.#dispatch({ type: "stopped" });
  }

  /**
   * Seek to a position in seconds.
   *
   * The target is handed to the media element as-is; `seeking` stays on in
   * the snapshot (and the target is shown as `currentTime`) until the
   * element reports `seeked`, which may take a moment when the range has to
   * be fetched first.
   */
  seek(timeSec: number): void {
    if (this.#internal.closed || this.#internal.state === "error") {
      return;
    }

    if (this.#audio === null) {
      return;
    }

    const target = Math.max(0, timeSec);
    this.#dispatch({ type: "seekStarted", time: target });
    this.#audio.currentTime = target;
  }

  /** Set the user volume (`[0, 1]`). */
  setVolume(volume: number): void {
    if (this.#internal.closed) {
      return;
    }

    this.#gain.gain.value = clampVolume(volume);
    this.#dispatch({ type: "volumeChanged", volume });
  }

  /** Release every resource; all further calls become no-ops. */
  close(): void {
    if (this.#internal.closed) {
      return;
    }

    this.#dispatch({ type: "closed" });
    clearInterval(this.#timer);
    this.#teardownStreaming();
    this.#listeners.clear();
    void this.#context.close();
  }

  /** Current immutable snapshot (same reference while nothing changed). */
  getSnapshot(): PlaybackSnapshot {
    return this.#snapshot;
  }

  /**
   * Register a change listener.
   *
   * @returns Unsubscribe function (no-op after `close()`).
   */
  subscribe(listener: () => void): () => void {
    if (this.#internal.closed) {
      return () => {};
    }

    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  /** High-frequency spectrum read (rAF consumers); bypasses the snapshot. */
  getSpectrums(): Uint8Array | null {
    if (this.#internal.closed) {
      return null;
    }

    if (this.#spectrums === null) {
      this.#spectrums = new Uint8Array(this.#analyser.frequencyBinCount);
    }

    this.#analyser.getByteFrequencyData(this.#spectrums);
    return this.#spectrums;
  }

  // ---- State core --------------------------------------------------------

  /** Run one event through the reducer and notify when the snapshot moved. */
  #dispatch(event: PlaybackEvent): void {
    const next = reducePlayback(this.#internal, event);
    if (next === this.#internal) {
      return;
    }

    this.#internal = next;
    const nextSnapshot = snapshotOfPlayback(next);
    if (!playbackSnapshotsEqual(this.#snapshot, nextSnapshot)) {
      this.#snapshot = nextSnapshot;
      for (const listener of [...this.#listeners]) {
        listener();
      }
    }
  }

  // ---- Streaming pipeline -------------------------------------------------

  /** Wire the `HTMLAudioElement` and its event listeners. */
  #attachStreaming(url: string): void {
    const element = new Audio();
    element.preload = "auto";
    // media-stream:// is cross-origin from the app origin. Anonymous CORS
    // (paired with Access-Control-Allow-Origin on the protocol responses)
    // is required twice over: a tainted source plays silence through the
    // MediaElementAudioSourceNode, and without CORS mode Chromium's media
    // stack compares the data origin of every Range response with the first
    // one — a non-standard scheme yields a fresh opaque origin each time, so
    // the first out-of-buffer seek fails with PIPELINE_ERROR_READ (the
    // audio-player era bug behind electron/electron#38749).
    element.crossOrigin = "anonymous";
    element.oncanplay = () => {
      this.#dispatch({ type: "loaded" });
    };
    element.ondurationchange = () => {
      this.#dispatch({ type: "durationChanged", duration: element.duration });
    };
    element.onseeked = () => {
      this.#dispatch({ type: "seekFinished" });
    };
    element.onended = () => {
      this.#dispatch({ type: "ended" });
    };
    element.onerror = () => {
      this.#dispatch({
        type: "failed",
        error: {
          kind: this.#internal.state === "loading" ? "open" : "playback",
          message:
            element.error?.message !== undefined && element.error.message !== ""
              ? element.error.message
              : `Failed to open the audio source (code ${element.error?.code ?? "?"})`,
        },
      });
    };
    element.src = url;
    this.#audio = element;
    this.#mediaSource = this.#context.createMediaElementSource(element);
    this.#mediaSource.connect(this.#effectInput);
  }

  /** Streaming teardown for close (spec order). */
  #teardownStreaming(): void {
    const element = this.#audio;
    if (element === null) {
      return;
    }

    this.#audio = null;
    element.pause();
    element.oncanplay = null;
    element.ondurationchange = null;
    element.onseeked = null;
    element.onended = null;
    element.onerror = null;
    this.#mediaSource?.disconnect();
    this.#mediaSource = null;
    element.removeAttribute("src");
    element.load();
  }
}
