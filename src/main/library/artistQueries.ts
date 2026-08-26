import type { DatabaseSync } from "node:sqlite";
import type { Artist } from "../ipc/types";
import { ALBUM_ARTIST_SQL } from "./ALBUM_ARTIST_SQL";

/**
 * Artist-list query for `mp:library:getArtists`
 * (`docs/specs/v1.0/features/artist-view.md`): distinct display artists
 * (`album_artist` falling back to `artist`) with their track counts and
 * representative artwork (`artist_pictures` → `pictures`) and user-chosen
 * initial (`artist_initials`, `NULL` when the classification is automatic).
 *
 * Sorting is intentionally a plain name ORDER BY here — the article-blind
 * ordering ("The" / "Die" / "Los" …) is locale-ish presentation logic and lives
 * in the Renderer (`compareNameWithoutArticle`).
 */

const SELECT_ARTISTS_SQL = `
SELECT
  ${ALBUM_ARTIST_SQL} AS name,
  COUNT(*)            AS musicCount,
  p.file_path         AS picturePath,
  ai.initial          AS initial
FROM musics m
LEFT JOIN artist_pictures ap ON ap.artist = ${ALBUM_ARTIST_SQL}
LEFT JOIN pictures p         ON p.id = ap.picture_id
LEFT JOIN artist_initials ai ON ai.artist = ${ALBUM_ARTIST_SQL}
GROUP BY ${ALBUM_ARTIST_SQL}
ORDER BY name
`;

/**
 * List every artist in the library.
 *
 * @param db - The open library connection.
 * @returns Artists with counts and artwork paths (empty-name artists — files
 *   without artist and album-artist tags — are included; the UI decides
 *   their label).
 */
export const getArtists = (db: DatabaseSync): Artist[] => {
  const rows = db.prepare(SELECT_ARTISTS_SQL).all() as Array<{
    name: string;
    musicCount: number;
    picturePath: string | null;
    initial: string | null;
  }>;
  return rows.map((row) => ({
    name: row.name,
    musicCount: row.musicCount,
    picturePath: row.picturePath,
    initial: row.initial,
  }));
};
