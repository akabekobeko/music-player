/**
 * Clamp a volume into `[0, 1]`
 * (`docs/specs/v1.0/renderer/audio-engine.md`).
 *
 * @param volume - Raw volume value.
 * @returns The clamped volume.
 */
export const clampVolume = (volume: number): number =>
  Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 1;
