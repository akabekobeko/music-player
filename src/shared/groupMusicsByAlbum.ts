import { albumKeyOf } from "./albumKeyOf";
import { type DisplayArtistInput, displayArtistOf } from "./displayArtistOf";

/** The tags the album grouping reads. */
export type AlbumGroupInput = DisplayArtistInput & {
  /** Album title; empty when unset. */
  readonly album: string;
};

/**
 * Split songs into album groups, in first-appearance order
 * (`docs/specs/v1.2/architecture/lookup-strategy.md`).
 *
 * The group key is the album identity of the database (`albumKeyOf` of
 * the display artist and the album title), so Main (one MusicBrainz
 * release search per group) and the Renderer (the fetch dialog lists the
 * groups) can never disagree with the Album view.
 *
 * @param musics - Songs to group; the order inside each group is preserved.
 * @returns The groups, each a non-empty array.
 */
export const groupMusicsByAlbum = <T extends AlbumGroupInput>(
  musics: readonly T[],
): T[][] => {
  const groups = new Map<string, T[]>();
  for (const music of musics) {
    const key = albumKeyOf(displayArtistOf(music), music.album);
    const group = groups.get(key);
    if (group === undefined) {
      groups.set(key, [music]);
    } else {
      group.push(music);
    }
  }

  return [...groups.values()];
};
