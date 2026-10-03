import { RATING_SCALE } from "@/components/app/InfoDialog/MusicInfoDialog/formValuesOf";

/**
 * Convert a stored rating to the number of stars the table shows: the
 * `[0, 1]` value on the 5-star scale of the music info dialog
 * (`RATING_SCALE`), rounded to the nearest half star and kept within the
 * scale.
 *
 * @param rating - Rating normalised to `[0, 1]` (`Music.rating`).
 * @returns Stars from 0 to 5 in half steps.
 */
export const ratingStarsOf = (rating: number): number =>
  Math.min(
    RATING_SCALE,
    Math.max(0, Math.round(rating * RATING_SCALE * 2) / 2),
  );
