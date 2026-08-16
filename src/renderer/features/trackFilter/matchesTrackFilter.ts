/**
 * Case-insensitive partial match of a track title against a filter text.
 *
 * The single definition every client-side view filter shares, so the
 * behaviour stays aligned with the Album view's SQL `LIKE` counterpart
 * (`buildAlbumWhere`).
 *
 * @param title - Track title.
 * @param filterText - Toolbar filter text; blank matches everything.
 * @returns Whether the track passes the filter.
 */
export const matchesTrackFilter = (
  title: string,
  filterText: string,
): boolean => {
  const needle = filterText.trim().toLowerCase();
  return needle === "" || title.toLowerCase().includes(needle);
};
