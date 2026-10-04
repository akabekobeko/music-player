import type { SeededRandom } from "../SeededRandom.ts";
import {
  ADJECTIVES,
  CLASSICAL_KEYS,
  CLASSICAL_TEMPOS,
  CLASSICAL_WORKS,
  JAPANESE_TRACKS,
  NOUNS,
  ROMAN_NUMERALS,
  SETTINGS,
  VERBS,
} from "../seed/vocabulary.ts";
import type { DemoGenre } from "../types.ts";

/** Lead-ins for titles such as "Dear Lantern". */
const ADDRESSES = ["No", "Dear", "Goodbye,"] as const;

/** Inputs of {@link pickTrackTitles}. */
type Params = {
  /** Random source of the artist. */
  readonly rng: SeededRandom;
  /** Genre of the album. */
  readonly genre: DemoGenre;
  /** Number of titles to return. */
  readonly count: number;
  /** Whether to draw from the Japanese titles. */
  readonly japanese: boolean;
};

/**
 * Titles of a classical album: a few works, each split into movements such
 * as "Suite No. 2 in D minor: III. Adagio".
 *
 * @param rng - Random source of the artist.
 * @param count - Number of titles to return.
 * @returns Titles in album order.
 */
const classicalTitles = (rng: SeededRandom, count: number): string[] => {
  const titles: string[] = [];
  const works = new Set<string>();
  while (titles.length < count) {
    const work = `${rng.pick(CLASSICAL_WORKS)} No. ${rng.int(1, 9)} in ${rng.pick(CLASSICAL_KEYS)}`;
    if (works.has(work)) {
      continue;
    }

    works.add(work);
    const movements = rng.int(3, 4);
    for (const numeral of ROMAN_NUMERALS.slice(0, movements)) {
      titles.push(`${work}: ${numeral}. ${rng.pick(CLASSICAL_TEMPOS)}`);
    }
  }

  return titles.slice(0, count);
};

/**
 * Draw one song title; may collide with an earlier track.
 *
 * @param rng - Random source of the artist.
 * @param genre - Genre of the album.
 * @returns A title.
 */
const drawSongTitle = (rng: SeededRandom, genre: DemoGenre): string => {
  const adjective = rng.pick(ADJECTIVES);
  const noun = rng.pick(NOUNS);
  const roll = rng.next();
  if (roll < 0.34) {
    return `${adjective} ${noun}`;
  }

  if (roll < 0.46) {
    return noun;
  }

  if (roll < 0.56) {
    return `The ${noun}`;
  }

  if (roll < 0.7) {
    return `${rng.pick(VERBS)} the ${noun}`;
  }

  if (roll < 0.8) {
    return `${noun} ${rng.pick(SETTINGS)}`;
  }

  if (roll < 0.9) {
    return `${rng.pick(ADDRESSES)} ${noun}`;
  }

  if (roll < 0.96) {
    return genre === "Blues" ? `${noun} Blues` : `${noun} Song`;
  }

  return `${adjective} ${noun} (Reprise)`;
};

/**
 * Pick the track titles of one album, unique within the album.
 *
 * @param params - See {@link Params}.
 * @returns Titles in album order.
 */
export const pickTrackTitles = ({
  rng,
  genre,
  count,
  japanese,
}: Params): string[] => {
  if (japanese) {
    return rng.shuffle(JAPANESE_TRACKS).slice(0, count);
  }

  if (genre === "Classical") {
    return classicalTitles(rng, count);
  }

  const titles = new Set<string>();
  while (titles.size < count) {
    titles.add(drawSongTitle(rng, genre));
  }

  const result = [...titles];
  if (genre === "Soundtrack") {
    result[0] = "Main Title";
    result[result.length - 1] = "End Credits";
  }

  return result;
};
