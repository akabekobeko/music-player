import {
  createInitialPlayback,
  type InternalPlayback,
  type PlaybackEvent,
  playbackSnapshotsEqual,
  reducePlayback,
  snapshotOfPlayback,
} from "./playbackReducer";
import { clampResumeOffset, clampVolume, isTimeBuffered } from "./timeMath";
import type { AudioEngine, PlaybackSnapshot } from "./types";

/** Interval of the position timer (also the `currentTime` throttle). */
const TICK_INTERVAL_MS = 250;

/** Margin distinguishing a natural buffer-mode `ended` from a manual stop. */
const ENDED_EPSILON_SEC = 0.01;

/**
 * Audio engine for one source URL
 * (`docs/specs/v1.0/renderer/audio-engine.md`).
 *
 * Architecture: the *state* lives in a pure reducer
 * (`playbackReducer.ts`) — every observable change flows through
 * {@link WebAudioEngine.#dispatch} as an event, and the published snapshot
 * is a projection of the reducer state. This class owns only the
 * side-effectful resources (AudioContext, node graph, media element,
 * buffer source), declared once as private fields below so the full
 * mutable surface is visible in one place.
 *
 * Playback strategy (inherited from audio-player's AudioPlayer3):
 * - streaming mode starts immediately via `HTMLAudioElement`;
 * - the same URL is fetched + decoded in the background, and playback
 *   transparently migrates to an `AudioBufferSourceNode` (free seeking);
 * - out-of-buffer seeks while streaming are deferred: the target is
 *   remembered, output muted, and the seek resolves on `progress` growth
 *   or decode completion — whichever is first.
 *
 * Not inherited from AudioPlayer3: getter live-views (reads go through the
 * immutable snapshot), missing error notification (all failures land in
 * `snapshot.error`), and the undetected streaming `ended`.
 */
export class WebAudioEngine {
  // ---- Pure state core -------------------------------------------------
  #internal: InternalPlayback;
  #snapshot: PlaybackSnapshot;
  readonly #listeners = new Set<() => void>();

  // ---- Node graph (fixed at construction; EQ slot reserved for v1.x) ----
  // source → effectInput → effectOutput → analyser → gain → mute → out
  readonly #context: AudioContext;
  readonly #effectInput: GainNode;
  readonly #analyser: AnalyserNode;
  readonly #gain: GainNode;
  readonly #mute: GainNode;

  // ---- Streaming pipeline (null after migration / close) ----------------
  #audio: HTMLAudioElement | null = null;
  #mediaSource: MediaElementAudioSourceNode | null = null;

