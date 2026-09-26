/**
 * Build the album identity key shared by `AlbumSummary.albumKey`,
 * `mp:library:getMusicsByAlbum`, the Renderer's `groupAlbums` and the
 * MusicBrainz album grouping (`groupMusicsByAlbum`).
 *
 * The NUL separator cannot occur in tag strings, so ("A B", "C") and
 * ("A", "B C") can never collide.
 *
 * @param displayArtist - Display artist (`displayArtistOf`).
 * @param album - Album title.
 * @returns The opaque identity key.
 */
export const albumKeyOf = (displayArtist: string, album: string): string =>
  `${displayArtist}\u0000${album}`;
