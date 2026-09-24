import { z } from "zod";

/**
 * One album card of the Album view (grouped by album identity key).
 * `getAlbums` parses its rows with the schema minus `albumKey`, which Main
 * derives from the row.
 *
 * Every aggregate below is computed over the tracks that survive the album
 * filter's WHERE clause, not over the whole album: while a genre / decade /
 * text filter is active, `musicCount`, `totalDurationMs` and the
 * representative values describe only the matching tracks.
 */
export const albumSummarySchema = z.object({
  /**
   * Opaque identity key produced by Main from
   * `(COALESCE(NULLIF(album_artist, ''), artist), album)`. Pass it back to
   * `mp:library:getMusicsByAlbum` verbatim.
   */
  albumKey: z.string(),
  /**
   * Album title as tagged. Empty string when the tracks carry no album tag;
   * such tracks still form one album per display artist.
   */
  album: z.string(),
  /** Display artist of the album (album_artist, falling back to artist). */
  artist: z.string(),
  /**
   * Representative release year: the smallest non-null year of the group
   * (`MIN`). `null` when no track has a year.
   */
  year: z.number().nullable(),
  /**
   * Representative genre (any non-empty value of the group). Taken with
   * `MAX`, so the empty string only wins when every track is untagged.
   */
  genre: z.string(),
  /** Representative producer (any non-empty value of the group). */
  producer: z.string(),
  /** Representative conductor (any non-empty value of the group). */
  conductor: z.string(),
  /** Representative publisher / record label (any non-empty value of the group). */
  publisher: z.string(),
  /** Number of tracks in the group (`COUNT(*)`). */
  musicCount: z.number().int(),
  /**
   * Sum of the tracks' `duration_ms`. A track mme could not measure is
   * stored as 0 and therefore adds nothing.
   */
  totalDurationMs: z.number(),
  /**
   * Absolute path of the representative artwork (any track's artwork of the
   * group, joined from `pictures`), or `null` when no track has one.
   */
  picturePath: z.string().nullable(),
});
