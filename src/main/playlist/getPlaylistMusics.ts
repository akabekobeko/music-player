import type { DatabaseSync } from "node:sqlite";
import type { Music, PlaylistGetMusicsRequest } from "../ipc/types";
import { MUSIC_COLUMNS, type MusicRow } from "../library/MUSIC_COLUMNS";
import { evaluateSmartPlaylist } from "./evaluateSmartPlaylist";
import { readPlaylist } from "./readPlaylist";

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
