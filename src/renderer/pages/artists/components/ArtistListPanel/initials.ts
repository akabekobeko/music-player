/**
 * Section keys of the artist list in display order: the 26 Latin letters,
 * then the "other" bucket (`docs/specs/v1.0/features/artist-view.md`).
 */
export const INITIALS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "#",
] as const;

/** Section key of every name whose sort key does not start with A–Z. */
export const OTHER_INITIAL = "#";

/** One section key: a capital letter or {@link OTHER_INITIAL}. */
export type Initial = (typeof INITIALS)[number];
