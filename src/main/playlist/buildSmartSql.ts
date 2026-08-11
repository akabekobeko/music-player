import type { SmartPlaylistRules } from "../ipc/types";
import { MUSIC_COLUMNS } from "../library/MUSIC_COLUMNS";
import { buildConditionSql } from "./buildConditionSql/buildConditionSql";
import type { SqlFragment } from "./types";

/** ORDER BY expression per sort field. */
const SORT_COLUMN = {
  title: "m.title",
  artist: "m.artist",
  album: "m.album",
  year: "m.year",
  duration: "m.duration_ms",
  rating: "m.rating",
  addedAt: "m.added_at",
} as const;

/**
 * Convert a rule document into the full SELECT (WHERE / ORDER BY / LIMIT).
 *
 * Exported for the unit tests; `evaluateSmartPlaylist` executes it.
 *
 * @param rules - The rule document.
 * @param now - Evaluation instant.
 * @returns The complete SQL and its parameters.
 */
export const buildSmartSql = (
  rules: SmartPlaylistRules,
  now: Date,
): SqlFragment => {
  const fragments = rules.conditions.map((condition) =>
    buildConditionSql(condition, now),
  );
  const joiner = rules.match === "all" ? " AND " : " OR ";
  const where =
    fragments.length > 0
      ? `WHERE ${fragments.map((fragment) => `(${fragment.sql})`).join(joiner)}`
      : "";
  const orderBy =
    rules.sort === undefined
      ? "ORDER BY m.artist, m.album, m.disc, m.track"
      : rules.sort.field === "random"
        ? "ORDER BY RANDOM()"
        : `ORDER BY ${SORT_COLUMN[rules.sort.field]} ${
            rules.sort.order === "desc" ? "DESC" : "ASC"
          }`;
  const params = fragments.flatMap((fragment) => [...fragment.params]);
  const limit =
    rules.limit !== undefined && rules.limit > 0 ? rules.limit : null;
  return {
    sql: `SELECT ${MUSIC_COLUMNS}
FROM musics m
LEFT JOIN pictures p ON p.id = m.picture_id
${where}
${orderBy}
${limit !== null ? "LIMIT ?" : ""}`.trim(),
    params: limit !== null ? [...params, limit] : params,
  };
};
