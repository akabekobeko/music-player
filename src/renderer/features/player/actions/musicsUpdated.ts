import type { Music } from "@mp/ipc";

/**
 * Tracks were edited and re-read from their files
 * (`docs/specs/v1.1/features/library-refresh.md`): the queue and the
 * current track swap in the new values of the same ids. Playback is not
 * touched (a current track stopped before the write stays stopped).
 */
export type MusicsUpdatedAction = {
  readonly type: "musicsUpdated";
  readonly musics: readonly Music[];
};
