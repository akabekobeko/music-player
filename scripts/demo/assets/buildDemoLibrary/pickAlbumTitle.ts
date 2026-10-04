import type { SeededRandom } from "../SeededRandom.ts";
import {
  ADJECTIVES,
  CLASSICAL_ALBUMS,
  JAPANESE_ALBUMS,
  NOUNS,
  VENUES,
} from "../seed/vocabulary.ts";
import type { DemoArtistSeed, DemoGenre } from "../types.ts";

/** Lead-ins for titles such as "Songs for the Harbor". */
const DEDICATIONS = ["Songs for", "Notes from", "Letters to"] as const;

/** Inputs of {@link pickAlbumTitle}. */
type Params = {
  /** Random source of the artist. */
  readonly rng: SeededRandom;
  /** Artist the album belongs to. */
  readonly seed: DemoArtistSeed;
  /** Genre of the album. */
  readonly genre: DemoGenre;
  /** Zero-based index of the album, oldest first. */
  readonly index: number;
  /** Titles the artist already uses; the result is never one of them. */
  readonly used: ReadonlySet<string>;
};

/**
 * Draw one candidate title; may collide with an earlier album.
 *
 * @param params - See {@link Params}.
 * @returns A title.
 */
const drawAlbumTitle = ({ rng, seed, genre, index }: Params): string => {
  if (/[^ -~]/.test(seed.name)) {
    return rng.pick(JAPANESE_ALBUMS);
  }

  if (genre === "Classical") {
    return rng.pick(CLASSICAL_ALBUMS);
  }

  const adjective = rng.pick(ADJECTIVES);
  const noun = rng.pick(NOUNS);
  if (genre === "Soundtrack") {
    return `${adjective} ${noun} (Original Score)`;
  }

  // A debut album is often self-titled.
  if (index === 0 && rng.chance(0.15)) {
    return seed.name;
  }

  const roll = rng.next();
  if (roll < 0.4) {
    return `${adjective} ${noun}`;
  }

  if (roll < 0.5) {
    return `The ${adjective} ${noun}`;
  }

  if (roll < 0.62) {
    return `${noun} & ${rng.pick(NOUNS.filter((other) => other !== noun))}`;
  }

  if (roll < 0.72) {
    return `${rng.pick(DEDICATIONS)} the ${noun}`;
  }

  if (roll < 0.84) {
    return noun;
  }

  if (roll < 0.9) {
    return adjective;
  }

  if (roll < 0.95) {
    return `Live at ${rng.pick(VENUES)}`;
  }

  return `${adjective} ${noun}, Vol. ${rng.int(1, 3)}`;
};

/**
 * Pick an album title the artist does not use yet.
 *
 * @param params - See {@link Params}.
 * @returns A title unique within the artist.
 */
export const pickAlbumTitle = (params: Params): string => {
  for (let attempt = 0; attempt < 100; attempt++) {
    const title = drawAlbumTitle(params);
    if (!params.used.has(title)) {
      return title;
    }
  }

  throw new Error(`No unused album title left for ${params.seed.name}.`);
};
