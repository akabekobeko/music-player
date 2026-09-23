import type { Music, UpdatedMusic } from "@mp/ipc";
import { artistPathOf } from "../../artistPath";

/**
 * Where the Artist view goes after an apply
 * (`docs/specs/v1.1/features/route-follow.md`):
 *
 * - none of the shown artist's tracks was updated: stay (`null`)
 * - the updated tracks now show one display artist: that artist's path
 *   (`null` when it is still the shown one)
 * - they split across several: stay while the shown artist keeps a track,
 *   else back to the artist list
 *
 * @param artistName - Display artist of the view (`""` = unknown bucket).
 * @param artistMusics - The artist's tracks as shown before the apply.
 * @param updated - The apply's updated tracks.
 * @returns The path to replace the route with, or `null` to stay.
 */
export const nextArtistRouteOf = (
  artistName: string,
  artistMusics: readonly Music[],
  updated: readonly UpdatedMusic[],
): string | null => {
  const shownIds = new Set(artistMusics.map((music) => music.id));
  const affected = updated.filter((entry) => shownIds.has(entry.music.id));
  if (affected.length === 0) {
    return null;
  }

  const artists = new Set(affected.map((entry) => entry.displayArtist));
  if (artists.size === 1) {
    const [artist] = artists;
    return artist === undefined || artist === artistName
      ? null
      : artistPathOf(artist);
  }

  const artistById = new Map(
    affected.map((entry) => [entry.music.id, entry.displayArtist]),
  );
  const remains = artistMusics.some(
    (music) => (artistById.get(music.id) ?? artistName) === artistName,
  );
  return remains ? null : "/artists";
};
