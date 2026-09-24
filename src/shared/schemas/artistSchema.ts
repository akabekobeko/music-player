import { z } from "zod";

/**
 * One artist row of the Artist view, grouped by the display artist
 * (`album_artist` falling back to `artist`). `getArtists` parses its rows
 * with this schema.
 */
export const artistSchema = z.object({
  /**
   * Display artist name (`album_artist` falling back to `artist`). Empty
   * string for tracks that carry neither tag; they form one row and the UI
   * decides its label.
   */
  name: z.string(),
  /** Number of tracks by this artist. */
  musicCount: z.number().int(),
  /**
   * Absolute path of the representative artwork under `userData/images/`,
   * or `null` when the artist has none. Renderer turns this into a
   * `media-file://` URL.
   */
  picturePath: z.string().nullable(),
  /**
   * User-chosen initial (capital letter A-Z) that overrides the automatic
   * section classification of the artist list, or `null` when none is
   * stored ("Other" / automatic).
   */
  initial: z.string().nullable(),
});
