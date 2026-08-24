import type { Artist } from "@mp/ipc";
import type { ArtistSection } from "./groupArtistsByInitial";
import type { Initial } from "./initials";

/** One virtualised row of the artist list: a section heading or an artist. */
export type ArtistListItem =
  | { readonly kind: "heading"; readonly initial: Initial }
  | { readonly kind: "artist"; readonly artist: Artist };

/**
 * Flattens sections into the row sequence the virtualiser renders: each
 * section contributes its heading followed by its artists.
 *
 * @param sections - Sections in display order.
 * @returns Rows in display order.
 */
export const flattenSections = (
  sections: readonly ArtistSection[],
): readonly ArtistListItem[] =>
  sections.flatMap((section) => [
    { kind: "heading", initial: section.initial } as const,
    ...section.artists.map((artist) => ({ kind: "artist", artist }) as const),
  ]);
