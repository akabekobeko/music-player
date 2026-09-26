/** The two artist tags the display artist is derived from. */
export type DisplayArtistInput = {
  /** Track artist tag; empty when unset. */
  readonly artist: string;
  /** Album artist tag; empty when unset. */
  readonly albumArtist: string;
};

/**
 * The display artist of a track: `albumArtist` falling back to `artist`
 * (`docs/specs/v1.0/architecture/database.md`). The Artist view groups on
 * it, the album identity (`albumKeyOf`) starts with it, and the MusicBrainz
 * release search uses it as the artist clause. Kept in one place so every
 * process applies the same fallback.
 *
 * @param music - The track's artist tags.
 * @returns The display artist; empty for the unknown artist.
 */
export const displayArtistOf = (music: DisplayArtistInput): string =>
  music.albumArtist !== "" ? music.albumArtist : music.artist;
