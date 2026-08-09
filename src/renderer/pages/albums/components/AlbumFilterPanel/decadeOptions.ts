import type { FilterOptions } from "@mp/ipc";

/**
 * Decade checkbox values from the library's year range
 * (`docs/specs/v1.0/features/album-view.md`): 10-year buckets covering
 * `MIN(year)`–`MAX(year)`, ascending. The unknown-year item (`null`) is not
 * part of this list — the panel renders it separately so it exists even when
 * the library has no years at all.
 *
 * @param yearRange - `FilterOptions.yearRange` (`null` when no track has a
 *   year).
 * @returns Decade start years (e.g. `[1970, 1980, 1990]`).
 */
export const decadeOptions = (
  yearRange: FilterOptions["yearRange"],
): number[] => {
  if (yearRange === null) {
    return [];
  }

  const first = Math.floor(yearRange.min / 10) * 10;
  const last = Math.floor(yearRange.max / 10) * 10;
  const decades: number[] = [];
  for (let decade = first; decade <= last; decade += 10) {
    decades.push(decade);
  }

  return decades;
};
