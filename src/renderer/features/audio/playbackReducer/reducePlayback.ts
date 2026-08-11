import { clampVolume } from "../clampVolume";
import type { InternalPlayback, PlaybackEvent } from "./types";

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
