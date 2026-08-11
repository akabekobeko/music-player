/**
 * Table + kind pairing so each playlist query can address one of the two
 * tables. Static playlists live in `playlists` / `playlist_musics`; smart
 * playlists store only their rule JSON in `smart_playlists`
 * (`docs/specs/v1.0/features/playlist.md`).
 */
export const TABLE_OF = {
  static: "playlists",
  smart: "smart_playlists",
} as const;
