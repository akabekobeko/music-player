import { DURATION_TOLERANCE_MS } from "../constants";

/**
 * Whether a MusicBrainz length agrees with the library's duration within
 * `DURATION_TOLERANCE_MS` (`docs/specs/v1.2/architecture/lookup-strategy.md`).
 * When either side is unknown (the library reports 0, MusicBrainz has no
 * length) the check cannot fail, so it passes.
 *
 * @param durationMs - Library duration; 0 when mme could not measure.
 * @param lengthMs - MusicBrainz track / recording length; `null` or absent when unknown.
 * @returns `true` when the two are close enough or one is unknown.
 */
export const isDurationClose = (
  durationMs: number,
  lengthMs: number | null | undefined,
): boolean =>
  durationMs <= 0 ||
  lengthMs === null ||
  lengthMs === undefined ||
  Math.abs(durationMs - lengthMs) <= DURATION_TOLERANCE_MS;
