/** Structural subset of `TimeRanges` (constructible in tests). */
export type BufferedRanges = {
  readonly length: number;
  readonly start: (index: number) => number;
  readonly end: (index: number) => number;
};

/**
 * Whether a time position falls inside the buffered ranges
 * (`docs/specs/v1.0/renderer/audio-engine.md`). Web-Audio-free so it can be
 * unit-tested directly.
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
