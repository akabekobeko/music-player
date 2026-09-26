import type { DatabaseSync } from "node:sqlite";
import { groupMusicsByAlbum } from "../../../shared/groupMusicsByAlbum";
import type {
  FetchMusicInfoRequest,
  FetchMusicInfoSummary,
  FetchMusicResult,
  FetchProgressPayload,
  IpcError,
  Music,
  UpdatedMusic,
  UpdateMusicsRequest,
  UpdateMusicsSummary,
} from "../../ipc/types";
import { getMusicsByIds } from "../../library/getMusicsByIds";
import { runUpdateMusics } from "../../library/runUpdateMusics/runUpdateMusics";
import {
  type AlbumGroupLookup,
  lookupAlbumGroup,
} from "../lookupMusicInfo/lookupAlbumGroup";
import type { MusicBrainzRequestOptions } from "../MusicBrainzClient/MusicBrainzClient";
import { missingPatchOf } from "../missingPatchOf";
import { musicBrainzClient } from "../musicBrainzClient";

/** Callbacks and cancellation the IPC layer injects into one run. */
export type FetchRunEvents = {
  /** Progress sink for the `mp:musicbrainz:fetchProgress` push. */
  readonly onProgress: (payload: FetchProgressPayload) => void;
  /**
   * Cancellation from `mp:musicbrainz:cancelFetch`: checked at every group
   * and track boundary, and handed to the client to cut a request short.
   */
  readonly signal: AbortSignal;
};

/** Injectable seams (the real client and write pipeline in production). */
export type FetchRunDeps = {
  /** Candidate lookup of one album group (`lookupAlbumGroup`). */
  readonly lookupAlbumGroup: (
    musics: readonly Music[],
    options: MusicBrainzRequestOptions,
  ) => Promise<AlbumGroupLookup>;
  /** Write one track's patch / picture (`runUpdateMusics` without progress). */
  readonly updateMusics: (
    db: DatabaseSync,
    request: UpdateMusicsRequest,
  ) => Promise<UpdateMusicsSummary>;
};

const DEFAULT_DEPS: FetchRunDeps = {
  lookupAlbumGroup: (musics, options) =>
    lookupAlbumGroup(musicBrainzClient, musics, options),
  updateMusics: (db, request) =>
    runUpdateMusics(db, request, { onProgress: () => undefined }),
};

/**
 * Complete the missing tags and artwork of tracks from MusicBrainz
 * (`docs/specs/v1.2/architecture/fetch-run.md`).
 *
 * The tracks are grouped by album identity and each group is looked up as
 * a whole (`lookupAlbumGroup`); per track, only what `missingPatchOf`
 * reports is written through the v1.1 pipeline, one track at a time
 * because every patch differs. One failed track never aborts the run. The
 * orphan GC and the library broadcast are the caller's job, once per run.
 *
 * Cancellation is honoured at group and track boundaries: writes already
 * made stay, the rest is dropped and the summary says `cancelled`.
 *
 * @param db - The open library connection.
 * @param request - Tracks to complete.
 * @param events - Progress hook and cancellation signal.
 * @param deps - Injectable seams; omit for production defaults.
 * @returns The aggregate summary.
 */
export const runFetchMusicInfo = async (
  db: DatabaseSync,
  request: FetchMusicInfoRequest,
  events: FetchRunEvents,
  deps: FetchRunDeps = DEFAULT_DEPS,
): Promise<FetchMusicInfoSummary> => {
  const musics = getMusicsByIds(db, request.musicIds);
  const known = new Set(musics.map((music) => music.id));
  const updated: UpdatedMusic[] = [];
  const unchanged: Array<{ musicId: number; filePath: string }> = [];
  const notFound: Array<{ musicId: number; filePath: string }> = [];
  const failed: Array<{ musicId: number; filePath: string; error: IpcError }> =
    [];
  for (const id of request.musicIds) {
    if (!known.has(id)) {
      failed.push({
        musicId: id,
        filePath: "",
        error: {
          name: "Error",
          code: "MUSIC_NOT_FOUND",
          message: `Unknown music id: ${id}`,
        },
      });
    }
  }

  const total = musics.length;
  let current = 0;
  let cancelled = false;

  groups: for (const group of groupMusicsByAlbum(musics)) {
    if (events.signal.aborted) {
      cancelled = true;
      break;
    }

    const lookups = await deps.lookupAlbumGroup(group, {
      signal: events.signal,
    });
    for (const music of group) {
      if (events.signal.aborted) {
        cancelled = true;
        break groups;
      }

      let result: FetchMusicResult;
      const lookup = lookups.get(music.id) ?? { ok: true, value: null };
      if (!lookup.ok) {
        failed.push({
          musicId: music.id,
          filePath: music.filePath,
          error: {
            name: "MusicBrainzError",
            code: lookup.error.code,
            message: lookup.error.message,
          },
        });
        result = "failed";
      } else if (lookup.value === null) {
        notFound.push({ musicId: music.id, filePath: music.filePath });
        result = "notFound";
      } else {
        const { patch, picture } = missingPatchOf(music, lookup.value);
        if (Object.keys(patch).length === 0 && picture === undefined) {
          unchanged.push({ musicId: music.id, filePath: music.filePath });
          result = "unchanged";
        } else {
          const written = await deps.updateMusics(db, {
            musicIds: [music.id],
            patch,
            ...(picture === undefined ? {} : { picture }),
          });
          const entry = written.updated[0];
          if (entry !== undefined) {
            updated.push(entry);
            result = "updated";
          } else {
            failed.push(
              written.failed[0] ?? {
                musicId: music.id,
                filePath: music.filePath,
                error: {
                  name: "Error",
                  message: "The write reported nothing.",
                },
              },
            );
            result = "failed";
          }
        }
      }

      current += 1;
      events.onProgress({
        current,
        total,
        filePath: music.filePath,
        result,
      });
    }
  }

  return { updated, unchanged, notFound, failed, cancelled };
};
