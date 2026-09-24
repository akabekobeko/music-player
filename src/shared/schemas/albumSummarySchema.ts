import { z } from "zod";

/**
 * One album card of the Album view (grouped by album identity key).
 * `getAlbums` parses its rows with the schema minus `albumKey`, which Main
 * derives from the row.
 */
export const albumSummarySchema = z.object({
  /**
   * Opaque identity key produced by Main from
   * `(COALESCE(NULLIF(album_artist, ''), artist), album)`. Pass it back to
   * `mp:library:getMusicsByAlbum` verbatim.
   */
  albumKey: z.string(),
  album: z.string(),
  /** Display artist of the album (album_artist, falling back to artist). */
  artist: z.string(),
  /** Representative release year. `null` when unknown. */
  year: z.number().nullable(),
  genre: z.string(),
  /** Representative producer (any non-empty value of the group). */
  producer: z.string(),
  /** Representative conductor (any non-empty value of the group). */
  conductor: z.string(),
  /** Representative publisher / record label (any non-empty value of the group). */
  publisher: z.string(),
  musicCount: z.number().int(),
  totalDurationMs: z.number(),
  /** Absolute path of the representative artwork, or `null`. */
  picturePath: z.string().nullable(),
});
