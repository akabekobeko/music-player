import { z } from "zod";

/**
 * Library-wide counters shown by the settings page's library section.
 * `getLibraryStats` parses its aggregate row with this schema.
 */
export const libraryStatsSchema = z.object({
  /** Number of rows in `musics`, i.e. every imported track. */
  musicCount: z.number().int(),
  /**
   * Number of distinct display artists (`album_artist` falling back to
   * `artist`), the same grouping as the Artist view. Tracks with neither
   * tag count as one artist (the empty name).
   */
  artistCount: z.number().int(),
  /** Number of album identity groups (album_artist + album). */
  albumCount: z.number().int(),
  /**
   * Sum of every track's `duration_ms`; 0 for an empty library. Tracks mme
   * could not measure are stored as 0 and add nothing.
   */
  totalDurationMs: z.number(),
});
