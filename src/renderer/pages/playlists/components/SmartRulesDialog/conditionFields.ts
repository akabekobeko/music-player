/**
 * Condition fields offered by the v1.0 smart-playlist rules editor
 * (`docs/specs/v1.0/features/playlist.md`).
 */
export const CONDITION_FIELDS = [
  "artist",
  "albumArtist",
  "album",
  "genre",
  "title",
  "year",
  "rating",
  "duration",
  "addedAt",
] as const;

/** A condition field name. */
export type ConditionField = (typeof CONDITION_FIELDS)[number];
