import type { AlbumFilter } from "../../ipc/types";
import { ALBUM_ARTIST_SQL } from "../ALBUM_ARTIST_SQL";
import { escapeLikePattern } from "./escapeLikePattern";

/** Fragment of a WHERE clause: SQL snippet plus its bound parameters. */
export type WhereFragment = {
  readonly sql: string;
  readonly params: ReadonlyArray<string | number>;
};

/**
 * Convert an {@link AlbumFilter} into WHERE-clause fragments.
 *
 * Kinds combine with AND; values inside one kind combine with OR. Exported
 * separately from the query so the conversion is unit-testable without a DB.
 * Filtering happens in SQL as a WHERE clause — never in the Renderer — so
 * the 10k-track target stays fast (`docs/specs/v1.0/features/album-view.md`).
 *
 * @param filter - Filter condition from the Renderer.
 * @returns One fragment per active filter kind (empty when unfiltered).
 */
export const buildAlbumWhere = (filter: AlbumFilter): WhereFragment[] => {
  const fragments: WhereFragment[] = [];

  const text = filter.text?.trim() ?? "";
  if (text !== "") {
    const pattern = `%${escapeLikePattern(text)}%`;
    fragments.push({
      sql: `(m.album LIKE ? ESCAPE '\\' OR ${ALBUM_ARTIST_SQL} LIKE ? ESCAPE '\\')`,
      params: [pattern, pattern],
    });
  }

  const genres = filter.genres ?? [];
  if (genres.length > 0) {
    fragments.push({
      sql: `m.genre IN (${genres.map(() => "?").join(", ")})`,
      params: [...genres],
    });
  }

  const decades = filter.decades ?? [];
  if (decades.length > 0) {
    const terms = decades.map((decade) =>
      decade === null ? "m.year IS NULL" : "(m.year >= ? AND m.year < ?)",
    );
    fragments.push({
      sql: `(${terms.join(" OR ")})`,
      params: decades
        .filter((decade): decade is number => decade !== null)
        .flatMap((decade) => [decade, decade + 10]),
    });
  }

  return fragments;
};
