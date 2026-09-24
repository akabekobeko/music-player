import type { AlbumFilter } from "../../ipc/types";
import { ALBUM_ARTIST_SQL } from "../constants";
import { escapeLikePattern } from "./escapeLikePattern";

/** Fragment of a WHERE clause: SQL snippet plus its bound parameters. */
export type WhereFragment = {
  /**
   * One boolean expression over the `musics m` alias using `?` placeholders
   * only, never interpolated values. `getAlbums` joins the fragments with
   * AND, so OR-combined terms are parenthesised here.
   */
  readonly sql: string;
  /**
   * Values bound to the placeholders in `sql`, in placeholder order. LIKE
   * patterns are already escaped and wrapped in `%`; empty when the
   * fragment binds nothing (e.g. only `m.year IS NULL`).
   */
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

  const musicTitle = filter.musicTitle?.trim() ?? "";
  if (musicTitle !== "") {
    fragments.push({
      sql: `m.title LIKE ? ESCAPE '\\'`,
      params: [`%${escapeLikePattern(musicTitle)}%`],
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
