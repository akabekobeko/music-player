import { useState } from "react";

/** Coerce Base UI's single-or-array slider value into a number. */
const asNumber = (value: number | readonly number[]): number =>
  Array.isArray(value) ? (value[0] ?? 0) : (value as number);

/**
 * Logic of `VolumeControl`: the 0–100 slider value over the internal
 * `[0, 1]` volume, and the mute toggle that remembers the last audible
 * level so unmuting restores it.
 *
 * @param volume - Current volume in `[0, 1]`.
 * @param onChange - Called with the new volume in `[0, 1]`.
 */
export const useVolumeControl = (
  volume: number,
  onChange: (volume: number) => void,
) => {
  const [lastAudible, setLastAudible] = useState(1);
  const muted = volume === 0;

  const toggleMute = (): void => {
    if (muted) {
      onChange(lastAudible > 0 ? lastAudible : 1);
    } else {
      setLastAudible(volume);
      onChange(0);
    }
  };

  const setPercent = (value: number | readonly number[]): void => {
    onChange(asNumber(value) / 100);
  };

  return {
    muted,
    /** Slider value: the volume as a 0–100 integer. */
    percent: Math.round(volume * 100),
    toggleMute,
    /** Slider change handler (takes Base UI's single-or-array value). */
    setPercent,
  };
};
