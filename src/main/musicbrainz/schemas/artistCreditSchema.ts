import { z } from "zod";

/**
 * Artist credit list as MusicBrainz attaches it to releases, tracks and
 * recordings (`inc=artist-credits`). Parade joins the entries into one
 * string (`joinArtistCredit`) and reads the credited name only: the
 * canonical `artist.name` is deliberately not declared, because the tag
 * should show the name as printed on the release
 * (`docs/specs/v1.2/architecture/musicbrainz-data-mapping.md`).
 */
export const artistCreditSchema = z.array(
  z.object({
    /** Name as credited on this release (may differ from the artist's). */
    name: z.string(),
    /**
     * Text joining this entry to the next (`" feat. "`, `" & "`); empty or
     * absent on the last entry.
     */
    joinphrase: z.string().optional(),
  }),
);

/** Artist credit list as parsed by {@link artistCreditSchema}. */
export type ArtistCredit = z.infer<typeof artistCreditSchema>;
