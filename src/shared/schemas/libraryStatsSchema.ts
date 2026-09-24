import { z } from "zod";

/**
 * Library-wide counters shown by the settings page's library section.
 * `getLibraryStats` parses its aggregate row with this schema.
 */
export const libraryStatsSchema = z
  .object({
    musicCount: z.number().int(),
    artistCount: z.number().int(),
    /** Number of album identity groups (album_artist + album). */
    albumCount: z.number().int(),
    totalDurationMs: z.number(),
  })
  .readonly();
