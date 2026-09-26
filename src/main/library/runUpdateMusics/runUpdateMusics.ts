import type { DatabaseSync } from "node:sqlite";
import type { PictureInfo } from "@akabeko/music-metadata-editor";
import { albumKeyOf } from "../../../shared/albumKeyOf";
import { displayArtistOf } from "../../../shared/displayArtistOf";
import type {
  IpcError,
  UpdatedMusic,
  UpdateMusicsRequest,
  UpdateMusicsSummary,
  UpdateProgressPayload,
} from "../../ipc/types";
import { toIpcError } from "../../ipc/utils/toIpcError";
import { imagesDirectory } from "../../protocol/imagesDirectory";
import { getMusicsByIds } from "../getMusicsByIds";
import { getOrCreatePictureId } from "../getOrCreatePictureId";
import { upsertMusic } from "../musicRepository";
import { registerArtistPictureIfMissing } from "../registerArtistPictureIfMissing";
import { saveArtwork } from "../saveArtwork";
import { selectArtworkPicture } from "../selectArtworkPicture";
import { mapTrackToMusicRow } from "../trackMapping";
import { clearMusicPictureId } from "./clearMusicPictureId";
import {
  DEFAULT_WRITE_DEPS,
  type WriteMusicFileDeps,
  writeMusicFile,
} from "./writeMusicFile";

/** Callbacks the IPC layer injects into one update run. */
export type UpdateRunEvents = {
  /** Progress sink → `mp:library:updateProgress` push. */
  readonly onProgress: (payload: UpdateProgressPayload) => void;
};

/** Injectable seams (real mme / fs in production, fakes in tests). */
export type UpdateRunDeps = WriteMusicFileDeps & {
  /** Persist one artwork image; returns its absolute path. */
  readonly saveArtwork: (picture: PictureInfo) => Promise<string>;
  /** ISO-8601 clock for `updated_at`. */
  readonly now: () => string;
};

const DEFAULT_DEPS: UpdateRunDeps = {
  ...DEFAULT_WRITE_DEPS,
  saveArtwork: (picture) => saveArtwork(imagesDirectory(), picture),
  now: () => new Date().toISOString(),
};

/**
 * Apply one tag / artwork change to several tracks
 * (`docs/specs/v1.1/architecture/metadata-write.md`).
 *
 * Files are rewritten one at a time (serial — the I/O contention of
 * parallel writes outweighs the gain) and each one is re-read and upserted
 * in its own short transaction, so the DB only ever mirrors what is really
 * in the file. One failed file never aborts the run: it lands in
 * `failed` and the loop moves on. Orphan GC and the `mp:library:changed`
 * broadcast are the caller's job, once per run.
 *
 * @param db - The open library connection.
 * @param request - Tracks to update plus the change to apply.
 * @param events - Progress hook.
 * @param deps - Injectable seams; omit for production defaults.
 * @returns The aggregate summary.
 * @throws When an id is not in the library (nothing has been written yet).
 */
export const runUpdateMusics = async (
  db: DatabaseSync,
  request: UpdateMusicsRequest,
  events: UpdateRunEvents,
  deps: UpdateRunDeps = DEFAULT_DEPS,
): Promise<UpdateMusicsSummary> => {
  const musics = getMusicsByIds(db, request.musicIds);
  if (musics.length !== request.musicIds.length) {
    const known = new Set(musics.map((music) => music.id));
    const missing = request.musicIds.filter((id) => !known.has(id));
    throw Object.assign(
      new Error(`Unknown music id(s): ${missing.join(", ")}`),
      { code: "MUSIC_NOT_FOUND" },
    );
  }

  const updated: UpdatedMusic[] = [];
  const failed: Array<{ musicId: number; filePath: string; error: IpcError }> =
    [];

  for (const [index, music] of musics.entries()) {
    try {
      const track = await writeMusicFile(
        music.filePath,
        request.patch,
        request.picture,
        deps,
      );
      // Reader warnings do not fail the track; they are a development aid.
      if (import.meta.env.DEV) {
        for (const warning of track.warnings) {
          console.warn(`[update] ${music.filePath}: ${warning.message}`);
        }
      }

      // Artwork is best-effort, as on import: a failed image write degrades
      // the track to "no artwork" instead of failing the update. An explicit
      // removal skips extraction so a remaining back cover is not promoted.
      let artworkPath: string | null = null;
      const picture =
        request.picture === null ? null : selectArtworkPicture(track.pictures);
      if (picture !== null) {
        try {
          artworkPath = await deps.saveArtwork(picture);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn(
              `[update] ${music.filePath}: artwork save failed`,
              error,
            );
          }
        }
      }

      const row = mapTrackToMusicRow(track, music.filePath);
      const now = deps.now();
      db.exec("BEGIN");
      try {
        const pictureId =
          artworkPath !== null ? getOrCreatePictureId(db, artworkPath) : null;
        upsertMusic(db, row, now, pictureId);
        if (request.picture === null) {
          clearMusicPictureId(db, music.id);
        }

        if (pictureId !== null) {
          registerArtistPictureIfMissing(db, displayArtistOf(row), pictureId);
        }

        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }

      const refreshed = getMusicsByIds(db, [music.id])[0];
      if (refreshed === undefined) {
        throw new Error(`Music ${music.id} vanished during the update.`);
      }

      const displayArtist = displayArtistOf(refreshed);
      updated.push({
        music: refreshed,
        displayArtist,
        albumKey: albumKeyOf(displayArtist, refreshed.album),
      });
    } catch (error) {
      failed.push({
        musicId: music.id,
        filePath: music.filePath,
        error: toIpcError(error),
      });
    }

    events.onProgress({
      current: index + 1,
      total: musics.length,
      filePath: music.filePath,
    });
  }

  return { updated, failed };
};
