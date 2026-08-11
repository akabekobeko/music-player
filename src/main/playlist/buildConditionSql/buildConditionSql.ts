import type { SmartCondition } from "../../ipc/types";
import type { SqlFragment } from "../types";
import { escapeLikePattern } from "./escapeLikePattern";

/** One day in milliseconds (the `addedAt inLastDays` window unit). */
const DAY_MS = 24 * 60 * 60 * 1000;

/** Columns of the string-condition fields. */
const TEXT_COLUMN = {
  artist: "m.artist",
  albumArtist: "m.album_artist",
  album: "m.album",
  genre: "m.genre",
  title: "m.title",
} as const;

/**
 * Convert one condition into a WHERE fragment.
 *
 * Rules are converted to a prepared-statement WHERE clause — placeholders
 * only, never string-built values (`docs/specs/v1.0/features/playlist.md`).
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
