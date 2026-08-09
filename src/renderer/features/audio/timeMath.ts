/**
 * Pure time calculations shared by the engine's imperative shell
 * (`docs/specs/v1.0/renderer/audio-engine.md`). Web-Audio-free so they can
 * be unit-tested directly.
 */

/** Structural subset of `TimeRanges` (constructible in tests). */
export type BufferedRanges = {
  readonly length: number;
  readonly start: (index: number) => number;
  readonly end: (index: number) => number;
};

/**
 * Whether a time position falls inside the buffered ranges.
 *
 * A small end-slack keeps positions in the still-loading tail of a range
 * from being treated as seekable (setting `currentTime` right at a range
 * edge is what triggered PIPELINE_ERROR_READ in audio-player).
 *
 * @param ranges - `HTMLMediaElement.buffered`.
 * @param timeSec - Seek target in seconds.
 * @param endSlackSec - Safety margin subtracted from each range end.
 * @returns `true` when the target can be seeked to immediately.
 */
export const isTimeBuffered = (
  ranges: BufferedRanges,
  timeSec: number,
  endSlackSec = 0.25,
): boolean => {
  for (let index = 0; index < ranges.length; index += 1) {
    if (
      timeSec >= ranges.start(index) &&
      timeSec <= ranges.end(index) - endSlackSec
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Clamp a resume offset for buffer-mode (re)starts.
 *
 * Keeps the offset inside `[0, duration - 0.05]` so starting an
 * `AudioBufferSourceNode` at (or past) the very end cannot fire an
 * immediate spurious `ended`.
 *
 * @param offsetSec - Desired start offset in seconds.
 * @param durationSec - Buffer duration; non-positive means unknown.
 * @returns The clamped offset.
 */
export const clampResumeOffset = (
  offsetSec: number,
  durationSec: number,
): number => {
  const lower = Math.max(0, offsetSec);
  if (durationSec <= 0) {
    return lower;
  }

  return Math.min(lower, Math.max(0, durationSec - 0.05));
};

/**
 * Clamp a volume into `[0, 1]`.
 *
 * @param volume - Raw volume value.
 * @returns The clamped volume.
 */
export const clampVolume = (volume: number): number =>
  Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 1;
