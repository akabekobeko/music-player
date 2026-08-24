import type { ArtistListItem } from "./flattenSections";

/** Fixed artist row height for the virtualiser (px). */
export const ARTIST_ROW_HEIGHT = 48;

/** Fixed section heading height (px) — deliberately slimmer than a row. */
export const INITIAL_HEADING_HEIGHT = 24;

/**
 * Height of one virtualised row. Every row of a kind has the same height so
 * the virtualiser never needs to measure the DOM.
 *
 * @param item - The row.
 * @returns Its height in px.
 */
export const itemHeightOf = (item: ArtistListItem): number =>
  item.kind === "heading" ? INITIAL_HEADING_HEIGHT : ARTIST_ROW_HEIGHT;
