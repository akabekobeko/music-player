import type { DatabaseSync } from "node:sqlite";
import type { Music, SmartCondition, SmartPlaylistRules } from "../ipc/types";
import { MUSIC_COLUMNS, type MusicRow } from "../library/musicQueries";

/**
 * Smart-playlist rule evaluation (`docs/specs/v1.0/features/playlist.md`).
 *
 * Rules (`smart_playlists.rules` JSON) are converted to a prepared-statement
 * WHERE clause — placeholders only, never string-built values — and executed
 * per display / play. Play-count style conditions wait for the `plays` table
 * (v1.x).
 */

/** One day in milliseconds (the `addedAt inLastDays` window unit). */
const DAY_MS = 24 * 60 * 60 * 1000;

/** SQL fragment plus its bound parameters. */
type SqlFragment = {
  readonly sql: string;
  readonly params: ReadonlyArray<string | number>;
};

/** Columns of the string-condition fields. */
const TEXT_COLUMN = {
  artist: "m.artist",
  albumArtist: "m.album_artist",
  album: "m.album",
  genre: "m.genre",
  title: "m.title",
} as const;

/** Escape `%` / `_` / `\` so user text matches literally under `ESCAPE '\'`. */
const escapeLikePattern = (text: string): string =>
  text.replace(/[\\%_]/g, (ch) => `\\${ch}`);

/**
 * Convert one condition into a WHERE fragment.
 *
 * @param condition - Rule condition (validated by its type; malformed
 *   documents from a hand-edited DB throw and surface as an IPC error).
 * @param now - Evaluation instant (injected for testability).
 * @returns The SQL fragment.
 */
export const buildConditionSql = (
  condition: SmartCondition,
  now: Date,
): SqlFragment => {
  switch (condition.field) {
    case "artist":
    case "albumArtist":
    case "album":
    case "genre":
    case "title": {
      const column = TEXT_COLUMN[condition.field];
      switch (condition.operator) {
        case "is":
          return { sql: `${column} = ?`, params: [condition.value] };
        case "isNot":
          return { sql: `${column} <> ?`, params: [condition.value] };
        case "contains":
          return {
            sql: `${column} LIKE ? ESCAPE '\\'`,
            params: [`%${escapeLikePattern(condition.value)}%`],
          };
      }
      break;
    }
    case "year":
      switch (condition.operator) {
        case "is":
          return { sql: "m.year = ?", params: [condition.value] };
        case "between":
          return {
            sql: "m.year BETWEEN ? AND ?",
            params: [condition.value, condition.value2 ?? condition.value],
          };
        case "gte":
          return { sql: "m.year >= ?", params: [condition.value] };
        case "lte":
          return { sql: "m.year <= ?", params: [condition.value] };
      }
      break;
    case "rating":
      return {
        sql: condition.operator === "gte" ? "m.rating >= ?" : "m.rating <= ?",
        params: [condition.value],
      };
    case "duration":
      // The rule value is seconds; the column is milliseconds.
      return {
        sql:
          condition.operator === "gte"
            ? "m.duration_ms >= ?"
            : "m.duration_ms <= ?",
        params: [condition.value * 1000],
      };
    case "addedAt":
      return {
        sql: "m.added_at >= ?",
        params: [
          new Date(now.getTime() - condition.value * DAY_MS).toISOString(),
        ],
      };
  }

  throw new Error(
    `Unsupported smart playlist condition: ${JSON.stringify(condition)}`,
  );
};

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

/**
 * Evaluate a smart playlist's rules against the library.
 *
 * @param db - The open library connection.
 * @param rules - The rule document from `smart_playlists.rules`.
 * @param now - Evaluation instant (defaults to the current time).
 * @returns Matching tracks in the rules' sort order.
 */
export const evaluateSmartPlaylist = (
  db: DatabaseSync,
  rules: SmartPlaylistRules,
  now: Date = new Date(),
): Music[] => {
  const { sql, params } = buildSmartSql(rules, now);
  const rows = db.prepare(sql).all(...params) as MusicRow[];
  return rows.map((row) => ({ ...row })) as Music[];
};
