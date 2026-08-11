/** Sort choices: rule sort fields plus random and "no explicit sort". */
export const SORT_CHOICES = [
  "none",
  "title",
  "artist",
  "album",
  "year",
  "duration",
  "rating",
  "addedAt",
  "random",
] as const;

/** A sort choice value. */
export type SortChoice = (typeof SORT_CHOICES)[number];
