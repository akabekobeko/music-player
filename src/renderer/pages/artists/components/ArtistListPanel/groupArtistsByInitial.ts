import type { Artist } from "@mp/ipc";
import { artistInitialOf } from "./artistInitialOf";
import { INITIALS, type Initial } from "./initials";

/** One initial section of the artist list. */
export type ArtistSection = {
  readonly initial: Initial;
  /** Artists of the section, in the order they were given. */
  readonly artists: readonly Artist[];
};

/**
 * Groups artists into initial sections in {@link INITIALS} order (A–Z, then
 * other), keeping the given order inside each section and dropping empty
 * sections. The section of an artist is its stored initial when the user
 * chose one, otherwise the automatic classification of the name
 * ({@link artistInitialOf}). The other bucket always ends up last — after Z — even though
 * digits would sort before A by code point.
 *
 * @param artists - Artists, already sorted.
 * @returns Non-empty sections in display order.
 */
export const groupArtistsByInitial = (
  artists: readonly Artist[],
): readonly ArtistSection[] => {
  const buckets = new Map<Initial, Artist[]>(
    INITIALS.map((initial) => [initial, []]),
  );
  for (const artist of artists) {
    buckets.get(artistInitialOf(artist))?.push(artist);
  }

  return INITIALS.flatMap((initial) => {
    const bucket = buckets.get(initial) ?? [];
    return bucket.length > 0 ? [{ initial, artists: bucket }] : [];
  });
};
