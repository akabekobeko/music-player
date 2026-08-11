/**
 * Clamp a resume offset for buffer-mode (re)starts
 * (`docs/specs/v1.0/renderer/audio-engine.md`).
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
