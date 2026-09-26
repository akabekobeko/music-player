import { z } from "zod";

/**
 * One entry of a `genres[]` list (`inc=genres`). MusicBrainz attaches the
 * list to release groups, releases and recordings; Parade adopts the entry
 * with the highest `count` (`docs/specs/v1.2/architecture/metadata-mapping.md`).
 */
export const genreSchema = z.object({
  /** Genre name in lower case as MusicBrainz stores it (`"rock"`). */
  name: z.string(),
  /** Number of votes for this genre; the mapping picks the largest. */
  count: z.number(),
});

/** One genre entry as parsed by {@link genreSchema}. */
export type Genre = z.infer<typeof genreSchema>;
