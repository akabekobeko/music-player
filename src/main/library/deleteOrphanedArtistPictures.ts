import type { DatabaseSync } from "node:sqlite";
import { ALBUM_ARTIST_SQL } from "./ALBUM_ARTIST_SQL";

/**
 * Drop `artist_pictures` rows whose display artist (`album_artist` falling
 * back to `artist` — the artist list's identity) no longer has any track.
 *
 * Runs inside the caller's transaction — this function never opens or
 * commits one itself. Run it before `deleteOrphanedPictures` so pictures
 * released here are GC'd in the same pass.
 *
 * @param db - The open library connection.
 */
export const deleteOrphanedArtistPictures = (db: DatabaseSync): void => {
  db.prepare(
    `DELETE FROM artist_pictures
     WHERE artist NOT IN (SELECT DISTINCT ${ALBUM_ARTIST_SQL} FROM musics m)`,
  ).run();
};
