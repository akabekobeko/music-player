import type { DatabaseSync } from "node:sqlite";
import { ALBUM_ARTIST_SQL } from "./ALBUM_ARTIST_SQL";

/**
 * Drop `artist_initials` rows whose display artist (`album_artist` falling
 * back to `artist` — the artist list's identity) no longer has any track,
 * so a user-chosen initial never outlives the artist it was set for.
 *
 * Runs inside the caller's transaction — this function never opens or
 * commits one itself. Sibling of `deleteOrphanedArtistPictures`; every
 * mutation that can strand artist rows runs both.
 *
 * @param db - The open library connection.
 */
export const deleteOrphanedArtistInitials = (db: DatabaseSync): void => {
  db.prepare(
    `DELETE FROM artist_initials
     WHERE artist NOT IN (SELECT DISTINCT ${ALBUM_ARTIST_SQL} FROM musics m)`,
  ).run();
};
