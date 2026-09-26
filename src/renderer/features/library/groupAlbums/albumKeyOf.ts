import type { Music } from "@mp/ipc";
import { albumKeyOf as keyOf } from "../../../../shared/albumKeyOf";
import { displayArtistOf } from "../../../../shared/displayArtistOf";

/**
 * The album identity key of one track, built with the shared rule
 * (`displayArtistOf` + NUL + album) so it matches `AlbumGroup.key` and the
 * Main process's `AlbumSummary.albumKey`.
 *
 * @param music - The track.
 * @returns The album identity key.
 */
export const albumKeyOf = (music: Music): string =>
  keyOf(displayArtistOf(music), music.album);
