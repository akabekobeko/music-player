/**
 * SQL expression of the album's display artist (identity key part).
 *
 * The album identity is `(COALESCE(NULLIF(album_artist, ''), artist), album)`
 * (`docs/specs/v1.0/architecture/database.md`).
 */
export const ALBUM_ARTIST_SQL =
  "COALESCE(NULLIF(m.album_artist, ''), m.artist)";
