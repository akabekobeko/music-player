import type { DatabaseSync } from "node:sqlite";
import type { Artist } from "../ipc/types";

/**
 * Artist-list query for `mp:library:getArtists`
 * (`docs/specs/v1.0/features/artist-view.md`): distinct artists with their
 * track counts and representative artwork (`artist_pictures` → `pictures`).
 *
 * Sorting is intentionally a plain name ORDER BY here — the article-blind
 * ordering ("The" / "A" / "Thee") is locale-ish presentation logic and lives
 * in the Renderer (`compareNameWithoutArticle`).
 */

const SELECT_ARTISTS_SQL = `
SELECT
  m.artist            AS name,
  COUNT(*)            AS musicCount,
  p.file_path         AS picturePath
FROM musics m
LEFT JOIN artist_pictures ap ON ap.artist = m.artist
LEFT JOIN pictures p         ON p.id = ap.picture_id
GROUP BY m.artist
ORDER BY m.artist
`;

/**
 * List every artist in the library.
 *
 * @param db - The open library connection.
 * @returns Artists with counts and artwork paths (empty-name artists — files
 *   without an artist tag — are included; the UI decides their label).
 */
export const getArtists = (db: DatabaseSync): Artist[] => {
  const rows = db.prepare(SELECT_ARTISTS_SQL).all() as Array<{
    name: string;
    musicCount: number;
    picturePath: string | null;
  }>;
  return rows.map((row) => ({
    name: row.name,
    musicCount: row.musicCount,
    picturePath: row.picturePath,
  }));
};
