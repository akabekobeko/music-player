import type { Music } from "@mp/ipc";
import { albumArtistOf } from "./albumArtistOf";

/**
 * The album identity key of one track: `(albumArtist falling back to
 * artist, album)` serialised with a NUL separator. The same key shape
 * `groupAlbums` uses for `AlbumGroup.key` and the Main process builds for
 * `AlbumSummary.albumKey`, so a track can be matched against either view.
 *
 * NUL cannot occur in tag strings, so ("A B", "C") and ("A", "B C") never
 * collide.
 *
 * @param music - The track.
 * @returns The album identity key.
 */
export const albumKeyOf = (music: Music): string =>
  `${albumArtistOf(music)}\u0000${music.album}`;