  // ---- Buffer pipeline (audioBuffer non-null = buffer mode available) ---
  #audioBuffer: AudioBuffer | null = null;
  #bufferSource: AudioBufferSourceNode | null = null;
  /** `AudioContext.currentTime` at the moment the current source started. */
  #bufferStartContextTime = 0;
  /** Buffer offset the current source started at. */
  #bufferStartOffset = 0;
  /** Position held while buffer-mode playback is not running. */
  #bufferHeldAt = 0;

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
    this.#mute = this.#context.createGain();
    this.#effectInput.connect(effectOutput);
    effectOutput.connect(this.#analyser);
    this.#analyser.connect(this.#gain);
    this.#gain.connect(this.#mute);
    this.#mute.connect(this.#context.destination);

    this.#attachStreaming(url);
    void this.#decodeInBackground(url);

    this.#timer = setInterval(() => {
      if (!this.#internal.closed && this.#internal.state === "playing") {
        this.#dispatch({ type: "tick", time: this.#position() });
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
    if (this.#internal.mode === "buffer") {
      this.#startBufferSource(this.#bufferHeldAt);
      this.#dispatch({ type: "playStarted" });
      return;
    }

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

    if (this.#internal.mode === "buffer") {
      this.#bufferHeldAt = this.#position();
      this.#stopBufferSource();
    } else {
      this.#audio?.pause();
    }

    this.#dispatch({ type: "paused" });
  }

  /** Rewind to the start and stop. */
  stop(): void {
    if (this.#internal.closed || this.#internal.state === "error") {
      return;
    }

    if (this.#internal.mode === "buffer") {
      this.#stopBufferSource();
      this.#bufferHeldAt = 0;
    } else if (this.#audio !== null) {
      this.#audio.pause();
      try {
        this.#audio.currentTime = 0;
      } catch {
        // Not seekable yet (still loading) — position resets on load.
      }
    }

    this.#mute.gain.value = 1;
    this.#dispatch({ type: "stopped" });
  }

  /**
   * Seek to a position in seconds.
   *
   * Buffer mode seeks freely. Streaming mode seeks immediately inside the
   * buffered ranges and defers otherwise (mute + wait for data).
   */
  seek(timeSec: number): void {
    if (this.#internal.closed || this.#internal.state === "error") {
      return;
    }

    const target = Math.max(0, timeSec);
    if (this.#internal.mode === "buffer") {
      const clamped = clampResumeOffset(
        target,
        this.#audioBuffer?.duration ?? 0,
      );
      if (this.#internal.state === "playing") {
        this.#startBufferSource(clamped);
      } else {
        this.#bufferHeldAt = clamped;
      }

      this.#dispatch({ type: "seeked", time: clamped });
      return;
    }

    if (this.#audio === null) {
      return;
    }

    if (isTimeBuffered(this.#audio.buffered, target)) {
      this.#audio.currentTime = target;
      this.#dispatch({ type: "seeked", time: target });
      return;
    }

    // Deferred seek: silence output, remember the target, and let progress
    // growth or decode completion pick it up.
    this.#mute.gain.value = 0;
    this.#dispatch({ type: "seekDeferred", time: target });
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
    this.#stopBufferSource();
    this.#teardownStreaming();
    this.#audioBuffer = null;
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

  /** Actual playback position in seconds, mode-aware. */
  #position(): number {
    if (this.#internal.mode === "buffer") {
      return this.#bufferSource !== null
        ? this.#context.currentTime -
            this.#bufferStartContextTime +
            this.#bufferStartOffset
        : this.#bufferHeldAt;
    }

    return this.#audio?.currentTime ?? 0;
  }

  // ---- Streaming pipeline -------------------------------------------------

  /** Wire the `HTMLAudioElement` and its event listeners. */
  #attachStreaming(url: string): void {
    const element = new Audio();
    element.preload = "auto";
    // media-stream:// is cross-origin from the app origin. Anonymous CORS
    // (paired with Access-Control-Allow-Origin on the protocol responses)
    // keeps the MediaElementAudioSourceNode untainted — a tainted source
    // plays silence through Web Audio.
    element.crossOrigin = "anonymous";
    element.oncanplay = () => {
      this.#dispatch({ type: "loaded" });
    };
    element.ondurationchange = () => {
      this.#dispatch({ type: "durationChanged", duration: element.duration });
    };
    element.onended = () => {
      // Streaming natural end — audio-player only detected the buffer-mode
      // one, so tracks ending before decode never advanced the queue.
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
    element.onprogress = () => {
      // Deferred-seek recovery path 1: the buffered range grew far enough.
      const pending = this.#internal.pendingSeekTime;
      if (pending !== null && isTimeBuffered(element.buffered, pending)) {
        element.currentTime = pending;
        this.#mute.gain.value = 1;
        this.#dispatch({ type: "seekRecovered" });
      }
    };
    element.src = url;
    this.#audio = element;
    this.#mediaSource = this.#context.createMediaElementSource(element);
    this.#mediaSource.connect(this.#effectInput);
  }

  /** Streaming teardown for mode migration and close (spec order). */
  #teardownStreaming(): void {
    const element = this.#audio;
    if (element === null) {
      return;
    }

    this.#audio = null;
    element.pause();
    element.oncanplay = null;
    element.ondurationchange = null;
    element.onended = null;
    element.onerror = null;
    element.onprogress = null;
    this.#mediaSource?.disconnect();
    this.#mediaSource = null;
    element.removeAttribute("src");
    element.load();
  }

  // ---- Buffer pipeline -----------------------------------------------------

  /** Fetch + decode the same URL; on success migrate to buffer mode. */
  async #decodeInBackground(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (this.#internal.closed) {
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.arrayBuffer();
      if (this.#internal.closed) {
        return;
      }

      const decoded = await this.#context.decodeAudioData(data);
      if (this.#internal.closed) {
        return;
      }

      this.#audioBuffer = decoded;
      this.#enterBufferMode();
    } catch (error) {
      if (this.#internal.closed) {
        return;
      }

      if (this.#internal.pendingSeekTime !== null) {
        // The deferred seek was waiting for this decode; without it (and
        // with progress unable to reach the target) it may never resolve.
        this.#dispatch({
          type: "failed",
          error: {
            kind: "decode",
            message: error instanceof Error ? error.message : String(error),
          },
        });
      } else {
        // Plain degrade: streaming keeps playing, seeks stay range-bound.
        console.warn("[audio] decode failed; staying in streaming mode", error);
      }
    }
  }

  /** Migrate to buffer mode, carrying position / play state / volume over. */
  #enterBufferMode(): void {
    if (this.#audioBuffer === null || this.#internal.mode === "buffer") {
      return;
    }

    const resume = clampResumeOffset(
      this.#internal.pendingSeekTime ?? this.#position(),
      this.#audioBuffer.duration,
    );
    const keepPlaying = this.#internal.state === "playing";
    this.#teardownStreaming();
    this.#mute.gain.value = 1; // A deferred seek resolves here — unmute.
    this.#dispatch({
      type: "durationChanged",
      duration: this.#audioBuffer.duration,
    });
    this.#dispatch({ type: "bufferEntered", resumeOffset: resume });
    if (keepPlaying) {
      this.#startBufferSource(resume);
    } else {
      this.#bufferHeldAt = resume;
    }
  }

  /** (Re)start buffer-mode playback from an offset. */
  #startBufferSource(offsetSec: number): void {
    if (this.#audioBuffer === null) {
      return;
    }

    this.#stopBufferSource();
    const offset = clampResumeOffset(offsetSec, this.#audioBuffer.duration);
    const source = this.#context.createBufferSource();
    source.buffer = this.#audioBuffer;
    source.connect(this.#effectInput);
    source.onended = () => {
      if (this.#internal.closed || source !== this.#bufferSource) {
        return; // Superseded by a seek/pause/close, not a natural end.
      }

      this.#bufferSource = null;
      this.#bufferHeldAt = 0;
      const duration = this.#audioBuffer?.duration ?? 0;
      if (
        this.#bufferStartOffset +
          (this.#context.currentTime - this.#bufferStartContextTime) >=
        duration - ENDED_EPSILON_SEC
      ) {
        this.#dispatch({ type: "ended" });
      }
    };

    this.#bufferStartContextTime = this.#context.currentTime;
    this.#bufferStartOffset = offset;
    this.#bufferSource = source;
    source.start(0, offset);
    void this.#context.resume();
  }

  /** Stop and detach the current buffer source (its onended becomes inert). */
  #stopBufferSource(): void {
    const source = this.#bufferSource;
    if (source === null) {
      return;
    }

    this.#bufferSource = null; // Detach first: onended must become a no-op.
    source.onended = null;
    try {
      source.stop();
    } catch {
      // Never started or already stopped — nothing to do.
    }

    source.disconnect();
  }
}

/**
 * Factory for the engine — the seam later phases call
 * (`docs/specs/v1.0/renderer/audio-engine.md`). PlayerProvider never uses
 * `new` directly, so the class remains an implementation detail.
 *
 * @param url - `media-stream://` URL of the audio file.
 * @param options.volume - Initial volume (`[0, 1]`).
 * @returns The engine handle.
 */
export const createAudioEngine = (
  url: string,
  options: { readonly volume?: number } = {},
): AudioEngine => new WebAudioEngine(url, options);
