import type { DatabaseSync } from "node:sqlite";
import type {
  Music,
  Playlist,
  PlaylistCreateRequest,
  PlaylistGetMusicsRequest,
  PlaylistRemoveRequest,
  PlaylistUpdateRequest,
  SmartPlaylistRules,
} from "../ipc/types";
import { MUSIC_COLUMNS, type MusicRow } from "../library/musicQueries";
import { evaluateSmartPlaylist } from "./smartQuery";

/**
 * Playlist queries for the `mp:playlist:*` channels
 * (`docs/specs/v1.0/features/playlist.md`). Static playlists live in
 * `playlists` / `playlist_musics` (position = identity, duplicates allowed);
 * smart playlists store only their rule JSON in `smart_playlists` and are
 * evaluated per request (`smartQuery.ts`).
 */

/** Row shape shared by the two playlist tables' SELECTs. */
type PlaylistRow = {
  id: number;
  name: string;
  sortOrder: number;
  rules?: string;
};

/** Table + kind pairing so each helper can address one of the two tables. */
const TABLE_OF = { static: "playlists", smart: "smart_playlists" } as const;

/**
 * List every playlist of both kinds, each ordered by sort order then name.
 * Static playlists come first.
 *
 * @param db - The open library connection.
 * @returns Playlists; smart entries carry their parsed rules.
 */
export const listPlaylists = (db: DatabaseSync): Playlist[] => {
  const statics = db
    .prepare(
      `SELECT id, name, sort_order AS sortOrder
       FROM playlists ORDER BY sort_order, name`,
    )
    .all() as PlaylistRow[];
  const smarts = db
    .prepare(
      `SELECT id, name, sort_order AS sortOrder, rules
       FROM smart_playlists ORDER BY sort_order, name`,
    )
    .all() as PlaylistRow[];
  return [
    ...statics.map(
      (row): Playlist => ({
        id: row.id,
        kind: "static",
        name: row.name,
        sortOrder: row.sortOrder,
      }),
    ),
    ...smarts.map(
      (row): Playlist => ({
        id: row.id,
        kind: "smart",
        name: row.name,
        sortOrder: row.sortOrder,
        rules: JSON.parse(row.rules ?? "null") as SmartPlaylistRules,
      }),
    ),
  ];
};

/** Read one playlist row back, throwing when the id does not exist. */
const readPlaylist = (
  db: DatabaseSync,
  kind: Playlist["kind"],
  id: number,
): Playlist => {
  const row = db
    .prepare(
      kind === "static"
        ? "SELECT id, name, sort_order AS sortOrder FROM playlists WHERE id = ?"
        : "SELECT id, name, sort_order AS sortOrder, rules FROM smart_playlists WHERE id = ?",
    )
    .get(id) as PlaylistRow | undefined;
  if (row === undefined) {
    throw new Error(`Playlist not found: ${kind} #${id}`);
  }

  return {
    id: row.id,
    kind,
    name: row.name,
    sortOrder: row.sortOrder,
    ...(kind === "smart"
      ? { rules: JSON.parse(row.rules ?? "null") as SmartPlaylistRules }
      : {}),
  };
};

/**
 * Create a playlist at the end of its kind's sort order.
 *
 * @param db - The open library connection.
 * @param request - Name, kind, and (for smart) the rule document.
 * @param now - ISO-8601 timestamp for created_at / updated_at.
 * @returns The created playlist.
 */
export const createPlaylist = (
  db: DatabaseSync,
  request: PlaylistCreateRequest,
  now: string,
): Playlist => {
  if (request.kind === "smart" && request.rules === undefined) {
    throw new Error("Smart playlist requires rules");
  }

  const table = TABLE_OF[request.kind];
  const nextOrder = (
    db
      .prepare(`SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM ${table}`)
      .get() as { next: number }
  ).next;
  const result =
    request.kind === "static"
      ? db
          .prepare(
            `INSERT INTO playlists (name, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?)`,
          )
          .run(request.name, nextOrder, now, now)
      : db
          .prepare(
            `INSERT INTO smart_playlists (name, rules, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)`,
          )
          .run(
            request.name,
            JSON.stringify(request.rules),
            nextOrder,
            now,
            now,
          );
  return readPlaylist(db, request.kind, Number(result.lastInsertRowid));
};

