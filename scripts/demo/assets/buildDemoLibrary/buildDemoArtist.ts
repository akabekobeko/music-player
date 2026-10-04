import { SeededRandom } from "../SeededRandom.ts";
import { FIRST_NAMES, LAST_NAMES } from "../seed/vocabulary.ts";
import type {
  DemoAlbum,
  DemoArtist,
  DemoArtistSeed,
  DemoGenre,
} from "../types.ts";
import { buildDemoAlbum } from "./buildDemoAlbum.ts";
import { pickAlbumTitle } from "./pickAlbumTitle.ts";
import { slugOf } from "./slugOf.ts";

/** Newest release year an album may get. */
const LATEST_YEAR = 2026;

/**
 * Every album whose library-wide index leaves this remainder has no year
 * tag, which puts a few albums under "Unknown" in the decade filter.
 */
const UNKNOWN_YEAR_INTERVAL = 173;

/** Remainder of {@link UNKNOWN_YEAR_INTERVAL} that drops the year. */
const UNKNOWN_YEAR_REMAINDER = 20;

/** Main genres whose artists never release an album in another genre. */
const FIXED_GENRES: readonly DemoGenre[] = ["Classical", "Soundtrack"];

/** Genres an album may switch to instead of the artist's main genre. */
const SIDE_GENRES: readonly DemoGenre[] = [
  "Rock",
  "Pop",
  "Jazz",
  "Electronic",
  "Folk",
  "Blues",
  "Ambient",
];

/**
 * Make up a person name for the credits.
 *
 * @param rng - Random source of the artist.
 * @returns A full name.
 */
const drawPerson = (rng: SeededRandom): string =>
  `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;

/**
 * Build one artist with all of its albums.
 *
 * The random source is seeded from the artist name alone, so editing one
 * seed entry never changes the albums of another artist. The one exception
 * is the name in a guest credit, which is picked from the other artists.
 *
 * @param seed - Definition of the artist.
 * @param albumOffset - Number of albums built for the artists before this
 *   one; the library-wide album index decides which albums lack a year.
 * @param guests - Names of the other artists, candidates for guest credits.
 * @returns The artist.
 */
export const buildDemoArtist = (
  seed: DemoArtistSeed,
  albumOffset: number,
  guests: readonly string[],
): DemoArtist => {
  const rng = new SeededRandom(`artist:${seed.name}`);
  const writers = seed.person
    ? [seed.name, drawPerson(rng)]
    : [drawPerson(rng), drawPerson(rng), drawPerson(rng)];
  let conductor = drawPerson(rng);
  while (writers.includes(conductor)) {
    conductor = drawPerson(rng);
  }

  const albums: DemoAlbum[] = [];
  const used = new Set<string>();
  let year = seed.startYear;
  for (let index = 0; index < seed.albumCount; index++) {
    const playable = seed.playable?.albumIndex === index;
    if (index > 0) {
      year = Math.min(LATEST_YEAR, year + rng.int(1, 3));
    }

    const genre =
      !playable && !FIXED_GENRES.includes(seed.genre) && rng.chance(0.1)
        ? rng.pick(SIDE_GENRES)
        : seed.genre;
    const title =
      seed.playable && playable
        ? seed.playable.albumTitle
        : pickAlbumTitle({ rng, seed, genre, index, used });
    used.add(title);

    const unknownYear =
      !playable &&
      (albumOffset + index) % UNKNOWN_YEAR_INTERVAL === UNKNOWN_YEAR_REMAINDER;
    albums.push(
      buildDemoAlbum({
        rng,
        seed,
        index,
        title,
        year: unknownYear ? null : year,
        genre,
        writers,
        producer: rng.chance(0.5) ? (writers[0] ?? "") : drawPerson(rng),
        conductor,
        guests,
      }),
    );
  }

  return {
    name: seed.name,
    picturePath: `images/artists/${seed.slug ?? slugOf(seed.name)}.jpg`,
    albums,
  };
};
