import type { Genre } from "../schemas/genreSchema";
import type { Release, ReleaseTrack } from "../schemas/releaseSchema";

/**
 * Pick the genre tag (`docs/specs/v1.2/architecture/metadata-mapping.md`):
 * the first non-empty list of release group, release and recording genres,
 * then the entry with the most votes (the first one on a tie, since the
 * lists come sorted by count from MusicBrainz), capitalised
 * (`rock` becomes `Rock`).
 *
 * @param release - The looked-up release.
 * @param track - The matched track.
 * @returns The genre name, or `null` when no list has entries.
 */
export const genreOf = (
  release: Release,
  track: ReleaseTrack,
): string | null => {
  const lists: ReadonlyArray<readonly Genre[] | undefined> = [
    release["release-group"]?.genres,
    release.genres,
    track.recording.genres,
  ];
  const genres = lists.find((list) => list !== undefined && list.length > 0);
  if (genres === undefined) {
    return null;
  }

  const best = genres.reduce((top, genre) =>
    genre.count > top.count ? genre : top,
  );
  return capitalize(best.name);
};

/** Upper-case the first character only (`industrial rock` to `Industrial rock`). */
const capitalize = (name: string): string =>
  name === "" ? name : `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