/**
 * Update a playlist. Omitted fields keep their current value; `musicIds`
 * replaces a static playlist's full track order wholesale (delete + insert
 * in one transaction, as the database spec prescribes).
 *
 * @param db - The open library connection.
 * @param request - Patch of name / sortOrder / musicIds / rules.
 * @param now - ISO-8601 timestamp for updated_at.
 * @returns The updated playlist.
 */
export const updatePlaylist = (
  db: DatabaseSync,
  request: PlaylistUpdateRequest,
  now: string,
): Playlist => {
  const current = readPlaylist(db, request.kind, request.id); // Existence check.
  const name = request.name ?? current.name;
  const sortOrder = request.sortOrder ?? current.sortOrder;
  db.exec("BEGIN");
  try {
    if (request.kind === "static") {
      db.prepare(
        "UPDATE playlists SET name = ?, sort_order = ?, updated_at = ? WHERE id = ?",
      ).run(name, sortOrder, now, request.id);
      if (request.musicIds !== undefined) {
        db.prepare("DELETE FROM playlist_musics WHERE playlist_id = ?").run(
          request.id,
        );
        const insert = db.prepare(
          "INSERT INTO playlist_musics (playlist_id, position, music_id) VALUES (?, ?, ?)",
        );
        request.musicIds.forEach((musicId, position) => {
          insert.run(request.id, position, musicId);
        });
      }
    } else {
      const rules =
        request.rules !== undefined
          ? JSON.stringify(request.rules)
          : JSON.stringify(current.rules);
      db.prepare(
        "UPDATE smart_playlists SET name = ?, sort_order = ?, rules = ?, updated_at = ? WHERE id = ?",
      ).run(name, sortOrder, rules, now, request.id);
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return readPlaylist(db, request.kind, request.id);
};

/**
 * Delete a playlist. Static playlist rows cascade to `playlist_musics`.
 *
 * @param db - The open library connection.
 * @param request - Target id and kind.
 */
export const removePlaylist = (
  db: DatabaseSync,
  request: PlaylistRemoveRequest,
): void => {
  readPlaylist(db, request.kind, request.id); // Existence check.
  db.prepare(`DELETE FROM ${TABLE_OF[request.kind]} WHERE id = ?`).run(
    request.id,
  );
};

/**
 * Resolve a playlist's tracks (`mp:playlist:getMusics`).
 *
 * Static playlists join `playlist_musics` in position order (duplicated
 * tracks appear once per position). Smart playlists evaluate their rules
 * against the library on every call — the caller pins a play's result into
 * the queue, so playback never drifts mid-listen.
 *
 * @param db - The open library connection.
 * @param request - Target id and kind.
 * @returns The playlist's tracks in play order.
 */
export const getPlaylistMusics = (
  db: DatabaseSync,
  request: PlaylistGetMusicsRequest,
): Music[] => {
  const playlist = readPlaylist(db, request.kind, request.playlistId);
  if (request.kind === "smart") {
    if (playlist.rules == null) {
      throw new Error(`Smart playlist #${request.playlistId} has no rules`);
    }

    return evaluateSmartPlaylist(db, playlist.rules);
  }

  const rows = db
    .prepare(
      `SELECT ${MUSIC_COLUMNS}
       FROM playlist_musics pm
       JOIN musics m ON m.id = pm.music_id
       LEFT JOIN pictures p ON p.id = m.picture_id
       WHERE pm.playlist_id = ?
       ORDER BY pm.position`,
    )
    .all(request.playlistId) as MusicRow[];
  return rows.map((row) => ({ ...row })) as Music[];
};
