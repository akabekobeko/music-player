/**
 * SQL expression of the display artist (`album_artist` falling back to
 * `artist`); requires the `musics` table to be aliased as `m`.
 *
 * Both identities build on it (`docs/specs/v1.0/architecture/database.md`):
 * the album identity is `(display artist, album)`, and the artist list /
 * artist-scoped queries group and match on the display artist alone.
 */
export const ALBUM_ARTIST_SQL =
  "COALESCE(NULLIF(m.album_artist, ''), m.artist)";
